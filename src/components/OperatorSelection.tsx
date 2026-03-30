import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { OperatorCard } from './OperatorCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAllOperatorsClockStatus } from '@/hooks/useClockStatus';

interface Operator {
  id: string;
  operator_name: string;
  operator_code: string;
}

export function OperatorSelection() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { statuses, loading: clockLoading, getOperatorStatus } = useAllOperatorsClockStatus();

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const { data, error } = await supabase
        .from('operators')
        .select('id, operator_name, operator_code')
        .eq('active', true)
        .order('operator_name');

      if (error) throw error;

      setOperators(data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
      setError('Failed to load operators');
      toast({
        title: 'Error',
        description: 'Failed to load operators',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || clockLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading operators...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Your Operator</CardTitle>
        <p className="text-muted-foreground">Choose your operator profile to access your timesheet</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {operators.map((operator) => (
            <OperatorCard 
              key={operator.id} 
              operator={operator} 
              clockStatus={getOperatorStatus(operator.id)}
            />
          ))}
        </div>
        {operators.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No active operators found. Contact your administrator to set up operator accounts.
          </p>
        )}
      </CardContent>
    </Card>
  );
}