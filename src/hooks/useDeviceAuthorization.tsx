import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { generateDeviceFingerprint } from '@/utils/deviceFingerprint';

interface DeviceAuthState {
  status: 'checking' | 'authorized' | 'unauthorized';
  fingerprint: string;
  deviceName: string | null;
}

export function useDeviceAuthorization() {
  const [state, setState] = useState<DeviceAuthState>({
    status: 'checking',
    fingerprint: '',
    deviceName: null,
  });

  useEffect(() => {
    const checkDevice = async () => {
      const fingerprint = generateDeviceFingerprint();

      const { data, error } = await supabase
        .from('registered_devices')
        .select('id, device_name, is_active')
        .eq('device_fingerprint', fingerprint)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Device check error:', error);
        setState({ status: 'unauthorized', fingerprint, deviceName: null });
        return;
      }

      if (data) {
        // Update last_used_at
        await supabase
          .from('registered_devices')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', data.id);

        localStorage.setItem('device_id', data.id);
        setState({ status: 'authorized', fingerprint, deviceName: data.device_name });
      } else {
        localStorage.removeItem('device_id');
        setState({ status: 'unauthorized', fingerprint, deviceName: null });
      }
    };

    checkDevice();
  }, []);

  return state;
}
