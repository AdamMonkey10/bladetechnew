import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, ToggleLeft, ToggleRight, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

export default function DeviceManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ device_name: '', device_fingerprint: '', location: '' });

  const { data: devices = [], isLoading } = useQuery({
    queryKey: ['registered_devices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registered_devices')
        .select('*')
        .order('registered_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addDevice = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('registered_devices').insert({
        device_name: form.device_name,
        device_fingerprint: form.device_fingerprint,
        location: form.location || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registered_devices'] });
      toast({ title: 'Device registered' });
      setForm({ device_name: '', device_fingerprint: '', location: '' });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const toggleDevice = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('registered_devices')
        .update({ is_active: !is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['registered_devices'] }),
  });

  const deleteDevice = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('registered_devices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registered_devices'] });
      toast({ title: 'Device removed' });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Device Management</h1>
          <p className="text-muted-foreground">Register and manage authorized devices</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Add Device</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Register New Device</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Device Name *</Label>
                <Input value={form.device_name} onChange={e => setForm(f => ({ ...f, device_name: e.target.value }))} placeholder="e.g. Factory Kiosk 1" />
              </div>
              <div>
                <Label>Device Fingerprint *</Label>
                <Input value={form.device_fingerprint} onChange={e => setForm(f => ({ ...f, device_fingerprint: e.target.value }))} placeholder="Paste fingerprint from device screen" className="font-mono text-sm" />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Production Floor" />
              </div>
              <Button onClick={() => addDevice.mutate()} disabled={!form.device_name || !form.device_fingerprint || addDevice.isPending} className="w-full">
                {addDevice.isPending ? 'Registering…' : 'Register Device'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Registered Devices ({devices.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading…</div>
          ) : devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No devices registered yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Fingerprint</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.device_name}</TableCell>
                    <TableCell><code className="text-xs font-mono">{d.device_fingerprint}</code></TableCell>
                    <TableCell>{d.location || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={d.is_active ? 'default' : 'secondary'}>
                        {d.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {d.last_used_at ? new Date(d.last_used_at).toLocaleDateString() : 'Never'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => toggleDevice.mutate({ id: d.id, is_active: d.is_active })} title={d.is_active ? 'Deactivate' : 'Activate'}>
                          {d.is_active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteDevice.mutate(d.id)} title="Delete">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
