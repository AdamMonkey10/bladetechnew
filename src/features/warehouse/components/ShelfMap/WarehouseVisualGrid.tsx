// Visual spatial grid view for warehouse locations
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, MapPin, BarChart3, AlertTriangle, Plus, Grid3X3 } from 'lucide-react';
import type { WarehouseLayout, Level, Aisle } from '../../types';

interface WarehouseVisualGridProps {
  layout: WarehouseLayout;
  onSlotClick?: (level: Level) => void;
  onAddLocation?: () => void;
}

const WarehouseVisualGrid: React.FC<WarehouseVisualGridProps> = ({ 
  layout, 
  onSlotClick,
  onAddLocation 
}) => {
  const [selectedAisle, setSelectedAisle] = useState<string | null>(null);

  const getStatusConfig = (level: Level) => {
    const hasStock = level.quantity && level.quantity > 0;

    if (hasStock) return {
      variant: 'default' as const,
      label: 'Active',
      bgColor: 'bg-primary/10 border-primary/20 hover:bg-primary/20',
      textColor: 'text-primary',
      icon: Package
    };
    return {
      variant: 'outline' as const,
      label: 'Empty',
      bgColor: 'bg-muted/30 border-muted hover:bg-muted/50',
      textColor: 'text-muted-foreground',
      icon: MapPin
    };
  };

  const formatSlotCode = (code: string) => {
    return code; // A-10-A-11 format is already readable
  };

  const renderAisleGrid = (aisle: Aisle) => {
    // Collect all levels from this aisle
    const allLevels: (Level & { bayName: string; locationName: string })[] = [];
    
    aisle.bays.forEach(bay => {
      bay.locations.forEach(location => {
        location.levels?.forEach(level => {
          allLevels.push({
            ...level,
            bayName: bay.name,
            locationName: location.name
          });
        });
      });
    });

    // Sort levels for consistent visual layout
    allLevels.sort((a, b) => {
      if (a.bayName !== b.bayName) return parseInt(a.bayName) - parseInt(b.bayName);
      if (a.locationName !== b.locationName) return a.locationName.localeCompare(b.locationName);
      return a.levelNumber - b.levelNumber;
    });

    // Group by bay for better visual organization
    const levelsByBay = allLevels.reduce((acc, level) => {
      if (!acc[level.bayName]) acc[level.bayName] = [];
      acc[level.bayName].push(level);
      return acc;
    }, {} as Record<string, typeof allLevels>);

    const totalLocationsInAisle = aisle.bays.reduce((sum, bay) => sum + bay.locations.length, 0);
    return (
      <div className="space-y-8">
        {/* Aisle Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-bold">Aisle {aisle.name}</h3>
            <Badge variant="outline" className="ml-2">
              {totalLocationsInAisle} locations
            </Badge>
          </div>
        </div>

        {/* Bays */}
        {Object.entries(levelsByBay).map(([bayName, levels]) => (
          <div key={bayName} className="space-y-4">
            {/* Bay Header */}
            <div className="flex items-center gap-2 border-b pb-2">
              <h4 className="text-lg font-semibold text-muted-foreground">Bay {bayName}</h4>
                      <Badge variant="secondary">
                        {(aisle.bays.find(b => b.name === bayName)?.locations.length || 0)} locations
                      </Badge>
            </div>

            {/* Locations Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
              {levels.map((level) => {
                const status = getStatusConfig(level);
                const StatusIcon = status.icon;

                return (
                  <Card 
                    key={level.id}
                    className={`${status.bgColor} cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105 min-h-[120px] relative`}
                    onClick={() => onSlotClick?.(level)}
                  >
                    <CardHeader className="p-2 pb-1">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-xs font-mono font-bold leading-tight">
                          {formatSlotCode(level.code)}
                        </CardTitle>
                        <StatusIcon className={`w-3 h-3 ${status.textColor}`} />
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-2 pt-0 space-y-1">
                      {/* Status Badge */}
                      <Badge variant={status.variant} className="text-xs py-0 px-1 h-4">
                        {status.label}
                      </Badge>

                      {/* Level Info */}
                      <div className="text-xs text-muted-foreground">
                        Level {level.levelNumber}
                      </div>

                      {/* Product Info */}
                      {level.productId && (
                        <div className="bg-card/80 rounded px-1 py-0.5">
                          <p className="text-xs font-mono font-semibold truncate">
                            {level.productId.length > 8 ? `${level.productId.substring(0, 8)}...` : level.productId}
                          </p>
                        </div>
                      )}

                      {/* Stock Count */}
                      <div className="space-y-1">
                        <div className="text-xs">
                          Stock: {level.quantity || 0} units
                        </div>
                      </div>

                      {/* Location Context */}
                      <div className="text-xs text-muted-foreground/80 truncate">
                        {level.locationName} @ Bay {level.bayName}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const filteredAisles = selectedAisle 
    ? layout.aisles.filter(aisle => aisle.name === selectedAisle)
    : layout.aisles;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3">
          <Grid3X3 className="w-6 h-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Warehouse Visual Grid</h2>
            <p className="text-muted-foreground">Aisle-Bay-Location-Level layout of {layout.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Aisle Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Aisle:</span>
            <div className="flex flex-wrap gap-1">
              <Button
                variant={selectedAisle === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedAisle(null)}
              >
                All
              </Button>
              {layout.aisles.map(aisle => (
                <Button
                  key={aisle.id}
                  variant={selectedAisle === aisle.name ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAisle(aisle.name)}
                >
                  {aisle.name}
                </Button>
              ))}
            </div>
          </div>
          
          {/* Add Location */}
          {onAddLocation && (
            <Button onClick={onAddLocation} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {layout.aisles.map(aisle => {
          const totalLocations = aisle.bays.reduce((total, bay) => 
            total + bay.locations.length, 0
          );
          
          const occupiedLocations = aisle.bays.reduce((total, bay) => 
            total + bay.locations.filter(location => 
              location.levels?.some(level => (level.quantity || 0) > 0)
            ).length, 0
          );

          const utilizationPercent = totalLocations > 0 ? (occupiedLocations / totalLocations) * 100 : 0;

          return (
            <Card key={aisle.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold">Aisle {aisle.name}</span>
                </div>
                <div className="text-2xl font-bold mb-1">{occupiedLocations}/{totalLocations}</div>
                <div className="text-sm text-muted-foreground mb-2">Locations occupied</div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Aisle Grids */}
      <div className="space-y-12">
        {filteredAisles.map(aisle => (
          <div key={aisle.id}>
            {renderAisleGrid(aisle)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarehouseVisualGrid;