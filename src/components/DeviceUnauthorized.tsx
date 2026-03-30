import { ShieldX, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface DeviceUnauthorizedProps {
  fingerprint: string;
}

export function DeviceUnauthorized({ fingerprint }: DeviceUnauthorizedProps) {
  const { toast } = useToast();

  const copyFingerprint = () => {
    navigator.clipboard.writeText(fingerprint);
    toast({ title: 'Copied', description: 'Fingerprint copied to clipboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-destructive" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Device Not Authorized</h1>
        <p className="text-muted-foreground">
          This device is not registered for access. Please contact an administrator
          and provide the fingerprint below to register this device.
        </p>
        <div className="bg-muted rounded-lg p-4 space-y-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Device Fingerprint
          </p>
          <code className="text-sm font-mono text-foreground break-all block">
            {fingerprint}
          </code>
          <Button variant="outline" size="sm" onClick={copyFingerprint} className="mt-2">
            <Copy className="w-4 h-4 mr-2" />
            Copy Fingerprint
          </Button>
        </div>
      </div>
    </div>
  );
}
