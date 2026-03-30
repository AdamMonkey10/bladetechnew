import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, ReferenceLine
} from 'recharts';
import { Target, BarChart3, Activity, Gauge, Download, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import Papa from 'papaparse';

interface QCData {
  id: string;
  test_date: string;
  test_data: any;
  total_saws: number | null;
  total_defects: number | null;
  defect_rate: number | null;
  shift: string | null;
  products?: { product_code: string };
  machines?: { machine_code: string };
  operators?: { operator_name: string };
}

interface StatisticalMetrics {
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  variance: number;
  range: number;
  cp: number;
  cpk: number;
  count: number;
  min: number;
  max: number;
}

interface MeasurementAnalysis {
  type: string;
  data: any[];
  statistics: StatisticalMetrics;
  histogramData: any[];
  spec: { lsl: number; usl: number; label: string; unit: string };
}

interface ProductSpec {
  product_code: string;
  blade_width_min: number | null;
  blade_width_max: number | null;
  gauge_min: number | null;
  gauge_max: number | null;
  height_min: number | null;
  height_max: number | null;
  blade_body_min: number | null;
  blade_body_max: number | null;
  blade_bottom_min: number | null;
  blade_bottom_max: number | null;
  set_left_min: number | null;
  set_left_max: number | null;
  set_right_min: number | null;
  set_right_max: number | null;
  dross_min: number | null;
  dross_max: number | null;
  flatness_min: number | null;
  flatness_max: number | null;
}

const PAGE_SIZE = 25;

export function QCTestReports() {
  const { toast } = useToast();
  const [data, setData] = useState<QCData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('all');
  const [selectedMeasurements, setSelectedMeasurements] = useState<string[]>(['bladeWidth', 'gauge', 'height']);
  const [productSpecs, setProductSpecs] = useState<ProductSpec[]>([]);
  const [tablePage, setTablePage] = useState(0);

  const measurementOptions = [
    { value: 'bladeWidth', label: 'Blade Width', unit: 'in' },
    { value: 'gauge', label: 'Gauge', unit: 'in' },
    { value: 'height', label: 'Height', unit: 'in' },
    { value: 'bladeBody', label: 'Blade Body', unit: 'in' },
    { value: 'bladeBottom', label: 'Blade Bottom', unit: 'in' },
    { value: 'toothSetLeft', label: 'Tooth Set Left', unit: 'in' },
    { value: 'toothSetRight', label: 'Tooth Set Right', unit: 'in' },
    { value: 'dross', label: 'Dross', unit: 'in' },
    { value: 'flatness', label: 'Flatness', unit: 'in' },
  ];

  const extractMeasurementValue = (testData: any, measurementType: string) => {
    if (testData?.measurements) {
      const m = testData.measurements;
      switch (measurementType) {
        case 'bladeWidth': return m.blade_width;
        case 'gauge': return m.gauge;
        case 'height': return m.height;
        case 'bladeBody': return m.blade_body;
        case 'bladeBottom': return m.blade_bottom;
        case 'toothSetLeft': return m.tooth_set_left_max || m.tooth_set_left_min;
        case 'toothSetRight': return m.tooth_set_right_max || m.tooth_set_right_min;
        case 'dross': return m.dross;
        case 'flatness': return m.flatness;
        default: return undefined;
      }
    }
    switch (measurementType) {
      case 'bladeWidth': return testData?.bladeWidth || testData?.blade_width;
      case 'gauge': return testData?.gauge;
      case 'height': return testData?.height;
      case 'bladeBody': return testData?.bladeBody || testData?.blade_body;
      case 'bladeBottom': return testData?.bladeBottom || testData?.blade_bottom;
      case 'toothSetLeft': return testData?.toothSetLeft || testData?.tooth_set_left;
      case 'toothSetRight': return testData?.toothSetRight || testData?.tooth_set_right;
      case 'dross': return testData?.dross;
      case 'flatness': return testData?.flatness;
      default: return undefined;
    }
  };

  const getMeasurementSpec = (measurementType: string, productCode: string) => {
    const spec = productSpecs.find(s => s.product_code === productCode);
    if (!spec) return { lsl: 0, usl: 1 };
    switch (measurementType) {
      case 'bladeWidth': return { lsl: spec.blade_width_min || 0, usl: spec.blade_width_max || 1 };
      case 'gauge': return { lsl: spec.gauge_min || 0, usl: spec.gauge_max || 1 };
      case 'height': return { lsl: spec.height_min || 0, usl: spec.height_max || 1 };
      case 'bladeBody': return { lsl: spec.blade_body_min || 0, usl: spec.blade_body_max || 1 };
      case 'bladeBottom': return { lsl: spec.blade_bottom_min || 0, usl: spec.blade_bottom_max || 1 };
      case 'toothSetLeft': return { lsl: spec.set_left_min || 0, usl: spec.set_left_max || 1 };
      case 'toothSetRight': return { lsl: spec.set_right_min || 0, usl: spec.set_right_max || 1 };
      case 'dross': return { lsl: spec.dross_min || 0, usl: spec.dross_max || 1 };
      case 'flatness': return { lsl: spec.flatness_min || 0, usl: spec.flatness_max || 1 };
      default: return { lsl: 0, usl: 1 };
    }
  };

  useEffect(() => {
    loadQCData();
    loadProductSpecs();
  }, [selectedTimeframe]);

  const loadProductSpecs = async () => {
    try {
      const { data: specs, error } = await supabase
        .from('product_specifications')
        .select('*');
      if (error) throw error;
      setProductSpecs(specs || []);
    } catch (error: any) {
      toast({ title: "Error loading product specifications", description: error.message, variant: "destructive" });
    }
  };

  const loadQCData = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('milwaukee_test_reports')
        .select(`
          id, test_date, test_data, total_saws, total_defects, defect_rate, shift,
          products (product_code),
          machines (machine_code),
          operators (operator_name)
        `)
        .order('test_date', { ascending: false });

      if (selectedTimeframe !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(selectedTimeframe));
        query = query.gte('test_date', daysAgo.toISOString().split('T')[0]);
      }

      const { data: qcData, error } = await query;

      if (error) throw error;
      setData(qcData || []);
    } catch (error: any) {
      toast({ title: "Error loading QC data", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    if (!selectedProduct) return [];
    return data.filter(item => item.products?.product_code === selectedProduct);
  }, [data, selectedProduct]);

  // === Summary KPIs ===
  const kpis = useMemo(() => {
    const total = data.length;
    const totalDefects = data.reduce((s, d) => s + (d.total_defects || 0), 0);
    const totalSaws = data.reduce((s, d) => s + (d.total_saws || 0), 0);
    const passCount = data.filter(d => (d.defect_rate || 0) === 0).length;
    const passRate = total > 0 ? (passCount / total) * 100 : 0;
    const avgDefectRate = total > 0 ? data.reduce((s, d) => s + (d.defect_rate || 0), 0) / total : 0;

    // Week-over-week
    const now = new Date();
    const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
    const twoWeeksAgo = new Date(now); twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const thisWeek = data.filter(d => new Date(d.test_date) >= weekAgo).length;
    const lastWeek = data.filter(d => { const dt = new Date(d.test_date); return dt >= twoWeeksAgo && dt < weekAgo; }).length;
    const weekTrend = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;

    return { total, passRate, avgDefectRate, totalDefects, totalSaws, thisWeek, lastWeek, weekTrend };
  }, [data]);

  // === Product counts ===
  const productCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach(d => {
      const code = d.products?.product_code;
      if (code) counts[code] = (counts[code] || 0) + 1;
    });
    return counts;
  }, [data]);

  const products = useMemo(() => {
    return Object.keys(productCounts).sort();
  }, [productCounts]);

  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      setSelectedProduct(products[0]);
    }
  }, [products, selectedProduct]);

  // === Test results table (paginated) ===
  const tableData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => new Date(b.test_date).getTime() - new Date(a.test_date).getTime());
    const start = tablePage * PAGE_SIZE;
    return {
      rows: sorted.slice(start, start + PAGE_SIZE),
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / PAGE_SIZE),
    };
  }, [filteredData, tablePage]);

  // Reset page when product changes
  useEffect(() => { setTablePage(0); }, [selectedProduct]);

  const measurementAnalyses = useMemo((): MeasurementAnalysis[] => {
    if (!selectedProduct) return [];
    return selectedMeasurements.map(measurementType => {
      const currentSpec = measurementOptions.find(m => m.value === measurementType);
      if (!currentSpec) return null;

      const measurementData = filteredData
        .map(item => ({
          ...item,
          value: extractMeasurementValue(item.test_data, measurementType),
          date: new Date(item.test_date).toLocaleDateString(),
        }))
        .filter(item => item.value !== undefined && item.value !== null)
        .sort((a, b) => new Date(a.test_date).getTime() - new Date(b.test_date).getTime());

      const values = measurementData.map(d => d.value).filter(v => v !== undefined);
      const { lsl, usl } = getMeasurementSpec(measurementType, selectedProduct);

      let statistics: StatisticalMetrics;
      if (values.length === 0) {
        statistics = { mean: 0, median: 0, mode: 0, standardDeviation: 0, variance: 0, range: 0, cp: 0, cpk: 0, count: 0, min: 0, max: 0 };
      } else {
        const sorted = [...values].sort((a, b) => a - b);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const median = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const standardDeviation = Math.sqrt(variance);
        const cp = (usl - lsl) / (6 * standardDeviation);
        const cpkLower = (mean - lsl) / (3 * standardDeviation);
        const cpkUpper = (usl - mean) / (3 * standardDeviation);
        const cpk = Math.min(cpkLower, cpkUpper);

        statistics = {
          mean, median, mode: mean, standardDeviation, variance,
          range: Math.max(...values) - Math.min(...values),
          cp: isFinite(cp) ? cp : 0,
          cpk: isFinite(cpk) ? cpk : 0,
          count: values.length,
          min: Math.min(...values),
          max: Math.max(...values),
        };
      }

      const histogramData = values.length > 0 ? (() => {
        const bins = 15;
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binWidth = max > min ? (max - min) / bins : 1;
        const histogram = Array.from({ length: bins }, (_, i) => ({
          bin: (min + i * binWidth + min + (i + 1) * binWidth) / 2,
          count: 0,
          range: `${(min + i * binWidth).toFixed(4)} - ${(min + (i + 1) * binWidth).toFixed(4)}`,
        }));
        values.forEach(value => {
          if (binWidth > 0) {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
            if (histogram[binIndex]) histogram[binIndex].count++;
          }
        });
        return histogram;
      })() : [];

      return {
        type: measurementType,
        data: measurementData,
        statistics,
        histogramData,
        spec: { ...currentSpec, lsl, usl }
      };
    }).filter(Boolean) as MeasurementAnalysis[];
  }, [filteredData, selectedMeasurements, selectedProduct, productSpecs]);

  const getCapabilityColor = (cpk: number) => {
    if (cpk >= 1.33) return 'text-green-600 dark:text-green-400';
    if (cpk >= 1.0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-destructive';
  };

  const getCapabilityBadge = (cpk: number) => {
    if (cpk >= 1.33) return <Badge className="bg-green-600 hover:bg-green-700">Excellent</Badge>;
    if (cpk >= 1.0) return <Badge className="bg-yellow-600 hover:bg-yellow-700">Adequate</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  const toggleMeasurement = (measurementValue: string) => {
    setSelectedMeasurements(prev =>
      prev.includes(measurementValue)
        ? prev.filter(m => m !== measurementValue)
        : [...prev, measurementValue]
    );
  };

  const handleExportCSV = useCallback(() => {
    const rows = filteredData.map(d => ({
      date: d.test_date,
      product: d.products?.product_code || '',
      machine: d.machines?.machine_code || '',
      operator: d.operators?.operator_name || '',
      shift: d.shift || '',
      total_saws: d.total_saws || 0,
      total_defects: d.total_defects || 0,
      defect_rate: d.defect_rate || 0,
      pass_fail: (d.defect_rate || 0) === 0 ? 'PASS' : 'FAIL',
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qc-test-results-${selectedProduct}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'CSV exported', description: `${rows.length} records exported successfully.` });
  }, [filteredData, selectedProduct, toast]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">QC & Test Reports</h1>
          <p className="text-muted-foreground">Process capability, control analysis & test results</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All time</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Product" />
            </SelectTrigger>
            <SelectContent>
              {products.map(product => (
                <SelectItem key={product} value={product}>
                  {product} ({productCounts[product]} tests)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filteredData.length === 0}>
            <Download className="w-4 h-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tests</p>
                <p className="text-3xl font-bold text-foreground">{kpis.total.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.totalSaws.toLocaleString()} saws tested
                </p>
              </div>
              <FlaskConical className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pass Rate</p>
                <p className={`text-3xl font-bold ${kpis.passRate >= 95 ? 'text-green-600 dark:text-green-400' : kpis.passRate >= 80 ? 'text-yellow-600 dark:text-yellow-400' : 'text-destructive'}`}>
                  {kpis.passRate.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {kpis.totalDefects.toLocaleString()} total defects
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Defect Rate</p>
                <p className={`text-3xl font-bold ${kpis.avgDefectRate <= 2 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                  {kpis.avgDefectRate.toFixed(2)}%
                </p>
                <p className="text-xs text-muted-foreground mt-1">per test report</p>
              </div>
              <XCircle className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-3xl font-bold text-foreground">{kpis.thisWeek}</p>
                <div className="flex items-center gap-1 mt-1">
                  {kpis.weekTrend >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-600" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-destructive" />
                  )}
                  <span className={`text-xs ${kpis.weekTrend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                    {kpis.weekTrend >= 0 ? '+' : ''}{kpis.weekTrend.toFixed(0)}% vs last week
                  </span>
                </div>
              </div>
              <BarChart3 className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Test Results Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Test Results</CardTitle>
            <p className="text-sm text-muted-foreground">{tableData.total} records for {selectedProduct || 'all products'}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Page {tablePage + 1} of {tableData.totalPages || 1}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={tablePage === 0} onClick={() => setTablePage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={tablePage >= tableData.totalPages - 1} onClick={() => setTablePage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Machine</TableHead>
                <TableHead>Shift</TableHead>
                <TableHead className="text-right">Saws</TableHead>
                <TableHead className="text-right">Defects</TableHead>
                <TableHead className="text-right">Defect Rate</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    {loading ? 'Loading...' : 'No test data found for selected filters'}
                  </TableCell>
                </TableRow>
              ) : (
                tableData.rows.map(row => {
                  const defRate = row.defect_rate || 0;
                  const pass = defRate === 0;
                  return (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">{new Date(row.test_date).toLocaleDateString()}</TableCell>
                      <TableCell>{row.operators?.operator_name || '—'}</TableCell>
                      <TableCell>{row.machines?.machine_code || '—'}</TableCell>
                      <TableCell>{row.shift || '—'}</TableCell>
                      <TableCell className="text-right">{row.total_saws ?? '—'}</TableCell>
                      <TableCell className="text-right">{row.total_defects ?? '—'}</TableCell>
                      <TableCell className="text-right">{defRate.toFixed(2)}%</TableCell>
                      <TableCell>
                        {pass ? (
                          <Badge className="bg-green-600 hover:bg-green-700 text-xs">PASS</Badge>
                        ) : (
                          <Badge variant="destructive" className="text-xs">FAIL</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Measurement Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Measurements to Analyze</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {measurementOptions.map(option => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={option.value}
                  checked={selectedMeasurements.includes(option.value)}
                  onCheckedChange={() => toggleMeasurement(option.value)}
                />
                <label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                  {option.label} ({option.unit})
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Measurement Analysis Cards */}
      <div className="space-y-8">
        {measurementAnalyses.map(analysis => (
          <div key={analysis.type} className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">{analysis.spec.label} Analysis</h2>

            {/* Key Metrics — 4-column layout */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground">Cpk</p>
                  <p className={`text-3xl font-bold ${getCapabilityColor(analysis.statistics.cpk)}`}>
                    {analysis.statistics.cpk.toFixed(3)}
                  </p>
                  <div className="mt-1">{getCapabilityBadge(analysis.statistics.cpk)}</div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground">Cp Index</p>
                  <p className={`text-3xl font-bold ${getCapabilityColor(analysis.statistics.cp)}`}>
                    {analysis.statistics.cp.toFixed(3)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Potential capability</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground">Mean</p>
                  <p className="text-3xl font-bold text-foreground">{analysis.statistics.mean.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground mt-1">σ = {analysis.statistics.standardDeviation.toFixed(4)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-medium text-muted-foreground">Spec Limits</p>
                  <p className="text-lg font-bold text-foreground">
                    {((analysis.spec.lsl + analysis.spec.usl) / 2).toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    LSL {analysis.spec.lsl.toFixed(4)} / USL {analysis.spec.usl.toFixed(4)}
                  </p>
                  <p className="text-xs text-muted-foreground">{analysis.statistics.count} samples</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Distribution Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analysis.histogramData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="bin" type="number" domain={['dataMin', 'dataMax']} tickFormatter={(v) => Number(v).toFixed(3)} />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [value, 'Count']} labelFormatter={(v: any) => `Value: ${Number(v).toFixed(4)}`} />
                      <ReferenceLine x={analysis.spec.lsl} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'LSL', position: 'top', fill: 'hsl(var(--destructive))' }} />
                      <ReferenceLine x={analysis.spec.usl} stroke="hsl(var(--destructive))" strokeDasharray="5 5" label={{ value: 'USL', position: 'top', fill: 'hsl(var(--destructive))' }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Control Chart — fixed with ReferenceLine */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Control Chart</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analysis.data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis
                        domain={[
                          Math.min(analysis.spec.lsl, analysis.statistics.min) - (analysis.spec.usl - analysis.spec.lsl) * 0.1,
                          Math.max(analysis.spec.usl, analysis.statistics.max) + (analysis.spec.usl - analysis.spec.lsl) * 0.1
                        ]}
                        tickFormatter={(v) => Number(v).toFixed(4)}
                      />
                      <Tooltip
                        formatter={(value: any, name: string) => {
                          if (name === 'value') return [Number(value).toFixed(4), 'Measured'];
                          return [value, name];
                        }}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <ReferenceLine y={analysis.statistics.mean} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Mean', position: 'right', fill: '#10b981', fontSize: 11 }} />
                      <ReferenceLine y={analysis.spec.usl} stroke="#ef4444" strokeDasharray="10 5" label={{ value: 'USL', position: 'right', fill: '#ef4444', fontSize: 11 }} />
                      <ReferenceLine y={analysis.spec.lsl} stroke="#ef4444" strokeDasharray="10 5" label={{ value: 'LSL', position: 'right', fill: '#ef4444', fontSize: 11 }} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
