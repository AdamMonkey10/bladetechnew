import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Package, CheckCircle, XCircle, AlertTriangle, Upload, FileText } from 'lucide-react';
import GoodsInImport from '@/components/GoodsInImport';
import { NumericTextField } from '@/components/forms/NumericTextField';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useReferenceData } from '@/hooks/useReferenceData';
import { CachePerformanceToast } from '@/components/CachePerformanceToast';

interface Supplier {
  id: string;
  name: string;
}

interface RawMaterial {
  id: string;
  material_code: string;
  material_name: string;
  description?: string;
}

interface RawMaterialSpecification {
  id: string;
  material_code: string;
  height_min?: number;
  height_max?: number;
  gauge_min?: number;
  gauge_max?: number;
  set_left_min?: number;
  set_left_max?: number;
  set_right_min?: number;
  set_right_max?: number;
}

interface GoodsInForm {
  sku: string;
  pallet_number: string;
  supplier_id: string;
  invoice: string;
  notes: string;
  height: string;
  gauge: string;
  set_left_1: string;
  set_left_2: string;
  set_right_1: string;
  set_right_2: string;
}

export default function GoodsIn() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { suppliers, rawMaterials, isLoading: referenceLoading } = useReferenceData();
  const [loading, setLoading] = useState(false);
  const [specifications, setSpecifications] = useState<RawMaterialSpecification | null>(null);
  const [loadingSpecifications, setLoadingSpecifications] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCacheToast, setShowCacheToast] = useState(false);
  
  const [formData, setFormData] = useState<GoodsInForm>({
    sku: '',
    pallet_number: '',
    supplier_id: '',
    invoice: '',
    notes: '',
    height: '',
    gauge: '',
    set_left_1: '',
    set_left_2: '',
    set_right_1: '',
    set_right_2: ''
  });

  const [errors, setErrors] = useState<Partial<GoodsInForm>>({});

  // Show cache performance notification when data loads instantly
  useEffect(() => {
    if (!referenceLoading && suppliers.length > 0 && rawMaterials.length > 0) {
      setShowCacheToast(true);
    }
  }, [referenceLoading, suppliers.length, rawMaterials.length]);

  // Fetch specifications when SKU changes
  useEffect(() => {
    if (formData.sku) {
      fetchSpecifications(formData.sku);
    } else {
      setSpecifications(null);
    }
  }, [formData.sku]);

  const fetchSpecifications = async (materialCode: string) => {
    setLoadingSpecifications(true);
    try {
      const { data, error } = await supabase
        .from('raw_material_specifications')
        .select('*')
        .eq('material_code', materialCode)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setSpecifications(data || null);
    } catch (error) {
      console.error('Error fetching specifications:', error);
      setSpecifications(null);
    } finally {
      setLoadingSpecifications(false);
    }
  };

  // Function to check if a measurement is within spec
  const isWithinSpec = (fieldName: keyof GoodsInForm): boolean | null => {
    if (!specifications || !formData[fieldName]) return null;
    
    const value = parseFloat(formData[fieldName] as string);
    if (isNaN(value)) return null;

    let min: number | undefined;
    let max: number | undefined;

    switch (fieldName) {
      case 'height':
        min = specifications.height_min || undefined;
        max = specifications.height_max || undefined;
        break;
      case 'gauge':
        min = specifications.gauge_min || undefined; 
        max = specifications.gauge_max || undefined;
        break;
      case 'set_left_1':
      case 'set_left_2':
        min = specifications.set_left_min || undefined;
        max = specifications.set_left_max || undefined;
        break;
      case 'set_right_1':
      case 'set_right_2':
        min = specifications.set_right_min || undefined;
        max = specifications.set_right_max || undefined;
        break;
    }

    if (min !== undefined && max !== undefined) {
      return value >= min && value <= max;
    }
    return null;
  };

  // Function to calculate average
  const calculateAverage = (val1: string, val2: string): string => {
    if (!val1 || !val2) return '';
    const num1 = parseFloat(val1);
    const num2 = parseFloat(val2);
    if (isNaN(num1) || isNaN(num2)) return '';
    return ((num1 + num2) / 2).toFixed(2);
  };

  // Function to check if any measurement is out of spec
  const checkOutOfSpec = (): boolean => {
    if (!specifications) return false;
    
    const fields: (keyof GoodsInForm)[] = ['height', 'gauge', 'set_left_1', 'set_left_2', 'set_right_1', 'set_right_2'];
    return fields.some(field => {
      const withinSpec = isWithinSpec(field);
      return withinSpec === false;
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<GoodsInForm> = {};

    if (!formData.sku) newErrors.sku = 'SKU is required';
    if (!formData.pallet_number) newErrors.pallet_number = 'Pallet number is required';
    if (!formData.supplier_id) newErrors.supplier_id = 'Supplier is required';
    if (!formData.invoice) {
      newErrors.invoice = 'Invoice is required';
    } else if (!/^\d{6}$/.test(formData.invoice)) {
      newErrors.invoice = 'Invoice must be 6 digits';
    }
    if (!formData.height) newErrors.height = 'Height is required';
    if (!formData.gauge) newErrors.gauge = 'Gauge is required';
    if (!formData.set_left_1) newErrors.set_left_1 = 'Set Left 1 is required';
    if (!formData.set_left_2) newErrors.set_left_2 = 'Set Left 2 is required';
    if (!formData.set_right_1) newErrors.set_right_1 = 'Set Right 1 is required';
    if (!formData.set_right_2) newErrors.set_right_2 = 'Set Right 2 is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // Check if out of spec and show confirmation dialog
    const isOutOfSpec = checkOutOfSpec();
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    setLoading(true);
    setShowConfirmDialog(false);

    try {
      const setLeftAvg = parseFloat(calculateAverage(formData.set_left_1, formData.set_left_2));
      const setRightAvg = parseFloat(calculateAverage(formData.set_right_1, formData.set_right_2));
      const goodStatus = !checkOutOfSpec();

      const { error } = await supabase
        .from('goods_received')
        .insert({
          sku: formData.sku,
          pallet_number: parseInt(formData.pallet_number),
          supplier: formData.supplier_id,
          invoice: formData.invoice,
          notes: formData.notes.trim() || null,
          height: parseFloat(formData.height),
          gauge: parseFloat(formData.gauge),
          set_left_1: parseFloat(formData.set_left_1),
          set_left_2: parseFloat(formData.set_left_2),
          set_right_1: parseFloat(formData.set_right_1),
          set_right_2: parseFloat(formData.set_right_2),
          set_left_avg: setLeftAvg,
          set_right_avg: setRightAvg,
          good_status: goodStatus,
          received_date: new Date().toISOString().split('T')[0],
          quantity_received: 1, // Default quantity for quality control form
          user_id: user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Goods received record created successfully. Status: ${goodStatus ? 'Good' : 'Bad - Quarantine Required'}`,
      });

      // Reset form
      setFormData({
        sku: '',
        pallet_number: '',
        supplier_id: '',
        invoice: '',
        notes: '',
        height: '',
        gauge: '',
        set_left_1: '',
        set_left_2: '',
        set_right_1: '',
        set_right_2: ''
      });
      setErrors({});

    } catch (error) {
      console.error('Error saving goods received:', error);
      toast({
        title: "Error",
        description: "Failed to save goods received record",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (fieldName: keyof GoodsInForm) => {
    const withinSpec = isWithinSpec(fieldName);
    if (withinSpec === null) return '';
    return withinSpec ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  const selectedSupplier = suppliers.find(s => s.id === formData.supplier_id);
  const isOutOfSpec = checkOutOfSpec();

  if (referenceLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading reference data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CachePerformanceToast 
        show={showCacheToast} 
        onShow={() => setShowCacheToast(false)} 
      />
      <div className="flex items-center gap-3">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">Goods Received</h1>
          <p className="text-muted-foreground">Record incoming inventory with quality control measurements</p>
        </div>
      </div>
      
      <Tabs defaultValue="form" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="form" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Data
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Quality Control Goods Received Form
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* SKU Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="sku">
                      Material Code <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={formData.sku} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, sku: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select raw material" />
                      </SelectTrigger>
                      <SelectContent>
                        {rawMaterials.map((material) => (
                          <SelectItem key={material.id} value={material.material_code}>
                            <div className="flex flex-col">
                              <span className="font-medium">{material.material_code}</span>
                              <span className="text-sm text-muted-foreground">{material.material_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.sku && (
                      <p className="text-sm text-destructive">{errors.sku}</p>
                    )}
                  </div>

                  {/* Supplier Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="supplier_id">
                      Supplier <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={formData.supplier_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((supplier) => (
                          <SelectItem key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.supplier_id && (
                      <p className="text-sm text-destructive">{errors.supplier_id}</p>
                    )}
                  </div>

                  {/* Pallet Number */}
                  <div className="space-y-2">
                    <Label htmlFor="pallet_number">
                      Pallet Number <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="pallet_number"
                      type="number"
                      value={formData.pallet_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, pallet_number: e.target.value }))}
                      placeholder="Enter pallet number"
                      className="h-12 text-lg"
                      min="1"
                    />
                    {errors.pallet_number && (
                      <p className="text-sm text-destructive">{errors.pallet_number}</p>
                    )}
                  </div>

                  {/* Invoice */}
                  <div className="space-y-2">
                    <Label htmlFor="invoice">
                      Invoice (6 digits) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="invoice"
                      value={formData.invoice}
                      onChange={(e) => setFormData(prev => ({ ...prev, invoice: e.target.value }))}
                      placeholder="Enter 6-digit invoice number"
                      className="h-12 text-lg"
                      maxLength={6}
                    />
                    {errors.invoice && (
                      <p className="text-sm text-destructive">{errors.invoice}</p>
                    )}
                  </div>
                </div>

                {/* Measurements Section */}
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">Quality Control Measurements</h3>
                    {loadingSpecifications && <Loader2 className="h-4 w-4 animate-spin" />}
                    {specifications && (
                      <Badge variant="outline" className="bg-blue-50">
                        Specifications Loaded
                      </Badge>
                    )}
                  </div>

                  {/* Height and Gauge */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="height">
                        Height (cm) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="height"
                        type="number"
                        step="0.1"
                        value={formData.height}
                        onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                        placeholder="Enter height"
                        className={`h-12 text-lg ${getInputStyle('height')}`}
                      />
                      {errors.height && (
                        <p className="text-sm text-destructive">{errors.height}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="gauge">
                        Gauge <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="gauge"
                        type="number"
                        step="0.1"
                        value={formData.gauge}
                        onChange={(e) => setFormData(prev => ({ ...prev, gauge: e.target.value }))}
                        placeholder="Enter gauge"
                        className={`h-12 text-lg ${getInputStyle('gauge')}`}
                      />
                      {errors.gauge && (
                        <p className="text-sm text-destructive">{errors.gauge}</p>
                      )}
                    </div>
                  </div>

                  {/* Set Measurements */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Set Left Column */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-foreground border-b pb-2">Set Left</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="set_left_1">
                          Set Left Min <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="set_left_1"
                          type="number"
                          step="1"
                          value={formData.set_left_1}
                          onChange={(e) => setFormData(prev => ({ ...prev, set_left_1: e.target.value }))}
                          placeholder="Enter set left min"
                          className={`h-12 text-lg ${getInputStyle('set_left_1')}`}
                        />
                        {errors.set_left_1 && (
                          <p className="text-sm text-destructive">{errors.set_left_1}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="set_left_2">
                          Set Left Max <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="set_left_2"
                          type="number"
                          step="1"
                          value={formData.set_left_2}
                          onChange={(e) => setFormData(prev => ({ ...prev, set_left_2: e.target.value }))}
                          placeholder="Enter set left max"
                          className={`h-12 text-lg ${getInputStyle('set_left_2')}`}
                        />
                        {errors.set_left_2 && (
                          <p className="text-sm text-destructive">{errors.set_left_2}</p>
                        )}
                      </div>
                    </div>

                    {/* Set Right Column */}
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-foreground border-b pb-2">Set Right</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="set_right_1">
                          Set Right Min <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="set_right_1"
                          type="number"
                          step="1"
                          value={formData.set_right_1}
                          onChange={(e) => setFormData(prev => ({ ...prev, set_right_1: e.target.value }))}
                          placeholder="Enter set right min"
                          className={`h-12 text-lg ${getInputStyle('set_right_1')}`}
                        />
                        {errors.set_right_1 && (
                          <p className="text-sm text-destructive">{errors.set_right_1}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="set_right_2">
                          Set Right Max <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="set_right_2"
                          type="number"
                          step="1"
                          value={formData.set_right_2}
                          onChange={(e) => setFormData(prev => ({ ...prev, set_right_2: e.target.value }))}
                          placeholder="Enter set right max"
                          className={`h-12 text-lg ${getInputStyle('set_right_2')}`}
                        />
                        {errors.set_right_2 && (
                          <p className="text-sm text-destructive">{errors.set_right_2}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Calculated Averages */}
                  {(formData.set_left_1 && formData.set_left_2) || (formData.set_right_1 && formData.set_right_2) ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>Set Left Average</Label>
                        <div className="h-12 px-3 py-2 border rounded-md bg-muted text-lg flex items-center">
                          {calculateAverage(formData.set_left_1, formData.set_left_2) || 'N/A'}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Set Right Average</Label>
                        <div className="h-12 px-3 py-2 border rounded-md bg-muted text-lg flex items-center">
                          {calculateAverage(formData.set_right_1, formData.set_right_2) || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about the received goods"
                    className="min-h-[100px] text-lg"
                  />
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="h-12 px-8 text-lg font-medium"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Record Goods Received
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="import">
          <GoodsInImport />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isOutOfSpec ? (
                <AlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              Confirm Submission
            </DialogTitle>
            <DialogDescription>
              The material is marked as{' '}
              <span className={`font-bold ${isOutOfSpec ? 'text-destructive' : 'text-green-600'}`}>
                {isOutOfSpec ? 'Bad - Out of Specification' : 'Good - Within Specification'}
              </span>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>SKU:</strong> {formData.sku}</div>
              <div><strong>Supplier:</strong> {selectedSupplier?.name}</div>
              <div><strong>Pallet Number:</strong> {formData.pallet_number}</div>
              <div><strong>Invoice:</strong> {formData.invoice}</div>
              <div><strong>Height:</strong> {formData.height} cm</div>
              <div><strong>Gauge:</strong> {formData.gauge}</div>
              <div><strong>Set Left Avg:</strong> {calculateAverage(formData.set_left_1, formData.set_left_2)}</div>
              <div><strong>Set Right Avg:</strong> {calculateAverage(formData.set_right_1, formData.set_right_2)}</div>
            </div>

            {isOutOfSpec && (
              <Alert className="border-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  QUARANTINE THE PALLET - Material is out of specification
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}