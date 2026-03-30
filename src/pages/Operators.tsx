import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2, Search, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ClockStatusIndicator } from '@/components/ClockStatusIndicator';
import { formatDate } from '@/utils/dateUtils';

interface Operator {
  id: string;
  operator_name: string;
  operator_code: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

interface OperatorFormData {
  operator_name: string;
  operator_code: string;
  active: boolean;
}

export default function Operators() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [formData, setFormData] = useState<OperatorFormData>({
    operator_name: '',
    operator_code: '',
    active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('operators')
        .select('*')
        .order('operator_name');

      if (error) throw error;
      setOperators(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading operators",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.operator_name.trim() || !formData.operator_code.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('operators')
        .insert([{
          operator_name: formData.operator_name.trim(),
          operator_code: formData.operator_code.trim().toUpperCase(),
          active: formData.active,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Operator added successfully",
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchOperators();
    } catch (error: any) {
      toast({
        title: "Error adding operator",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedOperator || !formData.operator_name.trim() || !formData.operator_code.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('operators')
        .update({
          operator_name: formData.operator_name.trim(),
          operator_code: formData.operator_code.trim().toUpperCase(),
          active: formData.active,
        })
        .eq('id', selectedOperator.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Operator updated successfully",
      });

      setIsEditDialogOpen(false);
      resetForm();
      setSelectedOperator(null);
      fetchOperators();
    } catch (error: any) {
      toast({
        title: "Error updating operator",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOperator) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('operators')
        .delete()
        .eq('id', selectedOperator.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Operator deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setSelectedOperator(null);
      fetchOperators();
    } catch (error: any) {
      toast({
        title: "Error deleting operator",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleOperatorStatus = async (operator: Operator) => {
    try {
      const { error } = await supabase
        .from('operators')
        .update({ active: !operator.active })
        .eq('id', operator.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Operator ${!operator.active ? 'activated' : 'deactivated'} successfully`,
      });

      fetchOperators();
    } catch (error: any) {
      toast({
        title: "Error updating operator status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      operator_name: '',
      operator_code: '',
      active: true,
    });
  };

  const openEditDialog = (operator: Operator) => {
    setSelectedOperator(operator);
    setFormData({
      operator_name: operator.operator_name,
      operator_code: operator.operator_code,
      active: operator.active,
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (operator: Operator) => {
    setSelectedOperator(operator);
    setIsDeleteDialogOpen(true);
  };

  const filteredOperators = operators.filter(operator =>
    operator.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    operator.operator_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Operators</h1>
          <p className="text-muted-foreground">Operator management and performance tracking</p>
        </div>
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Operators</h1>
          <p className="text-muted-foreground">Manage operators and track performance</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Operator
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Operator</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="operator_name">Operator Name *</Label>
                <Input
                  id="operator_name"
                  value={formData.operator_name}
                  onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
                  placeholder="Enter operator name"
                />
              </div>
              <div>
                <Label htmlFor="operator_code">Operator Code *</Label>
                <Input
                  id="operator_code"
                  value={formData.operator_code}
                  onChange={(e) => setFormData({ ...formData, operator_code: e.target.value.toUpperCase() })}
                  placeholder="Enter operator code"
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Operator'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Operators ({filteredOperators.length})</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search operators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredOperators.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No operators found matching your search.' : 'No operators found. Add your first operator to get started.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Clock Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperators.map((operator) => (
                  <TableRow key={operator.id}>
                    <TableCell className="font-medium">{operator.operator_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{operator.operator_code}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={operator.active ? "default" : "secondary"}
                        className={operator.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}
                      >
                        {operator.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {operator.active && (
                        <ClockStatusIndicator 
                          operatorId={operator.id}
                          operatorName={operator.operator_name}
                          compact={true}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(operator.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleOperatorStatus(operator)}
                          title={operator.active ? 'Deactivate' : 'Activate'}
                        >
                          {operator.active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(operator)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(operator)}
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Operator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_operator_name">Operator Name *</Label>
              <Input
                id="edit_operator_name"
                value={formData.operator_name}
                onChange={(e) => setFormData({ ...formData, operator_name: e.target.value })}
                placeholder="Enter operator name"
              />
            </div>
            <div>
              <Label htmlFor="edit_operator_code">Operator Code *</Label>
              <Input
                id="edit_operator_code"
                value={formData.operator_code}
                onChange={(e) => setFormData({ ...formData, operator_code: e.target.value.toUpperCase() })}
                placeholder="Enter operator code"
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit_active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="edit_active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Operator'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Operator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete operator "{selectedOperator?.operator_name}"? 
              This action cannot be undone and may affect related records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}