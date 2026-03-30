import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Settings, Package2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const rawMaterialSchema = z.object({
  material_code: z.string().min(1, 'Material code is required'),
  material_name: z.string().min(1, 'Material name is required'),
  description: z.string().optional(),
  revision: z.string().min(1, 'Revision is required'),
  specification_date: z.string().min(1, 'Specification date is required')
});

const specificationSchema = z.object({
  height_min: z.number().optional(),
  height_max: z.number().optional(),
  height_target: z.number().optional(),
  gauge_min: z.number().optional(),
  gauge_max: z.number().optional(),
  gauge_target: z.number().optional(),
  set_left_min: z.number().optional(),
  set_left_max: z.number().optional(),
  set_left_target: z.number().optional(),
  set_right_min: z.number().optional(),
  set_right_max: z.number().optional(),
  set_right_target: z.number().optional()
});

type RawMaterialForm = z.infer<typeof rawMaterialSchema>;
type SpecificationForm = z.infer<typeof specificationSchema>;

interface RawMaterial {
  id: string;
  material_code: string;
  material_name: string;
  description: string | null;
  revision: string | null;
  specification_date: string | null;
  created_at: string;
}

interface RawMaterialSpecification {
  id: string;
  material_code: string;
  height_min: number | null;
  height_max: number | null;
  gauge_min: number | null;
  gauge_max: number | null;
  set_left_min: number | null;
  set_left_max: number | null;
  set_right_min: number | null;
  set_right_max: number | null;
}

export default function RawMaterialManagement() {
  const { toast } = useToast();
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [specDialogOpen, setSpecDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null);
  const [specPromptOpen, setSpecPromptOpen] = useState(false);
  const [newlyCreatedMaterial, setNewlyCreatedMaterial] = useState<RawMaterial | null>(null);

  const {
    register: registerMaterial,
    handleSubmit: handleSubmitMaterial,
    formState: { errors: materialErrors },
    reset: resetMaterial,
    setValue: setMaterialValue
  } = useForm<RawMaterialForm>({
    resolver: zodResolver(rawMaterialSchema),
    defaultValues: {
      revision: '1.0',
      specification_date: new Date().toISOString().split('T')[0]
    }
  });

  const {
    register: registerSpec,
    handleSubmit: handleSubmitSpec,
    formState: { errors: specErrors },
    reset: resetSpec,
    setValue: setSpecValue
  } = useForm<SpecificationForm>({
    resolver: zodResolver(specificationSchema)
  });

  useEffect(() => {
    loadRawMaterials();
  }, []);

  const loadRawMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('raw_materials')
        .select('*')
        .order('material_code');
      
      if (error) throw error;
      setRawMaterials(data || []);
    } catch (error) {
      toast({
        title: "Error loading raw materials",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmitMaterial = async (data: RawMaterialForm) => {
    try {
      setLoading(true);

      if (editingMaterial) {
        const { error } = await supabase
          .from('raw_materials')
          .update({
            material_code: data.material_code,
            material_name: data.material_name,
            description: data.description || null,
            revision: data.revision,
            specification_date: data.specification_date
          })
          .eq('id', editingMaterial.id);

        if (error) throw error;

        toast({
          title: "Raw material updated successfully",
          description: `${data.material_code} has been updated.`,
        });
      } else {
        const { data: insertedData, error } = await supabase
          .from('raw_materials')
          .insert([{
            material_code: data.material_code,
            material_name: data.material_name,
            description: data.description || null,
            revision: data.revision,
            specification_date: data.specification_date
          }])
          .select()
          .single();

        if (error) throw error;

        toast({
          title: "Raw material created successfully",
          description: `${data.material_code} has been created.`,
        });

        // Store newly created material and prompt for specifications
        setNewlyCreatedMaterial(insertedData);
        setSpecPromptOpen(true);
      }

      resetMaterial();
      setEditingMaterial(null);
      setDialogOpen(false);
      if (editingMaterial) {
        loadRawMaterials();
      }
    } catch (error) {
      toast({
        title: "Error saving raw material",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const onSubmitSpecification = async (data: SpecificationForm) => {
    if (!selectedMaterial) return;

    try {
      setLoading(true);

      // Check if specification already exists
      const { data: existingSpec } = await supabase
        .from('raw_material_specifications')
        .select('id')
        .eq('material_code', selectedMaterial.material_code)
        .single();

      if (existingSpec) {
        // Update existing specification
        const { error } = await supabase
          .from('raw_material_specifications')
          .update({
            height_min: data.height_min || null,
            height_max: data.height_max || null,
            height_target: data.height_target || null,
            gauge_min: data.gauge_min || null,
            gauge_max: data.gauge_max || null,
            gauge_target: data.gauge_target || null,
            set_left_min: data.set_left_min || null,
            set_left_max: data.set_left_max || null,
            set_left_target: data.set_left_target || null,
            set_right_min: data.set_right_min || null,
            set_right_max: data.set_right_max || null,
            set_right_target: data.set_right_target || null
          })
          .eq('id', existingSpec.id);

        if (error) throw error;
      } else {
        // Create new specification
        const { error } = await supabase
          .from('raw_material_specifications')
          .insert([{
            material_code: selectedMaterial.material_code,
            height_min: data.height_min || null,
            height_max: data.height_max || null,
            height_target: data.height_target || null,
            gauge_min: data.gauge_min || null,
            gauge_max: data.gauge_max || null,
            gauge_target: data.gauge_target || null,
            set_left_min: data.set_left_min || null,
            set_left_max: data.set_left_max || null,
            set_left_target: data.set_left_target || null,
            set_right_min: data.set_right_min || null,
            set_right_max: data.set_right_max || null,
            set_right_target: data.set_right_target || null
          }]);

        if (error) throw error;
      }

      toast({
        title: "Specifications saved successfully",
        description: `Specifications for ${selectedMaterial.material_code} have been saved.`,
      });

      resetSpec();
      setSpecDialogOpen(false);
      setSelectedMaterial(null);
    } catch (error) {
      toast({
        title: "Error saving specifications",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    setMaterialValue('material_code', material.material_code);
    setMaterialValue('material_name', material.material_name);
    setMaterialValue('description', material.description || '');
    setMaterialValue('revision', material.revision || '1.0');
    setMaterialValue('specification_date', material.specification_date || new Date().toISOString().split('T')[0]);
    setDialogOpen(true);
  };

  const handleEditSpecifications = async (material: RawMaterial) => {
    setSelectedMaterial(material);
    
    // Load existing specifications
    try {
      const { data: spec } = await supabase
        .from('raw_material_specifications')
        .select('*')
        .eq('material_code', material.material_code)
        .single();

      if (spec) {
        setSpecValue('height_min', spec.height_min || undefined);
        setSpecValue('height_max', spec.height_max || undefined);
        setSpecValue('gauge_min', spec.gauge_min || undefined);
        setSpecValue('gauge_max', spec.gauge_max || undefined);
        setSpecValue('set_left_min', spec.set_left_min || undefined);
        setSpecValue('set_left_max', spec.set_left_max || undefined);
        setSpecValue('set_right_min', spec.set_right_min || undefined);
        setSpecValue('set_right_max', spec.set_right_max || undefined);
      } else {
        resetSpec();
      }
      
      setSpecDialogOpen(true);
    } catch (error) {
      resetSpec();
      setSpecDialogOpen(true);
    }
  };

  const handleNewMaterial = () => {
    setEditingMaterial(null);
    resetMaterial();
    setDialogOpen(true);
  };

  const handleSpecPromptResponse = (addSpecs: boolean) => {
    setSpecPromptOpen(false);
    if (addSpecs && newlyCreatedMaterial) {
      setSelectedMaterial(newlyCreatedMaterial);
      setSpecDialogOpen(true);
    } else {
      setNewlyCreatedMaterial(null);
      loadRawMaterials();
    }
  };

  const handleSpecDialogClose = (open: boolean) => {
    setSpecDialogOpen(open);
    if (!open && newlyCreatedMaterial) {
      setNewlyCreatedMaterial(null);
      loadRawMaterials();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Raw Material Management</h2>
          <p className="text-muted-foreground">Manage raw materials and their specifications</p>
        </div>
        <Button onClick={handleNewMaterial}>
          <Plus className="h-4 w-4 mr-2" />
          Add Raw Material
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package2 className="h-5 w-5" />
            Raw Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                 <TableRow>
                   <TableHead>Material Code</TableHead>
                   <TableHead>Material Name</TableHead>
                   <TableHead>Revision</TableHead>
                   <TableHead>Spec Date</TableHead>
                   <TableHead>Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {rawMaterials.map((material) => (
                   <TableRow key={material.id}>
                     <TableCell className="font-medium">{material.material_code}</TableCell>
                     <TableCell>{material.material_name}</TableCell>
                     <TableCell>{material.revision || '1.0'}</TableCell>
                     <TableCell>{material.specification_date || 'Not set'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(material)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSpecifications(material)}
                        >
                          <Settings className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Raw Material Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMaterial ? 'Edit Raw Material' : 'Add New Raw Material'}
            </DialogTitle>
            <DialogDescription>
              {editingMaterial 
                ? 'Update the raw material information below.' 
                : 'Enter the details for the new raw material.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitMaterial(onSubmitMaterial)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="material_code">Material Code *</Label>
                <Input
                  {...registerMaterial('material_code')}
                  placeholder="e.g., HCS025X239A"
                />
                {materialErrors.material_code && (
                  <p className="text-sm text-destructive">{materialErrors.material_code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="revision">Revision *</Label>
                <Input
                  {...registerMaterial('revision')}
                  placeholder="e.g., 1.0"
                />
                {materialErrors.revision && (
                  <p className="text-sm text-destructive">{materialErrors.revision.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="material_name">Material Name *</Label>
              <Input
                {...registerMaterial('material_name')}
                placeholder="e.g., High Carbon Steel Strip"
              />
              {materialErrors.material_name && (
                <p className="text-sm text-destructive">{materialErrors.material_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="specification_date">Specification Date *</Label>
              <Input
                {...registerMaterial('specification_date')}
                type="date"
              />
              {materialErrors.specification_date && (
                <p className="text-sm text-destructive">{materialErrors.specification_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                {...registerMaterial('description')}
                placeholder="Material description..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : editingMaterial ? 'Update Material' : 'Create Material'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Specification Prompt Dialog */}
      <Dialog open={specPromptOpen} onOpenChange={setSpecPromptOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Specifications?</DialogTitle>
            <DialogDescription>
              Raw material created successfully! Would you like to add specifications for {newlyCreatedMaterial?.material_code} now?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => handleSpecPromptResponse(false)}
            >
              Skip for Now
            </Button>
            <Button onClick={() => handleSpecPromptResponse(true)}>
              Yes, Add Specifications
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Specifications Dialog */}
      <Dialog open={specDialogOpen} onOpenChange={handleSpecDialogClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit Specifications</DialogTitle>
            <DialogDescription>
              Set quality specifications for {selectedMaterial?.material_code}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitSpec(onSubmitSpecification)} className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Height Specifications</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height_min">Min</Label>
                  <Input
                    {...registerSpec('height_min', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="25.0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height_target">Target</Label>
                  <Input
                    {...registerSpec('height_target', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="25.1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height_max">Max</Label>
                  <Input
                    {...registerSpec('height_max', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="25.2000"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Gauge Specifications</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gauge_min">Min</Label>
                  <Input
                    {...registerSpec('gauge_min', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="0.0220"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gauge_target">Target</Label>
                  <Input
                    {...registerSpec('gauge_target', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="0.0240"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gauge_max">Max</Label>
                  <Input
                    {...registerSpec('gauge_max', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="0.0260"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Set Left Specifications</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="set_left_min">Min</Label>
                  <Input
                    {...registerSpec('set_left_min', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="0.0100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="set_left_target">Target</Label>
                  <Input
                    {...registerSpec('set_left_target', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="0.0125"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="set_left_max">Max</Label>
                  <Input
                    {...registerSpec('set_left_max', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="0.0150"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Set Right Specifications</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="set_right_min">Min</Label>
                  <Input
                    {...registerSpec('set_right_min', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="0.0100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="set_right_target">Target</Label>
                  <Input
                    {...registerSpec('set_right_target', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="0.0125"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="set_right_max">Max</Label>
                  <Input
                    {...registerSpec('set_right_max', { valueAsNumber: true })}
                    type="number"
                    step="0.001"
                    placeholder="0.0150"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSpecDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Specifications'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}