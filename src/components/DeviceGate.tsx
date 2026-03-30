import { ReactNode } from 'react';
import { useDeviceAuthorization } from '@/hooks/useDeviceAuthorization';
import { DeviceUnauthorized } from '@/components/DeviceUnauthorized';

export function DeviceGate({ children }: { children: ReactNode }) {
  const { status, fingerprint } = useDeviceAuthorization();

  if (status === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-lg text-muted-foreground">Verifying device…</div>
      </div>
    );
  }

  if (status === 'unauthorized') {
    return <DeviceUnauthorized fingerprint={fingerprint} />;
  }

  return <>{children}</>;
}
