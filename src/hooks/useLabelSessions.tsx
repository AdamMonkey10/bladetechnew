import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface LaserSession {
  id?: string;
  laser_machine_id: string;
  customer_po_id?: string;
  sku?: string;
  quantity?: number;
  invoice?: string;
  operator_id?: string;
  session_date: string;
}

interface SessionData {
  customer_po_id: string;
  customer: string;
  PO: string;
  invoice: string;
  SKU: string;
  quantity: string;
  totalUnits: number;
  boxAmount: number;
  date: string;
  operator_id: string;
  operator_name: string;
  laser_machine_id: string;
  laser_name: string;
}

const STORAGE_KEY = 'label_printing_sessions';

export function useLabelSessions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<Record<string, SessionData>>({});
  const [loading, setLoading] = useState(true);

  // Load sessions from localStorage and database
  const loadSessions = useCallback(async () => {
    if (!user) return;
    
    try {
      // Load from localStorage first for immediate UI update
      const localSessions = localStorage.getItem(STORAGE_KEY);
      if (localSessions) {
        setSessions(JSON.parse(localSessions));
      }

      // Then load from database
      const { data, error } = await supabase
        .from('label_printing_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        const dbSessions: Record<string, SessionData> = {};
        data.forEach((session: any) => {
          dbSessions[session.laser_machine_id] = {
            customer_po_id: session.customer_po_id || '',
            customer: session.customer_pos?.customer_name || '',
            PO: session.customer_pos?.po_number || '',
            invoice: session.invoice || '',
            SKU: session.sku || '',
            quantity: session.quantity?.toString() || '',
            totalUnits: session.quantity || 0,
            boxAmount: 0, // Will be populated when product is selected
            date: session.session_date,
            operator_id: session.operator_id || '',
            operator_name: session.operators?.operator_name || '',
            laser_machine_id: session.laser_machine_id,
            laser_name: session.machines?.machine_name || ''
          };
        });
        setSessions(dbSessions);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dbSessions));
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Save session to both localStorage and database
  const saveSession = useCallback(async (laserMachineId: string, sessionData: SessionData) => {
    if (!user) return;

    const updatedSessions = { ...sessions, [laserMachineId]: sessionData };
    setSessions(updatedSessions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSessions));

    try {
      const sessionPayload: LaserSession = {
        laser_machine_id: laserMachineId,
        customer_po_id: sessionData.customer_po_id || undefined,
        sku: sessionData.SKU || undefined,
        quantity: parseInt(sessionData.quantity) || undefined,
        invoice: sessionData.invoice || undefined,
        operator_id: sessionData.operator_id || undefined,
        session_date: sessionData.date
      };

      const { error } = await supabase
        .from('label_printing_sessions')
        .upsert({
          user_id: user.id,
          ...sessionPayload
        }, {
          onConflict: 'user_id,laser_machine_id,session_date'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Warning",
        description: "Session saved locally but not synced to server",
        variant: "destructive",
      });
    }
  }, [user, sessions, toast]);

  // Clear all sessions
  const clearAllSessions = useCallback(() => {
    setSessions({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Get session for specific laser
  const getSession = useCallback((laserMachineId: string): SessionData => {
    return sessions[laserMachineId] || {
      customer_po_id: '',
      customer: '',
      PO: '',
      invoice: '',
      SKU: '',
      quantity: '',
      totalUnits: 0,
      boxAmount: 0,
      date: new Date().toISOString().split('T')[0],
      operator_id: '',
      operator_name: '',
      laser_machine_id: laserMachineId,
      laser_name: ''
    };
  }, [sessions]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    loading,
    saveSession,
    clearAllSessions,
    getSession
  };
}