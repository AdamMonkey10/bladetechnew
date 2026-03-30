import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { useCustomerPOs } from '@/hooks/useCustomerPOs';
import { useOptimizedCustomerPOs } from '@/hooks/useOptimizedQueries';
import { POForm } from '@/components/customer-po/POForm';
import { POList } from '@/components/customer-po/POList';
import { POImport } from '@/components/customer-po/POImport';
import { CustomerPO, POLineItem } from '@/hooks/useCustomerPOs';

export default function CustomerPOPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingPO, setEditingPO] = useState<CustomerPO | null>(null);
  const { pos, isLoading, createPO, updatePO, completePO, refetch } = useCustomerPOs();
  const { data: optimizedPOs } = useOptimizedCustomerPOs();

  const handleSubmit = async (data: any) => {
    try {
      if (editingPO) {
        await updatePO.mutateAsync({ id: editingPO.id, ...data });
      } else {
        await createPO.mutateAsync(data);
      }
      setShowForm(false);
      setEditingPO(null);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleEdit = (po: CustomerPO) => {
    setEditingPO(po);
    setShowForm(true);
  };

  const handleComplete = async (id: string) => {
    try {
      await completePO.mutateAsync(id);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleUpdateLineItem = async (poId: string, itemIndex: number, updates: Partial<POLineItem>) => {
    console.log('handleUpdateLineItem called:', { poId, itemIndex, updates });
    try {
      const po = pos.find(p => p.id === poId);
      if (!po) {
        console.error('PO not found:', poId);
        return;
      }

      const updatedItems = [...po.items];
      updatedItems[itemIndex] = { ...updatedItems[itemIndex], ...updates };
      
      console.log('Updating PO with new items:', updatedItems);

      await updatePO.mutateAsync({
        id: poId,
        items: updatedItems
      });
      
      console.log('PO updated successfully');
    } catch (error) {
      console.error('Error updating line item:', error);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPO(null);
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <POForm
          po={editingPO || undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createPO.isPending || updatePO.isPending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Purchase Orders</h1>
          <p className="text-muted-foreground">Manage customer POs with line items and tracking</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New PO
        </Button>
      </div>
      
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">PO List</TabsTrigger>
          <TabsTrigger value="import">Import POs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <POList
            pos={pos}
            onEdit={handleEdit}
            onComplete={handleComplete}
            onUpdateLineItem={handleUpdateLineItem}
            isLoading={isLoading}
          />
        </TabsContent>
        
        <TabsContent value="import" className="space-y-4">
          <POImport onImportComplete={() => refetch()} />
        </TabsContent>
      </Tabs>
    </div>
  );
}