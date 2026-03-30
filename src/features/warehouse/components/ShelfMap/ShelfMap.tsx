// Interactive warehouse visual grid component
import React, { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { useWarehouseRepo } from '../../hooks/useWarehouseRepo';
import { useShelfSelection } from '../../hooks/useShelfSelection';
import { useWarehouseStore } from '../../store';
import SlotTooltip from './SlotTooltip';
import WarehouseVisualGrid from './WarehouseVisualGrid';
import AddLocationDialog from './AddLocationDialog';

const ShelfMap = () => {
  const repo = useWarehouseRepo();
  const {
    searchQuery,
    searchAndJump,
    selectedSlot,
    selectSlot
  } = useShelfSelection();
  
  const { setLayout } = useWarehouseStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  const { data: layout, isLoading } = useQuery({
    queryKey: ['warehouse', 'layout'],
    queryFn: async () => {
      const data = await repo.getLayout();
      setLayout(data);
      return data;
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInputRef.current?.value) {
      searchAndJump(searchInputRef.current.value);
    }
  };


  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="h-96 flex items-center justify-center">
              <div className="text-muted-foreground">Loading warehouse layout...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!layout) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <div className="h-96 flex items-center justify-center">
              <div className="text-center space-y-2">
                <p className="text-muted-foreground">No warehouse layout found</p>
                <Button variant="outline">Create Layout</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Warehouse Management</h1>
          <p className="text-muted-foreground">Visual grid layout of {layout.name}</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              ref={searchInputRef}
              placeholder="Search SKU, barcode, or slot code..."
              className="w-80"
              defaultValue={searchQuery}
            />
            <Button type="submit" size="icon" variant="outline">
              <Search className="w-4 h-4" />
            </Button>
          </form>
          
          {/* Add Location Button */}
          <Button 
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Visual Grid */}
        <div className="xl:col-span-3">
          <WarehouseVisualGrid 
            layout={layout} 
            onSlotClick={selectSlot}
            onAddLocation={() => setShowAddDialog(true)}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Slot Info */}
          {selectedSlot && <SlotTooltip slot={selectedSlot} />}
        </div>
      </div>
      
      {/* Add Location Dialog */}
      <AddLocationDialog 
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onAdd={async (locationData) => {
          // TODO: Implement adding location to the warehouse
          console.log('Adding location:', locationData);
        }}
      />
    </div>
  );
};

export default ShelfMap;