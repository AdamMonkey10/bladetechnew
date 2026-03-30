import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Plus, Edit, Wrench, Trash2, RefreshCw } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Equipment {
  id: string;
  equipment_name: string;
  equipment_serial: string | null;
  equipment_type: string | null;
  manufacturer: string | null;
  model: string | null;
  calibration_frequency_months: number;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface EquipmentForm {
  equipment_name: string;
  equipment_serial: string;
  equipment_type: string;
  manufacturer: string;
  model: string;
  calibration_frequency_months: number;
  status: string;
  notes: string;
}

interface EquipmentFormErrors {
  equipment_name?: string;
  calibration_frequency_months?: string;
}

const initialFormData: EquipmentForm = {
  equipment_name: '',
  equipment_serial: '',
  equipment_type: '',
  manufacturer: '',
  model: '',
  calibration_frequency_months: 6,
  status: 'active',
  notes: ''
};

export default function EquipmentManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [formData, setFormData] = useState<EquipmentForm>(initialFormData);
  const [errors, setErrors] = useState<EquipmentFormErrors>({});

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*')
        .order('equipment_name', { ascending: true });

      if (error) throw error;
      setEquipment(data || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      toast({
        title: "Error",
        description: "Failed to load equipment",
        variant: "destructive",
      });
    } finally {
      setLoadingEquipment(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: EquipmentFormErrors = {};

    if (!formData.equipment_name.trim()) newErrors.equipment_name = 'Equipment name is required';
    if (formData.calibration_frequency_months < 1) newErrors.calibration_frequency_months = 'Frequency must be at least 1 month';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const equipmentData = {
        equipment_name: formData.equipment_name.trim(),
        equipment_serial: formData.equipment_serial.trim() || null,
        equipment_type: formData.equipment_type.trim() || null,
        manufacturer: formData.manufacturer.trim() || null,
        model: formData.model.trim() || null,
        calibration_frequency_months: formData.calibration_frequency_months,
        status: formData.status,
        notes: formData.notes.trim() || null,
        created_by: user?.id
      };

      if (editingEquipment) {
        const { error } = await supabase
          .from('equipment')
          .update(equipmentData)
          .eq('id', editingEquipment.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Equipment updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('equipment')
          .insert(equipmentData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Equipment added successfully",
        });
      }

      setFormData(initialFormData);
      setErrors({});
      setIsDialogOpen(false);
      setEditingEquipment(null);
      fetchEquipment();

    } catch (error) {
      console.error('Error saving equipment:', error);
      toast({
        title: "Error",
        description: "Failed to save equipment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item: Equipment) => {
    setEditingEquipment(item);
    setFormData({
      equipment_name: item.equipment_name,
      equipment_serial: item.equipment_serial || '',
      equipment_type: item.equipment_type || '',
      manufacturer: item.manufacturer || '',
      model: item.model || '',
      calibration_frequency_months: item.calibration_frequency_months,
      status: item.status,
      notes: item.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingEquipment(null);
    setFormData(initialFormData);
    setErrors({});
    setIsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'retired':
        return <Badge variant="destructive">Retired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleSyncFromCalibration = async () => {
    setSyncing(true);
    try {
      // Get distinct equipment from calibration records
      const { data: calRecords, error: calErr } = await supabase
        .from('calibration_records')
        .select('equipment_name, equipment_serial');
      if (calErr) throw calErr;

      // Deduplicate by name+serial
      const seen = new Set<string>();
      const unique = (calRecords || []).filter(r => {
        const key = `${r.equipment_name}|${r.equipment_serial || ''}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Check which already exist
      const { data: existing } = await supabase.from('equipment').select('equipment_name, equipment_serial');
      const existingSet = new Set((existing || []).map(e => `${e.equipment_name}|${e.equipment_serial || ''}`));
      const toInsert = unique.filter(u => !existingSet.has(`${u.equipment_name}|${u.equipment_serial || ''}`));

      if (toInsert.length === 0) {
        toast({ title: 'Up to date', description: 'All calibration equipment is already in the list' });
        setSyncing(false);
        return;
      }

      const { error: insertErr } = await supabase.from('equipment').insert(
        toInsert.map(e => ({
          equipment_name: e.equipment_name,
          equipment_serial: e.equipment_serial,
          status: 'active',
          created_by: user?.id,
        }))
      );
      if (insertErr) throw insertErr;

      toast({ title: 'Synced', description: `Added ${toInsert.length} equipment from calibration records` });
      fetchEquipment();
    } catch (err) {
      console.error('Sync error:', err);
      toast({ title: 'Sync Failed', description: 'Could not import equipment from calibration records', variant: 'destructive' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Equipment Management</h2>
          <p className="text-muted-foreground">Manage calibration equipment inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSyncFromCalibration} disabled={syncing}>
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Sync from Calibration
          </Button>
          <Button onClick={handleAdd} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Equipment
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Equipment List
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingEquipment ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : equipment.length === 0 ? (
            <div className="text-center py-8">
              <Wrench className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No equipment found</p>
              <div className="flex justify-center gap-3 mt-4">
                <Button variant="outline" onClick={handleSyncFromCalibration} disabled={syncing}>
                  {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Import from Calibration Records
                </Button>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Equipment
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Serial</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Cal. Frequency</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.equipment_name}</TableCell>
                      <TableCell>{item.equipment_serial || '-'}</TableCell>
                      <TableCell>{item.equipment_type || '-'}</TableCell>
                      <TableCell>{item.manufacturer || '-'}</TableCell>
                      <TableCell>{item.model || '-'}</TableCell>
                      <TableCell>{item.calibration_frequency_months} months</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(item)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingEquipment ? 'Edit Equipment' : 'Add Equipment'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipment_name">
                  Equipment Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="equipment_name"
                  value={formData.equipment_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment_name: e.target.value }))}
                  placeholder="Enter equipment name"
                />
                {errors.equipment_name && (
                  <p className="text-sm text-destructive">{errors.equipment_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_serial">Serial Number</Label>
                <Input
                  id="equipment_serial"
                  value={formData.equipment_serial}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment_serial: e.target.value }))}
                  placeholder="Enter serial number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="equipment_type">Equipment Type</Label>
                <Input
                  id="equipment_type"
                  value={formData.equipment_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, equipment_type: e.target.value }))}
                  placeholder="e.g., Caliper, Micrometer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="manufacturer">Manufacturer</Label>
                <Input
                  id="manufacturer"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData(prev => ({ ...prev, manufacturer: e.target.value }))}
                  placeholder="Enter manufacturer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                  placeholder="Enter model"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="calibration_frequency_months">
                  Calibration Frequency (months) <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="calibration_frequency_months"
                  type="number"
                  min="1"
                  value={formData.calibration_frequency_months}
                  onChange={(e) => setFormData(prev => ({ ...prev, calibration_frequency_months: Number(e.target.value) || 6 }))}
                />
                {errors.calibration_frequency_months && (
                  <p className="text-sm text-destructive">{errors.calibration_frequency_months}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="retired">Retired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about the equipment"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {editingEquipment ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  editingEquipment ? 'Update Equipment' : 'Add Equipment'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}