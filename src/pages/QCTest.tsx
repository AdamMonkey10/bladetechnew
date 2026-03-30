import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { NumericTextField } from '@/components/forms/NumericTextField';
import RawMaterialSelector from '@/components/RawMaterialSelector';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useReferenceData } from '@/hooks/useReferenceData';
import { CachePerformanceToast } from '@/components/CachePerformanceToast';

// Form validation schema
const qcTestSchema = z.object({
  product_id: z.string().min(1, 'Product is required'),
  machine_id: z.string().min(1, 'Machine is required'),
  operator_id: z.string().min(1, 'Operator is required'),
  test_date: z.string().min(1, 'Date is required'),
  shift: z.string().min(1, 'Shift is required'),
  total_saws: z.number().min(1, 'Sample count must be positive'),
  invoice: z.string().optional(),
  height: z.string().regex(/^\d+\.\d{1,4}$/, 'Height must have 1-4 decimal places'),
  blade_width: z.string().regex(/^\d+\.\d{1,4}$/, 'Blade width must have 1-4 decimal places'),
  blade_body: z.string().regex(/^\d+\.\d{1,4}$/, 'Blade body must have 1-4 decimal places'),
  blade_bottom: z.string().regex(/^\d+\.\d{1,4}$/, 'Blade bottom must have 1-4 decimal places'),
  tooth_set_left_min: z.string().regex(/^\d+\.\d{1,4}$/, 'Tooth set left min must have 1-4 decimal places'),
  tooth_set_left_max: z.string().regex(/^\d+\.\d{1,4}$/, 'Tooth set left max must have 1-4 decimal places'),
  tooth_set_right_min: z.string().regex(/^\d+\.\d{1,4}$/, 'Tooth set right min must have 1-4 decimal places'),
  tooth_set_right_max: z.string().regex(/^\d+\.\d{1,4}$/, 'Tooth set right max must have 1-4 decimal places'),
  gauge: z.string().regex(/^\d+\.\d{1,4}$/, 'Gauge must have 1-4 decimal places'),
  dross: z.string().regex(/^\d+\.\d{1,4}$/, 'Dross must have 1-4 decimal places'),
  flatness: z.string().regex(/^\d+\.\d{1,4}$/, 'Flatness must have 1-4 decimal places'),
  profile_check: z.boolean().refine(val => val === true, 'Profile check must be conducted'),
  notes: z.string().optional()
});
type QCTestForm = z.infer<typeof qcTestSchema>;
export default function QCTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { products, machines, operators, isLoading: referenceLoading } = useReferenceData();

  // State for form data and UI
  const [loading, setLoading] = useState(false);
  const [specifications, setSpecifications] = useState(null);
  const [showCacheToast, setShowCacheToast] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [withinSpecResults, setWithinSpecResults] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState(null);
  const [selectedRawMaterialBatch, setSelectedRawMaterialBatch] = useState<string>('');
  const [selectedInvoice, setSelectedInvoice] = useState<string>('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');

  // Form setup
  const {
    register,
    handleSubmit,
    formState: {
      errors
    },
    setValue,
    watch,
    reset
  } = useForm<QCTestForm>({
    resolver: zodResolver(qcTestSchema),
    defaultValues: {
      test_date: new Date().toISOString().split('T')[0],
      profile_check: false
    }
  });
  const watchedValues = watch();

  // Show cache performance notification when data loads instantly
  useEffect(() => {
    if (!referenceLoading && products.length > 0) {
      setShowCacheToast(true);
    }
  }, [referenceLoading, products.length]);

  // Load specifications when product changes
  useEffect(() => {
    if (watchedValues.product_id) {
      loadProductSpecifications(watchedValues.product_id);
    }
    // Always clear invoice when product changes (even if product_id is set)
    setSelectedInvoice('');
    setSelectedRawMaterialBatch('');
    setSelectedSupplier('');
    setValue('invoice', '');
  }, [watchedValues.product_id]);

  const loadProductSpecifications = async (productId: string) => {
    try {
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('product_code')
        .eq('id', productId)
        .single();
      
      if (productError) throw productError;

      const { data: specs, error: specsError } = await supabase
        .from('product_specifications')
        .select('*')
        .eq('product_code', product.product_code)
        .single();
      
      if (specsError) {
        // No specifications found - clear existing specs
        setSpecifications(null);
        return;
      }

      // Map database columns to measurement names
      const mappedSpecs = {
        height: { min: specs.height_min, max: specs.height_max },
        gauge: { min: specs.gauge_min, max: specs.gauge_max },
        blade_width: { min: specs.blade_width_min, max: specs.blade_width_max },
        blade_body: { min: specs.blade_body_min, max: specs.blade_body_max },
        blade_bottom: { min: specs.blade_bottom_min, max: specs.blade_bottom_max },
        // All tooth set measurements use the same spec ranges
        tooth_set_left_min: { min: specs.set_left_min, max: specs.set_left_max },
        tooth_set_left_max: { min: specs.set_left_min, max: specs.set_left_max },
        tooth_set_right_min: { min: specs.set_right_min, max: specs.set_right_max },
        tooth_set_right_max: { min: specs.set_right_min, max: specs.set_right_max },
        dross: { min: specs.dross_min, max: specs.dross_max },
        flatness: { min: specs.flatness_min, max: specs.flatness_max }
      };

      setSpecifications(mappedSpecs);
    } catch (error) {
      toast({
        title: "Error loading specifications",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Function to check if measurement is within spec
  const isWithinSpec = useCallback((paramName: string, value: string) => {
    if (!specifications) return true; // No specs = pass all measurements
    if (!value) return null;
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;
    const spec = specifications[paramName];
    if (!spec) return true; // No spec for this parameter = pass
    if (spec.min != null && spec.max != null) {
      return numValue >= spec.min && numValue <= spec.max;
    }
    return true;
  }, [specifications]);

  // Get status badge for a measurement
  const getStatusBadge = (paramName: string, value: string) => {
    const withinSpec = isWithinSpec(paramName, value);
    return withinSpec ? <Badge variant="default" className="bg-green-500">
        <CheckCircle className="w-3 h-3 mr-1" />
        Pass
      </Badge> : <Badge variant="destructive">
        <XCircle className="w-3 h-3 mr-1" />
        Fail
      </Badge>;
  };

  // Get specification range display
  const getSpecRange = (paramName: string) => {
    if (!specifications) return "No specs required";
    if (!specifications[paramName]) return "No specs required";
    const spec = specifications[paramName];
    if (spec.min != null && spec.max != null) {
      return `${spec.min.toFixed(4)} - ${spec.max.toFixed(4)}`;
    }
    return "No specs required";
  };

  // Calculate overall test status
  const calculateTestStatus = (values: QCTestForm) => {
    const measurements = ['height', 'blade_width', 'blade_body', 'blade_bottom', 'tooth_set_left_min', 'tooth_set_left_max', 'tooth_set_right_min', 'tooth_set_right_max', 'gauge', 'dross', 'flatness'];
    let allPass = true;
    const results = {};
    measurements.forEach(param => {
      const value = values[param as keyof QCTestForm];
      const withinSpec = isWithinSpec(param, value as string);
      results[param] = withinSpec;
      if (withinSpec === false) allPass = false;
    });
    setWithinSpecResults(results);
    setSubmissionStatus(allPass);
    return allPass;
  };
  const onSubmit = async (data: QCTestForm) => {
    try {
      setLoading(true);

      // Debug: Check authentication
      console.log('User authentication status:', { user: user?.id, email: user?.email });
      
      if (!user) {
        throw new Error('You must be logged in to submit test reports');
      }

      // Debug: Log form data
      console.log('Form data received:', data);

      // Calculate test results
      const testPassed = calculateTestStatus(data);
      const totalDefects = Object.values(withinSpecResults).filter(result => result === false).length;
      const defectRate = totalDefects / Object.keys(withinSpecResults).length;

      // Debug: Log calculated results
      console.log('Test calculation results:', {
        testPassed,
        totalDefects,
        defectRate,
        withinSpecResults
      });

      // Validate foreign key references exist
      console.log('Validating foreign key references...');
      const [productCheck, machineCheck, operatorCheck] = await Promise.all([
        supabase.from('products').select('id').eq('id', data.product_id).single(),
        supabase.from('machines').select('id').eq('id', data.machine_id).single(),
        supabase.from('operators').select('id').eq('id', data.operator_id).single()
      ]);

      if (productCheck.error) {
        console.error('Product validation failed:', productCheck.error);
        throw new Error(`Selected product is invalid. Please refresh the page and try again.`);
      }
      if (machineCheck.error) {
        console.error('Machine validation failed:', machineCheck.error);
        throw new Error(`Selected machine is invalid. Please refresh the page and try again.`);
      }
      if (operatorCheck.error) {
        console.error('Operator validation failed:', operatorCheck.error);
        throw new Error(`Selected operator is invalid. Please refresh the page and try again.`);
      }

      console.log('Foreign key validation passed');

      // Prepare test data for database insert
      const testData = {
        user_id: user.id,
        product_id: data.product_id,
        machine_id: data.machine_id,
        operator_id: data.operator_id,
        goods_received_id: selectedRawMaterialBatch || null,
        test_date: data.test_date,
        shift: data.shift,
        total_saws: data.total_saws,
        total_defects: totalDefects,
        defect_rate: defectRate,
        notes: data.notes || null,
        test_data: {
          measurements: {
            height: parseFloat(data.height),
            blade_width: parseFloat(data.blade_width),
            blade_body: parseFloat(data.blade_body),
            blade_bottom: parseFloat(data.blade_bottom),
            tooth_set_left_min: parseFloat(data.tooth_set_left_min),
            tooth_set_left_max: parseFloat(data.tooth_set_left_max),
            tooth_set_right_min: parseFloat(data.tooth_set_right_min),
            tooth_set_right_max: parseFloat(data.tooth_set_right_max),
            gauge: parseFloat(data.gauge),
            dross: parseFloat(data.dross),
            flatness: parseFloat(data.flatness)
          },
          within_spec_results: withinSpecResults,
          test_passed: testPassed,
          profile_check: data.profile_check
        }
      };

      console.log('Prepared test data for insertion:', testData);

      const { data: insertedData, error } = await supabase
        .from('milwaukee_test_reports')
        .insert([testData])
        .select('id');

      if (error) {
        console.error('Database insertion error:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      console.log('Test report inserted successfully:', insertedData);

      toast({
        title: "Test report submitted successfully",
        description: `Test ${testPassed ? 'PASSED' : 'FAILED'} - Defect rate: ${(defectRate * 100).toFixed(1)}%`,
        variant: testPassed ? "default" : "destructive"
      });
      
      reset();
      setWithinSpecResults({});
      setSubmissionStatus(null);
      setSelectedInvoice('');
      setSelectedRawMaterialBatch('');
      setSelectedSupplier('');
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Test submission error:', error);
      toast({
        title: "Error submitting test report",
        description: error.message || 'Unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  const handleFormSubmit = (data: QCTestForm) => {
    calculateTestStatus(data);
    setConfirmDialogOpen(true);
  };
  return <div className="space-y-6">
      <CachePerformanceToast 
        show={showCacheToast} 
        onShow={() => setShowCacheToast(false)} 
      />
      
      <div>
        <h1 className="text-3xl font-bold text-foreground">QC Test Form</h1>
        <p className="text-muted-foreground">Quality control testing interface</p>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Test Information */}
        <Card>
          <CardHeader>
            <CardTitle>Test Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product (SKU) *</Label>
                <Select onValueChange={value => setValue('product_id', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(product => <SelectItem key={product.id} value={product.id}>
                        {product.product_code} - {product.product_name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.product_id && <p className="text-sm text-destructive">{errors.product_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="machine">Machine *</Label>
                <Select onValueChange={value => setValue('machine_id', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select machine" />
                  </SelectTrigger>
                  <SelectContent>
                    {machines.map(machine => <SelectItem key={machine.id} value={machine.id}>
                        {machine.machine_code} - {machine.machine_name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.machine_id && <p className="text-sm text-destructive">{errors.machine_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="operator">Operator *</Label>
                <Select onValueChange={value => setValue('operator_id', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select operator" />
                  </SelectTrigger>
                  <SelectContent>
                    {operators.map(operator => <SelectItem key={operator.id} value={operator.id}>
                        {operator.operator_code} - {operator.operator_name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.operator_id && <p className="text-sm text-destructive">{errors.operator_id.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_date">Test Date *</Label>
                <Input {...register('test_date')} type="date" className="h-12" />
                {errors.test_date && <p className="text-sm text-destructive">{errors.test_date.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="shift">Shift *</Label>
                <Select onValueChange={value => setValue('shift', value)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day Shift</SelectItem>
                    <SelectItem value="night">Night Shift</SelectItem>
                    <SelectItem value="overtime">Overtime</SelectItem>
                  </SelectContent>
                </Select>
                {errors.shift && <p className="text-sm text-destructive">{errors.shift.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_saws">Sample Count *</Label>
                <Input {...register('total_saws', {
                valueAsNumber: true
              })} type="number" min="1" inputMode="numeric" pattern="[0-9]*" className="h-12" placeholder="Enter sample count" />
                {errors.total_saws && <p className="text-sm text-destructive">{errors.total_saws.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Raw Material Selection */}
        {watchedValues.product_id && !selectedInvoice && (
          <RawMaterialSelector
            productId={watchedValues.product_id}
            selectedBatchId={selectedRawMaterialBatch}
            onBatchSelect={(batchId) => {
              setSelectedRawMaterialBatch(batchId);
              // Get the selected batch invoice and supplier and populate the form
              const getBatchInvoice = async () => {
                if (batchId) {
                  const { data } = await supabase
                    .from('goods_received')
                    .select('invoice, supplier, suppliers(name)')
                    .eq('id', batchId)
                    .single();
                  if (data?.invoice) {
                    setSelectedInvoice(data.invoice);
                    setSelectedSupplier(data.suppliers?.name || '');
                    setValue('invoice', data.invoice);
                  }
                }
              };
              getBatchInvoice();
            }}
          />
        )}

        {/* Invoice Field */}
        {selectedInvoice && (
          <Card>
            <CardHeader>
              <CardTitle>Raw Material Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="invoice">Invoice Number</Label>
                  <Input 
                    {...register('invoice')} 
                    value={selectedInvoice}
                    readOnly
                    className="bg-muted"
                    placeholder="Invoice will be populated when raw material is selected"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Invoice automatically populated from selected raw material batch.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Measurements */}
        <Card>
          <CardHeader>
            <CardTitle>Measurements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <NumericTextField label="Height" value={watchedValues.height || ''} onChange={value => setValue('height', value)} error={errors.height?.message} required decimalPlaces={4} />
                {getSpecRange('height') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('height')}</p>
                )}
                {watchedValues.height && getStatusBadge('height', watchedValues.height)}
              </div>

              <div className="space-y-2">
                <NumericTextField label="Blade Width" value={watchedValues.blade_width || ''} onChange={value => setValue('blade_width', value)} error={errors.blade_width?.message} required decimalPlaces={4} />
                {getSpecRange('blade_width') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('blade_width')}</p>
                )}
                {watchedValues.blade_width && getStatusBadge('blade_width', watchedValues.blade_width)}
              </div>

              <div className="space-y-2">
                <NumericTextField label="Blade Body" value={watchedValues.blade_body || ''} onChange={value => setValue('blade_body', value)} error={errors.blade_body?.message} required decimalPlaces={4} />
                {getSpecRange('blade_body') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('blade_body')}</p>
                )}
                {watchedValues.blade_body && getStatusBadge('blade_body', watchedValues.blade_body)}
              </div>

              <div className="space-y-2">
                <NumericTextField label="Blade Bottom" value={watchedValues.blade_bottom || ''} onChange={value => setValue('blade_bottom', value)} error={errors.blade_bottom?.message} required decimalPlaces={4} />
                {getSpecRange('blade_bottom') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('blade_bottom')}</p>
                )}
                {watchedValues.blade_bottom && getStatusBadge('blade_bottom', watchedValues.blade_bottom)}
              </div>

              <div className="space-y-2">
                <NumericTextField label="Tooth Set Left Min" value={watchedValues.tooth_set_left_min || ''} onChange={value => setValue('tooth_set_left_min', value)} error={errors.tooth_set_left_min?.message} required decimalPlaces={4} />
                {getSpecRange('tooth_set_left_min') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('tooth_set_left_min')}</p>
                )}
                {watchedValues.tooth_set_left_min && getStatusBadge('tooth_set_left_min', watchedValues.tooth_set_left_min)}
              </div>

              <div className="space-y-2">
                <NumericTextField label="Tooth Set Left Max" value={watchedValues.tooth_set_left_max || ''} onChange={value => setValue('tooth_set_left_max', value)} error={errors.tooth_set_left_max?.message} required decimalPlaces={4} />
                {getSpecRange('tooth_set_left_max') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('tooth_set_left_max')}</p>
                )}
                {watchedValues.tooth_set_left_max && getStatusBadge('tooth_set_left_max', watchedValues.tooth_set_left_max)}
              </div>

              <div className="space-y-2">
                <NumericTextField label="Tooth Set Right Min" value={watchedValues.tooth_set_right_min || ''} onChange={value => setValue('tooth_set_right_min', value)} error={errors.tooth_set_right_min?.message} required decimalPlaces={4} />
                {getSpecRange('tooth_set_right_min') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('tooth_set_right_min')}</p>
                )}
                {watchedValues.tooth_set_right_min && getStatusBadge('tooth_set_right_min', watchedValues.tooth_set_right_min)}
              </div>

              <div className="space-y-2">
                <NumericTextField label="Tooth Set Right Max" value={watchedValues.tooth_set_right_max || ''} onChange={value => setValue('tooth_set_right_max', value)} error={errors.tooth_set_right_max?.message} required decimalPlaces={4} />
                {getSpecRange('tooth_set_right_max') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('tooth_set_right_max')}</p>
                )}
                {watchedValues.tooth_set_right_max && getStatusBadge('tooth_set_right_max', watchedValues.tooth_set_right_max)}
              </div>

              <div className="space-y-2">
                <NumericTextField label="Gauge" value={watchedValues.gauge || ''} onChange={value => setValue('gauge', value)} error={errors.gauge?.message} required decimalPlaces={4} />
                {getSpecRange('gauge') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('gauge')}</p>
                )}
                {watchedValues.gauge && getStatusBadge('gauge', watchedValues.gauge)}
              </div>

              <div className="space-y-2">
                <NumericTextField label="Dross" value={watchedValues.dross || ''} onChange={value => setValue('dross', value)} error={errors.dross?.message} required decimalPlaces={4} />
                {getSpecRange('dross') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('dross')}</p>
                )}
                {watchedValues.dross && getStatusBadge('dross', watchedValues.dross)}
              </div>

              <div className="space-y-2">
                <NumericTextField label="Flatness" value={watchedValues.flatness || ''} onChange={value => setValue('flatness', value)} error={errors.flatness?.message} required decimalPlaces={4} />
                {getSpecRange('flatness') && (
                  <p className="text-sm text-muted-foreground">Spec: {getSpecRange('flatness')}</p>
                )}
                {watchedValues.flatness && getStatusBadge('flatness', watchedValues.flatness)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Checks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox id="profile_check" checked={watchedValues.profile_check} onCheckedChange={checked => setValue('profile_check', checked as boolean)} />
              <Label htmlFor="profile_check">Profile Check Conducted *</Label>
            </div>
            {errors.profile_check && <p className="text-sm text-destructive">{errors.profile_check.message}</p>}

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea {...register('notes')} placeholder="Enter any additional notes..." className="min-h-[100px]" />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={() => {
            reset();
            setSelectedInvoice('');
            setSelectedRawMaterialBatch('');
            setSelectedSupplier('');
          }}>
            Reset Form
          </Button>
          <Button type="submit" size="lg" disabled={loading}>
            {loading ? <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </> : 'Submit Test'}
          </Button>
        </div>
      </form>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {submissionStatus ? <CheckCircle className="w-6 h-6 text-green-500" /> : <XCircle className="w-6 h-6 text-red-500" />}
              Test Result: {submissionStatus ? 'PASS' : 'FAIL'}
            </DialogTitle>
            <DialogDescription>
              Review the test results before final submission.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              {Object.entries(withinSpecResults).map(([param, result]) => <div key={param} className="flex justify-between items-center">
                  <span className="capitalize">{param.replace(/_/g, ' ')}</span>
                  {result === true ? <Badge className="bg-green-500">Pass</Badge> : result === false ? <Badge variant="destructive">Fail</Badge> : <Badge variant="secondary">Unknown</Badge>}
                </div>)}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit(onSubmit)} disabled={loading}>
                {loading ? <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </> : 'Confirm Submission'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}