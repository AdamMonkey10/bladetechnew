// Layout editor component for warehouse configuration
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Save, 
  Download, 
  Upload, 
  Plus, 
  Settings,
  FileJson,
  AlertTriangle
} from 'lucide-react';
import { useWarehouseRepo } from '../../hooks/useWarehouseRepo';
import { useWarehouseStore } from '../../store';
import JsonImportExport from './JsonImportExport';
import type { WarehouseLayout } from '../../types';

const LayoutEditor = () => {
  const repo = useWarehouseRepo();
  const queryClient = useQueryClient();
  const { permissions } = useWarehouseStore();
  
  const [editedLayout, setEditedLayout] = useState<WarehouseLayout | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showJsonEditor, setShowJsonEditor] = useState(false);

  const { data: layout, isLoading } = useQuery({
    queryKey: ['warehouse', 'layout'],
    queryFn: () => repo.getLayout(),
  });

  React.useEffect(() => {
    if (layout && !editedLayout) {
      setEditedLayout(layout);
    }
  }, [layout, editedLayout]);

  const saveLayoutMutation = useMutation({
    mutationFn: (layout: WarehouseLayout) => repo.saveLayout(layout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse', 'layout'] });
      setHasUnsavedChanges(false);
    },
  });

  const handleSave = () => {
    if (editedLayout) {
      saveLayoutMutation.mutate({
        ...editedLayout,
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleLayoutChange = (newLayout: WarehouseLayout) => {
    setEditedLayout(newLayout);
    setHasUnsavedChanges(true);
  };

  const handleImportLayout = (importedLayout: WarehouseLayout) => {
    setEditedLayout(importedLayout);
    setHasUnsavedChanges(true);
  };

  if (!permissions.canEdit) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">Access Denied</h2>
              <p className="text-muted-foreground">
                You don't have permission to edit warehouse layouts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground">Loading layout editor...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!layout || !editedLayout) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center space-y-4">
            <Settings className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <h2 className="text-xl font-semibold">No Layout Found</h2>
              <p className="text-muted-foreground">
                Create a new warehouse layout to get started.
              </p>
            </div>
            <Button onClick={() => setShowJsonEditor(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Layout
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Layout Editor</h1>
          <p className="text-muted-foreground">
            Configure warehouse aisles, bays, locations, and levels
          </p>
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <Badge variant="outline" className="text-orange-600 border-orange-300">
              Unsaved Changes
            </Badge>
          )}
          <Button 
            variant="outline" 
            onClick={() => setShowJsonEditor(true)}
          >
            <FileJson className="w-4 h-4 mr-2" />
            JSON Editor
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={!hasUnsavedChanges || saveLayoutMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveLayoutMutation.isPending ? 'Saving...' : 'Save Layout'}
          </Button>
        </div>
      </div>

      {/* Layout Info */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="layoutName">Layout Name</Label>
              <Input
                id="layoutName"
                value={editedLayout.name}
                onChange={(e) => handleLayoutChange({
                  ...editedLayout,
                  name: e.target.value
                })}
                placeholder="e.g., Main Warehouse"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="layoutId">Layout ID</Label>
              <Input
                id="layoutId"
                value={editedLayout.id}
                onChange={(e) => handleLayoutChange({
                  ...editedLayout,
                  id: e.target.value
                })}
                placeholder="e.g., main-warehouse"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aisles Configuration */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Aisles</CardTitle>
            <Button 
              size="sm" 
              onClick={() => {
                const newAisle = {
                  id: `aisle-${Date.now()}`,
                  name: `${String.fromCharCode(65 + editedLayout.aisles.length)}`,
                  bays: []
                };
                handleLayoutChange({
                  ...editedLayout,
                  aisles: [...editedLayout.aisles, newAisle]
                });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Aisle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {editedLayout.aisles.map((aisle, aisleIndex) => (
              <Card key={aisle.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Aisle {aisle.name}</h4>
                      <Badge variant="outline">
                        {aisle.bays.length} bays
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Aisle Name</Label>
                        <Input
                          value={aisle.name}
                          onChange={(e) => {
                            const newAisles = [...editedLayout.aisles];
                            newAisles[aisleIndex] = { ...aisle, name: e.target.value };
                            handleLayoutChange({ ...editedLayout, aisles: newAisles });
                          }}
                          placeholder="A, B, C..."
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <Label className="text-xs">Aisle ID</Label>
                        <Input
                          value={aisle.id}
                          onChange={(e) => {
                            const newAisles = [...editedLayout.aisles];
                            newAisles[aisleIndex] = { ...aisle, id: e.target.value };
                            handleLayoutChange({ ...editedLayout, aisles: newAisles });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {editedLayout.aisles.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No aisles configured. Add your first aisle to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* JSON Import/Export Dialog */}
      <JsonImportExport
        layout={editedLayout}
        open={showJsonEditor}
        onClose={() => setShowJsonEditor(false)}
        onImport={handleImportLayout}
      />
    </div>
  );
};

export default LayoutEditor;