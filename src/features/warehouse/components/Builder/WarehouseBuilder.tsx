// Warehouse builder component for easy layout creation
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Minus, 
  Building2, 
  CheckCircle,
  Wand2,
  Settings
} from 'lucide-react';
import { useWarehouseRepo } from '../../hooks/useWarehouseRepo';
import { useWarehouseEvents } from '../../hooks/useWarehouseEvents';
import { generateSlotCode } from '../../utils/slotCode';
import type { WarehouseLayout, Aisle, Bay, Location, Level, SlotCode } from '../../types';

interface WarehouseConfig {
  name: string;
  aisles: AisleConfig[];
}

interface AisleConfig {
  name: string;
  bays: BayConfig[];
  locationsPerBay: number;
  levelWeights: Record<number, number>; // level number -> weight limit
}

interface BayConfig {
  name: string;
  levelsPerLocation: number;
}

const WarehouseBuilder = () => {
  const repo = useWarehouseRepo();
  const queryClient = useQueryClient();
  const { trackLayoutEdit } = useWarehouseEvents();
  
  const [aisles, setAisles] = useState<AisleConfig[]>([
    {
      name: 'A',
      bays: [
        { name: '10', levelsPerLocation: 4 },
        { name: '20', levelsPerLocation: 4 },
        { name: '30', levelsPerLocation: 4 }
      ],
      locationsPerBay: 3,
      levelWeights: {
        10: 0, // Ground level - unlimited weight (0 = unlimited)
        11: 50,
        12: 50,
        13: 50,
        14: 50 // This was missing - we need ground + 4 levels = 5 total
      }
    }
  ]);
  
  const [warehouseName, setWarehouseName] = useState('Main Warehouse');
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState('');

  const saveLayoutMutation = useMutation({
    mutationFn: (layout: WarehouseLayout) => repo.saveLayout(layout),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse', 'layout'] });
      setSuccess('Warehouse layout created successfully!');
      trackLayoutEdit('builder_create', { aisles: aisles.length });
      setTimeout(() => setSuccess(''), 3000);
    },
  });

  const addAisle = () => {
    setAisles([...aisles, {
      name: String.fromCharCode(65 + aisles.length),
      bays: [
        { name: '10', levelsPerLocation: 4 },
        { name: '20', levelsPerLocation: 4 },
        { name: '30', levelsPerLocation: 4 }
      ],
      locationsPerBay: 3,
      levelWeights: {
        10: 0, // Ground level - unlimited weight
        11: 50,
        12: 50,
        13: 50,
        14: 50 // Ground + 4 levels = 5 total
      }
    }]);
  };

  const removeAisle = (index: number) => {
    if (aisles.length > 1) {
      setAisles(aisles.filter((_, i) => i !== index));
    }
  };

  const updateAisle = (index: number, updates: Partial<AisleConfig>) => {
    const newAisles = [...aisles];
    newAisles[index] = { ...newAisles[index], ...updates };
    setAisles(newAisles);
  };

  const generateLayout = () => {
    setIsGenerating(true);
    
    try {
      const layout: WarehouseLayout = {
        id: warehouseName.toLowerCase().replace(/\s+/g, '-'),
        name: warehouseName,
        updatedAt: new Date().toISOString(),
        aisles: aisles.map((aisleConfig, aisleIndex) => {
          const aisle: Aisle = {
            id: `aisle-${aisleConfig.name.toLowerCase()}`,
            name: aisleConfig.name,
            bays: []
          };

          // Generate bays from config
          aisleConfig.bays.forEach((bayConfig) => {
            const bay: Bay = {
              id: `bay-${bayConfig.name}`,
              name: bayConfig.name,
              locations: []
            };

            // Generate locations (A, B, C...)
            for (let l = 0; l < aisleConfig.locationsPerBay; l++) {
              const locationLetter = String.fromCharCode(65 + l);
              const location: Location = {
                id: `location-${locationLetter.toLowerCase()}`,
                name: locationLetter,
                levels: []
              };

              // Generate levels: ground (10) + the specified number of levels above ground
              const totalLevels = bayConfig.levelsPerLocation + 1; // +1 for ground level
              for (let lvl = 0; lvl < totalLevels; lvl++) {
                const levelNumber = 10 + lvl;
                const level: Level = {
                  id: `level-${levelNumber}`,
                  code: generateSlotCode(
                    aisleConfig.name,
                    bayConfig.name,
                    locationLetter,
                    levelNumber.toString()
                  ),
                  levelNumber: levelNumber,
                  maxWeightKg: levelNumber === 10 ? undefined : (aisleConfig.levelWeights[levelNumber] || 50), // Ground level has no weight limit
                  quantity: 0
                };
                location.levels.push(level);
              }

              bay.locations.push(location);
            }

            aisle.bays.push(bay);
          });

          return aisle;
        })
      };

      saveLayoutMutation.mutate(layout);
    } catch (error) {
      console.error('Error generating layout:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateTotalLocations = () => {
    return aisles.reduce((total, aisle) => {
      return total + (aisle.bays.length * aisle.locationsPerBay);
    }, 0);
  };

  const calculateTotalLevels = () => {
    return aisles.reduce((total, aisle) => {
      return total + aisle.bays.reduce((bayTotal, bay) => {
        return bayTotal + (aisle.locationsPerBay * (bay.levelsPerLocation + 1)); // +1 for ground level
      }, 0);
    }, 0);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="w-8 h-8" />
            Warehouse Builder
          </h1>
          <p className="text-muted-foreground">Create your warehouse layout with Aisle-Bay-Location-Level structure</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generateLayout} disabled={isGenerating || aisles.length === 0}>
            <Wand2 className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Generate Layout'}
          </Button>
        </div>
      </div>

      {success && (
        <Alert className="border-green-200 bg-green-50 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Warehouse Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="warehouseName">Warehouse Name</Label>
              <Input
                id="warehouseName"
                value={warehouseName}
                onChange={(e) => setWarehouseName(e.target.value)}
                placeholder="e.g., Main Warehouse"
              />
            </div>
            <div className="space-y-2">
              <Label>Total Locations</Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-lg py-2 px-4">
                  {calculateTotalLevels().toLocaleString()} locations
                </Badge>
                <Badge variant="outline">
                  {aisles.length} aisles
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aisles Configuration */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Aisle Configuration</CardTitle>
            <Button onClick={addAisle} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Aisle
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {aisles.map((aisle, index) => (
            <Card key={index} className="border-l-4 border-l-primary">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Aisle Header */}
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Aisle {aisle.name}</h3>
                      <div className="flex gap-2">
                        <Badge variant="outline">
                          {calculateTotalLevels().toLocaleString()} levels
                        </Badge>
                        {aisles.length > 1 && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeAisle(index)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                  {/* Aisle Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Aisle Name</Label>
                      <Input
                        value={aisle.name}
                        onChange={(e) => updateAisle(index, { name: e.target.value })}
                        placeholder="A, B, C..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Bays</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={aisle.bays.length}
                        onChange={(e) => {
                          const newCount = parseInt(e.target.value) || 1;
                          const newBays = [...aisle.bays];
                          
                          // Add or remove bays to match the count
                          while (newBays.length < newCount) {
                            const bayNum = (newBays.length + 1) * 10;
                            newBays.push({ name: bayNum.toString(), levelsPerLocation: 4 });
                          }
                          while (newBays.length > newCount) {
                            newBays.pop();
                          }
                          
                          updateAisle(index, { bays: newBays });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">Bays will be numbered 10, 20, 30...</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Locations per Bay</Label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={aisle.locationsPerBay}
                        onChange={(e) => updateAisle(index, { locationsPerBay: parseInt(e.target.value) || 1 })}
                      />
                      <p className="text-xs text-muted-foreground">Locations will be A, B, C...</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Bay Configuration */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Bay Configuration</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const newBays = [...aisle.bays];
                          const bayNum = (newBays.length + 1) * 10;
                          newBays.push({ name: bayNum.toString(), levelsPerLocation: 4 });
                          updateAisle(index, { bays: newBays });
                        }}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Bay
                      </Button>
                    </div>
                    {aisle.bays.map((bay, bayIndex) => (
                      <div key={bayIndex} className="p-3 border rounded-lg bg-muted/20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                          <div className="space-y-1">
                            <Label className="text-xs">Bay Name</Label>
                            <Input
                              value={bay.name}
                              onChange={(e) => {
                                const newBays = [...aisle.bays];
                                newBays[bayIndex] = { ...bay, name: e.target.value };
                                updateAisle(index, { bays: newBays });
                              }}
                              placeholder="10, 20, 30..."
                            />
                          </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Levels per Bay</Label>
                              <Input
                                type="number"
                                min="1"
                                max="10"
                                value={bay.levelsPerLocation}
                                onChange={(e) => {
                                  const newBays = [...aisle.bays];
                                  const newLevels = parseInt(e.target.value) || 1;
                                  newBays[bayIndex] = { ...bay, levelsPerLocation: newLevels };
                                  
                                  // Update level weights if we have more levels
                                  const newLevelWeights = { ...aisle.levelWeights };
                                  const totalLevels = newLevels + 1; // +1 for ground level
                                  for (let i = 0; i < totalLevels; i++) {
                                    const levelNum = 10 + i;
                                    if (!newLevelWeights[levelNum]) {
                                      newLevelWeights[levelNum] = levelNum === 10 ? 0 : 50; // Ground level = 0 (unlimited), others = 50kg
                                    }
                                  }
                                  
                                  updateAisle(index, { 
                                    bays: newBays,
                                    levelWeights: newLevelWeights
                                  });
                                }}
                              />
                              <p className="text-xs text-muted-foreground">+ ground level (total: {bay.levelsPerLocation + 1})</p>
                            </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const newBays = aisle.bays.filter((_, i) => i !== bayIndex);
                              updateAisle(index, { bays: newBays });
                            }}
                            disabled={aisle.bays.length <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Level Weight Configuration */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Level Weight Limits (applies to all bays)</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {Object.entries(aisle.levelWeights).map(([levelNum, weight], levelIndex) => (
                        <div key={levelNum} className="space-y-1">
                          <Label className="text-xs text-muted-foreground">
                            Level {levelNum === '10' ? 'Ground' : levelIndex}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.1"
                            value={levelNum === '10' ? 'Unlimited' : (weight || '')}
                            onChange={(e) => {
                              if (levelNum !== '10') { // Can't change ground level weight
                                const newLevelWeights = { ...aisle.levelWeights };
                                newLevelWeights[parseInt(levelNum)] = parseFloat(e.target.value) || 0;
                                updateAisle(index, { levelWeights: newLevelWeights });
                              }
                            }}
                            placeholder={levelNum === '10' ? 'Unlimited' : '50'}
                            className="text-xs"
                            disabled={levelNum === '10'}
                          />
                          <p className="text-xs text-muted-foreground">
                            {levelNum === '10' ? 'Unlimited' : 'kg'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Layout Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{aisles.length}</div>
              <div className="text-sm text-muted-foreground">Aisles</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {aisles.reduce((sum, a) => sum + a.bays.length, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Bays</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {calculateTotalLevels().toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Total Locations</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {aisles.length > 0 ? `${Math.max(...aisles.map(a => Math.max(...a.bays.map(b => b.levelsPerLocation))))}+Ground` : '0+Ground'}
              </div>
              <div className="text-sm text-muted-foreground">Levels per Location</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WarehouseBuilder;