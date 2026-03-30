import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Wrench, CheckCircle, FileText, Plus, Settings, Download } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDate } from '@/utils/dateUtils';
import { format } from 'date-fns';
import type { Tables } from '@/integrations/supabase/types';
import EquipmentManagement from '@/components/EquipmentManagement';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DISPLAY_EMPTY = '—';
const LEGACY_LEVELS = ['level0', 'level025', 'level05', 'level075', 'level1', 'level2', 'level3', 'level6'] as const;
const LEGACY_LEVEL_LABELS = ['0', '0.25', '0.5', '0.75', '1', '2', '3', '6'] as const;

const TMX_MEASUREMENT_FIELDS = [
  'Width',
  'Height',
  'Angle',
  'Circle 1',
  'Circle 2',
  'Circle 3',
  'Circle 4',
  'Arc Radius Right',
  'Arc Radius Left',
  '1-3',
  '2-4',
] as const;

interface CalibrationMeasurement {
  label: string;
  value: string;
  unit?: string;
}

interface LegacyCalibrationData {
  test: string;
  level0: string;
  level025: string;
  level05: string;
  level075: string;
  level1: string;
  level2: string;
  level3: string;
  level6: string;
}

type EquipmentType = 'manual' | 'tmx';
type FormCalibrationData = CalibrationMeasurement[] | LegacyCalibrationData[];

interface CalibrationForm {
  equipment_name: string;
  equipment_serial: string;
  calibration_date: string;
  next_calibration_date: string;
  status: string;
  notes: string;
  calibration_data: FormCalibrationData;
}

type CalibrationRecord = Tables<'calibration_records'>;

type MeasurementFormatType = 'tmx' | 'probe';

type ParsedCalibrationData =
  | { format: 'measurements'; measurementType: MeasurementFormatType; measurements: CalibrationMeasurement[] }
  | { format: 'legacy'; tests: LegacyCalibrationData[] }
  | { format: 'empty' };

const getTMXUnit = (label: string) => (label === 'Angle' ? 'deg' : 'inch');

const resolveMeasurementUnit = (label: string, unit?: string) => {
  const trimmedUnit = unit?.trim();
  if (trimmedUnit) return trimmedUnit;
  return (TMX_MEASUREMENT_FIELDS as readonly string[]).includes(label) ? getTMXUnit(label) : '';
};

const createInitialMeasurementData = (): CalibrationMeasurement[] =>
  TMX_MEASUREMENT_FIELDS.map((label) => ({ label, value: '', unit: getTMXUnit(label) }));

const createInitialLegacyCalibrationData = (): LegacyCalibrationData[] => [
  {
    test: 'Test 1',
    level0: '',
    level025: '',
    level05: '',
    level075: '',
    level1: '',
    level2: '',
    level3: '',
    level6: '',
  },
  {
    test: 'Test 2',
    level0: '',
    level025: '',
    level05: '',
    level075: '',
    level1: '',
    level2: '',
    level3: '',
    level6: '',
  },
  {
    test: 'Test 3',
    level0: '',
    level025: '',
    level05: '',
    level075: '',
    level1: '',
    level2: '',
    level3: '',
    level6: '',
  },
];

const createCalibrationDataByType = (equipmentType: EquipmentType): FormCalibrationData =>
  equipmentType === 'tmx' ? createInitialMeasurementData() : createInitialLegacyCalibrationData();

const formatDisplayValue = (value: string | null | undefined) => {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : DISPLAY_EMPTY;
};

const formatMeasurementExportValue = (measurement?: CalibrationMeasurement) => {
  if (!measurement) return '';
  const trimmedValue = measurement.value.trim();
  const trimmedUnit = resolveMeasurementUnit(measurement.label, measurement.unit);
  if (!trimmedValue) return '';
  return trimmedUnit ? `${trimmedValue} ${trimmedUnit}` : trimmedValue;
};

const formatMeasurementDisplayValue = (measurement?: CalibrationMeasurement) => {
  if (!measurement) return DISPLAY_EMPTY;
  const trimmedValue = measurement.value.trim();
  if (!trimmedValue) return DISPLAY_EMPTY;
  const trimmedUnit = resolveMeasurementUnit(measurement.label, measurement.unit);
  return trimmedUnit ? `${trimmedValue} ${trimmedUnit}` : trimmedValue;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const isTMXEquipment = (equipment?: Tables<'equipment'> | null) => {
  const manufacturer = equipment?.manufacturer?.trim().toLowerCase();
  const model = equipment?.model?.trim().toLowerCase();
  return manufacturer === 'keyence' && model === 'tmx 1200';
};

const getEquipmentTypeFromEquipment = (equipment?: Tables<'equipment'> | null): EquipmentType =>
  isTMXEquipment(equipment) ? 'tmx' : 'manual';

const isTMXMeasurementSet = (measurements: CalibrationMeasurement[]) => {
  const labels = new Set(measurements.map((measurement) => measurement.label));
  return TMX_MEASUREMENT_FIELDS.every((label) => labels.has(label));
};

const parseCalibrationData = (raw: unknown): ParsedCalibrationData => {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { format: 'empty' };
  }

  const firstItem = raw[0];
  const firstRow = firstItem && typeof firstItem === 'object' ? (firstItem as Record<string, unknown>) : null;

  if (firstRow && 'label' in firstRow) {
    const measurements = raw
      .map((entry): CalibrationMeasurement | null => {
        if (!entry || typeof entry !== 'object') return null;
        const row = entry as Record<string, unknown>;
        if (typeof row.label !== 'string' || !row.label.trim()) return null;

        return {
          label: row.label,
          value: typeof row.value === 'string' ? row.value : String(row.value ?? ''),
          unit: typeof row.unit === 'string' && row.unit.trim() ? row.unit : undefined,
        };
      })
      .filter((measurement): measurement is CalibrationMeasurement => measurement !== null);

    if (measurements.length === 0) {
      return { format: 'empty' };
    }

    if (isTMXMeasurementSet(measurements)) {
      const measurementMap = new Map<string, CalibrationMeasurement>(
        measurements.map((measurement) => [measurement.label, measurement]),
      );

      return {
        format: 'measurements',
        measurementType: 'tmx',
        measurements: TMX_MEASUREMENT_FIELDS.map(
          (label) => measurementMap.get(label) ?? { label, value: '', unit: getTMXUnit(label) },
        ),
      };
    }

    return {
      format: 'measurements',
      measurementType: 'probe',
      measurements,
    };
  }

  const tests = raw
    .filter((entry): entry is Record<string, unknown> => Boolean(entry) && typeof entry === 'object')
    .map((entry, index) => ({
      test: typeof entry.test === 'string' && entry.test.trim() ? entry.test : `Test ${index + 1}`,
      level0: typeof entry.level0 === 'string' ? entry.level0 : '',
      level025: typeof entry.level025 === 'string' ? entry.level025 : '',
      level05: typeof entry.level05 === 'string' ? entry.level05 : '',
      level075: typeof entry.level075 === 'string' ? entry.level075 : '',
      level1: typeof entry.level1 === 'string' ? entry.level1 : '',
      level2: typeof entry.level2 === 'string' ? entry.level2 : '',
      level3: typeof entry.level3 === 'string' ? entry.level3 : '',
      level6: typeof entry.level6 === 'string' ? entry.level6 : '',
    }));

  return tests.length > 0 ? { format: 'legacy', tests } : { format: 'empty' };
};

const getFormatLabel = (parsed: ParsedCalibrationData) => {
  if (parsed.format === 'measurements') {
    return parsed.measurementType === 'tmx' ? 'TMX Laser' : 'Probe';
  }

  return 'Manual';
};

const formatDialogDate = (date: string) => {
  try {
    return format(new Date(`${date}T00:00:00`), 'dd MMM yyyy');
  } catch {
    return date;
  }
};

export default function Calibration() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<CalibrationRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [activeTab, setActiveTab] = useState('form');
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [equipmentList, setEquipmentList] = useState<Tables<'equipment'>[]>([]);
  const [equipmentType, setEquipmentType] = useState<EquipmentType>('manual');
  const [selectedRecord, setSelectedRecord] = useState<CalibrationRecord | null>(null);

  const [formData, setFormData] = useState<CalibrationForm>({
    equipment_name: '',
    equipment_serial: '',
    calibration_date: new Date().toISOString().split('T')[0],
    next_calibration_date: '',
    status: 'active',
    notes: '',
    calibration_data: createInitialLegacyCalibrationData(),
  });

  const [errors, setErrors] = useState<Partial<CalibrationForm>>({});

  const selectedEquipment = equipmentList.find((equipment) => equipment.equipment_name === formData.equipment_name);
  const isTMXSelected = equipmentType === 'tmx';
  const selectedRecordParsed = selectedRecord ? parseCalibrationData(selectedRecord.calibration_data) : null;

  useEffect(() => {
    fetchCalibrationRecords();
    fetchEquipmentList();
  }, []);

  const fetchEquipmentList = async () => {
    const { data } = await supabase
      .from('equipment')
      .select('*')
      .eq('status', 'active')
      .order('equipment_name');
    setEquipmentList(data || []);
  };

  useEffect(() => {
    if (formData.calibration_date) {
      const calibDate = new Date(formData.calibration_date);
      const nextDate = new Date(calibDate);
      nextDate.setMonth(nextDate.getMonth() + 6);

      setFormData((prev) => ({
        ...prev,
        next_calibration_date: nextDate.toISOString().split('T')[0],
      }));
    }
  }, [formData.calibration_date]);

  const fetchCalibrationRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('calibration_records')
        .select('*')
        .order('calibration_date', { ascending: false });

      if (error) throw error;
      setRecords(data || []);
    } catch (error) {
      console.error('Error fetching calibration records:', error);
      toast({
        title: 'Error',
        description: 'Failed to load calibration records',
        variant: 'destructive',
      });
    } finally {
      setLoadingRecords(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CalibrationForm> = {};

    if (!formData.equipment_name.trim()) newErrors.equipment_name = 'Equipment name is required';
    if (!formData.equipment_serial.trim()) newErrors.equipment_serial = 'Serial number is required';
    if (!formData.calibration_date) newErrors.calibration_date = 'Calibration date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('calibration_records').insert({
        equipment_name: formData.equipment_name.trim(),
        equipment_serial: formData.equipment_serial.trim(),
        calibration_date: formData.calibration_date,
        next_calibration_date: formData.next_calibration_date,
        status: formData.status,
        notes: formData.notes.trim() || null,
        calibration_data: formData.calibration_data as unknown as Tables<'calibration_records'>['calibration_data'],
        user_id: user?.id,
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Calibration record created successfully',
      });

      setFormData({
        equipment_name: '',
        equipment_serial: '',
        calibration_date: new Date().toISOString().split('T')[0],
        next_calibration_date: '',
        status: 'active',
        notes: '',
        calibration_data: createInitialLegacyCalibrationData(),
      });
      setEquipmentType('manual');
      setErrors({});

      fetchCalibrationRecords();
      setActiveTab('records');
    } catch (error) {
      console.error('Error saving calibration record:', error);
      toast({
        title: 'Error',
        description: 'Failed to save calibration record',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentTypeChange = (value: EquipmentType) => {
    setEquipmentType(value);
    setFormData((prev) => ({
      ...prev,
      calibration_data: createCalibrationDataByType(value),
    }));
  };

  const updateCalibrationMeasurement = (measurementIndex: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      calibration_data: Array.isArray(prev.calibration_data)
        ? prev.calibration_data.map((measurement, index) =>
            index === measurementIndex && 'label' in measurement ? { ...measurement, value } : measurement,
          )
        : prev.calibration_data,
    }));
  };

  const updateLegacyCalibrationData = (testIndex: number, field: keyof LegacyCalibrationData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      calibration_data: Array.isArray(prev.calibration_data)
        ? prev.calibration_data.map((test, index) =>
            index === testIndex && 'test' in test ? { ...test, [field]: value } : test,
          )
        : prev.calibration_data,
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Active</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'due':
        return <Badge variant="secondary">Due</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderRecordResults = (record: CalibrationRecord) => {
    const parsed = parseCalibrationData(record.calibration_data);

    if (parsed.format === 'measurements') {
      return (
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Measurement</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsed.measurements.map((measurement) => (
                <TableRow key={measurement.label}>
                  <TableCell className="font-medium">{measurement.label}</TableCell>
                  <TableCell>{formatMeasurementDisplayValue(measurement)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    if (parsed.format === 'legacy') {
      return (
        <div className="overflow-x-auto rounded-lg border border-border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Test</TableHead>
                {LEGACY_LEVEL_LABELS.map((label) => (
                  <TableHead key={label}>Level {label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsed.tests.map((test) => (
                <TableRow key={test.test}>
                  <TableCell className="font-medium">{test.test}</TableCell>
                  {LEGACY_LEVELS.map((level) => (
                    <TableCell key={`${test.test}-${level}`}>{formatDisplayValue(test[level])}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      );
    }

    return <p className="text-sm text-muted-foreground">No calibration results recorded for this entry.</p>;
  };

  const handleExportCSV = async () => {
    setExportingCSV(true);
    try {
      const { data: calRecords, error: calErr } = await supabase
        .from('calibration_records')
        .select('*')
        .order('calibration_date', { ascending: false });
      if (calErr) throw calErr;

      const legacyHeaders = Array.from({ length: 3 }, (_, index) =>
        LEGACY_LEVEL_LABELS.map((label) => `Test ${index + 1} - Level ${label}`),
      ).flat();

      const calHeaders = [
        'Equipment Name',
        'Serial Number',
        'Calibration Date',
        'Next Due Date',
        'Status',
        'Notes',
        'Data Format',
        ...TMX_MEASUREMENT_FIELDS,
        ...legacyHeaders,
      ];

      const calRows = (calRecords || []).map((record) => {
        const parsed = parseCalibrationData(record.calibration_data);
        const measurementMap =
          parsed.format === 'measurements'
            ? new Map(parsed.measurements.map((measurement) => [measurement.label, measurement]))
            : new Map<string, CalibrationMeasurement>();

        const row = [
          record.equipment_name,
          record.equipment_serial || '',
          record.calibration_date,
          record.next_calibration_date || '',
          record.status || '',
          record.notes || '',
          parsed.format,
          ...TMX_MEASUREMENT_FIELDS.map((label) => formatMeasurementExportValue(measurementMap.get(label))),
          ...Array.from({ length: 3 }, (_, testIndex) => {
            if (parsed.format !== 'legacy') {
              return LEGACY_LEVELS.map(() => '');
            }
            const test = parsed.tests[testIndex];
            return LEGACY_LEVELS.map((level) => (test ? test[level] || '' : ''));
          }).flat(),
        ];

        return row.map(csvEscape).join(',');
      });

      const calCSV = [calHeaders.map(csvEscape).join(','), ...calRows].join('\n');
      downloadBlob(new Blob([calCSV], { type: 'text/csv' }), 'calibration-records.csv');

      const { data: eqData, error: eqErr } = await supabase.from('equipment').select('*').order('equipment_name');
      if (eqErr) throw eqErr;

      const eqHeaders = ['Equipment Name', 'Serial Number', 'Type', 'Manufacturer', 'Model', 'Calibration Frequency (months)', 'Status', 'Notes'];
      const eqRows = (eqData || []).map((equipment) =>
        [
          equipment.equipment_name,
          equipment.equipment_serial || '',
          equipment.equipment_type || '',
          equipment.manufacturer || '',
          equipment.model || '',
          String(equipment.calibration_frequency_months ?? ''),
          equipment.status || '',
          equipment.notes || '',
        ]
          .map(csvEscape)
          .join(','),
      );
      const eqCSV = [eqHeaders.map(csvEscape).join(','), ...eqRows].join('\n');
      downloadBlob(new Blob([eqCSV], { type: 'text/csv' }), 'equipment-list.csv');

      toast({ title: 'Export Complete', description: 'CSV files downloaded successfully' });
    } catch (err) {
      console.error('CSV export error:', err);
      toast({ title: 'Export Failed', description: 'Could not export CSV files', variant: 'destructive' });
    } finally {
      setExportingCSV(false);
    }
  };

  const handleExportPDF = async () => {
    setExportingPDF(true);
    try {
      const { data: calRecords, error: calErr } = await supabase
        .from('calibration_records')
        .select('*')
        .order('calibration_date', { ascending: false });
      if (calErr) throw calErr;

      if (!calRecords || calRecords.length === 0) {
        toast({ title: 'No Records', description: 'There are no calibration results to export.' });
        return;
      }

      const doc = new jsPDF('landscape', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const timestamp = `${format(new Date(), 'yyyy-MM-dd')} 08.15`;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Calibration Results List', 14, 16);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Exported: ${timestamp}`, 14, 23);
      doc.text(`Total records: ${calRecords.length}`, pageWidth - 14, 23, { align: 'right' });

      autoTable(doc, {
        startY: 30,
        head: [['Equipment', 'Format', 'Serial', 'Calibration Date', 'Next Due', 'Status', 'Notes']],
        body: calRecords.map((record) => {
          const parsed = parseCalibrationData(record.calibration_data);
          return [
            record.equipment_name,
            getFormatLabel(parsed),
            record.equipment_serial || DISPLAY_EMPTY,
            formatDate(record.calibration_date),
            record.next_calibration_date ? formatDate(record.next_calibration_date) : DISPLAY_EMPTY,
            record.status || 'active',
            record.notes || DISPLAY_EMPTY,
          ];
        }),
        theme: 'grid',
        margin: { top: 30, right: 14, bottom: 14, left: 14 },
        styles: {
          fontSize: 8,
          cellPadding: 2.5,
          overflow: 'linebreak',
          valign: 'middle',
        },
        headStyles: {
          fillColor: [41, 128, 185],
          fontSize: 9,
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 24 },
          2: { cellWidth: 34 },
          3: { cellWidth: 28 },
          4: { cellWidth: 28 },
          5: { cellWidth: 20 },
          6: { cellWidth: 'auto' },
        },
        didDrawPage: () => {
          doc.setFontSize(8);
          doc.setTextColor(120);
          doc.text(`Bladetech Calibration Results`, 14, pageHeight - 6);
          doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - 14, pageHeight - 6, { align: 'right' });
          doc.setTextColor(0);
        },
      });

      doc.save('calibration-results-list.pdf');
      toast({ title: 'Export Complete', description: 'Calibration results PDF downloaded successfully' });
    } catch (err) {
      console.error('PDF export error:', err);
      toast({ title: 'Export Failed', description: 'Could not export PDF', variant: 'destructive' });
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wrench className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Calibration Management</h1>
            <p className="text-muted-foreground">Track equipment calibration and maintenance schedules</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} disabled={exportingCSV}>
            {exportingCSV ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Export CSV
          </Button>
          <Button variant="outline" onClick={handleExportPDF} disabled={exportingPDF}>
            {exportingPDF ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            Export PDF
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-14 w-full grid-cols-3">
          <TabsTrigger value="form" className="flex h-12 items-center gap-2 text-lg touch-manipulation">
            <Plus className="h-5 w-5" />
            Add Calibration
          </TabsTrigger>
          <TabsTrigger value="records" className="flex h-12 items-center gap-2 text-lg touch-manipulation">
            <FileText className="h-5 w-5" />
            Records
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex h-12 items-center gap-2 text-lg touch-manipulation">
            <Settings className="h-5 w-5" />
            Equipment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                New Calibration Record
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="space-y-3">
                    <Label htmlFor="equipment_name" className="text-lg font-medium">
                      Equipment Name <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.equipment_name}
                      onValueChange={(value) => {
                        const equipment = equipmentList.find((item) => item.equipment_name === value);
                        const syncedEquipmentType = getEquipmentTypeFromEquipment(equipment);
                        setEquipmentType(syncedEquipmentType);
                        setFormData((prev) => ({
                          ...prev,
                          equipment_name: value,
                          equipment_serial: equipment?.equipment_serial || '',
                          calibration_data: createCalibrationDataByType(syncedEquipmentType),
                        }));
                      }}
                    >
                      <SelectTrigger className="h-16 text-xl touch-manipulation">
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentList.map((equipment) => (
                          <SelectItem key={equipment.id} value={equipment.equipment_name} className="h-12 text-lg">
                            {equipment.equipment_name} {equipment.equipment_serial ? `(${equipment.equipment_serial})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.equipment_name && <p className="text-base font-medium text-destructive">{errors.equipment_name}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="equipment_type" className="text-lg font-medium">
                      Equipment Type
                    </Label>
                    <Select value={equipmentType} onValueChange={(value) => handleEquipmentTypeChange(value as EquipmentType)}>
                      <SelectTrigger className="h-16 text-xl touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual" className="h-12 text-lg">
                          Manual Instrument
                        </SelectItem>
                        <SelectItem value="tmx" className="h-12 text-lg">
                          Keyence TMX Laser
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="equipment_serial" className="text-lg font-medium">
                      Serial Number
                    </Label>
                    <Input
                      id="equipment_serial"
                      value={formData.equipment_serial}
                      readOnly
                      placeholder="Auto-filled from equipment"
                      className="h-16 bg-muted px-4 text-xl touch-manipulation"
                    />
                    {errors.equipment_serial && <p className="text-base font-medium text-destructive">{errors.equipment_serial}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="calibration_date" className="text-lg font-medium">
                      Calibration Date <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="calibration_date"
                      type="date"
                      value={formData.calibration_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, calibration_date: e.target.value }))}
                      className="h-16 px-4 text-xl touch-manipulation"
                    />
                    {errors.calibration_date && <p className="text-base font-medium text-destructive">{errors.calibration_date}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="next_calibration_date" className="text-lg font-medium">
                      Next Calibration Due
                    </Label>
                    <Input
                      id="next_calibration_date"
                      type="date"
                      value={formData.next_calibration_date}
                      onChange={(e) => setFormData((prev) => ({ ...prev, next_calibration_date: e.target.value }))}
                      className="h-16 px-4 text-xl touch-manipulation"
                    />
                  </div>

                  <div className="space-y-3 md:col-span-2">
                    <Label htmlFor="status" className="text-lg font-medium">
                      Status
                    </Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}>
                      <SelectTrigger className="h-16 text-xl touch-manipulation">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="h-12 text-lg">
                          Active
                        </SelectItem>
                        <SelectItem value="expired" className="h-12 text-lg">
                          Expired
                        </SelectItem>
                        <SelectItem value="due" className="h-12 text-lg">
                          Due
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-1">
                      <Label className="text-xl font-medium">
                        {isTMXSelected ? 'TMX Calibration Entries' : 'Calibration Test Results'}
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        {isTMXSelected
                          ? 'TMX equipment uses the dedicated 11-point calibration template.'
                          : 'Manual instruments use the original 3-test, 8-level calibration layout.'}
                      </p>
                    </div>
                    <Badge variant="secondary" className="w-fit">
                      {isTMXSelected ? 'TMX Laser format' : 'Manual format'}
                    </Badge>
                  </div>

                  {isTMXSelected ? (
                    <Card className="border-border/60 bg-card/60 p-6">
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {(formData.calibration_data as CalibrationMeasurement[]).map((measurement, measurementIndex) => (
                          <div key={measurement.label} className="space-y-2">
                            <Label className="text-base font-medium">{measurement.label}</Label>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.0001"
                                inputMode="decimal"
                                value={measurement.value}
                                onChange={(e) => updateCalibrationMeasurement(measurementIndex, e.target.value)}
                                placeholder="Enter reading"
                                className="h-14 px-4 pr-16 text-lg touch-manipulation"
                              />
                              <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm text-muted-foreground">
                                {measurement.unit || getTMXUnit(measurement.label)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  ) : (
                    <div className="space-y-6">
                      {(formData.calibration_data as LegacyCalibrationData[]).map((test, testIndex) => (
                        <Card key={testIndex} className="p-6">
                          <h4 className="mb-4 text-lg font-medium">{test.test}</h4>
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
                            {LEGACY_LEVELS.map((level, levelIndex) => (
                              <div key={level} className="space-y-2">
                                <Label className="text-base font-medium">Level {LEGACY_LEVEL_LABELS[levelIndex]}</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={test[level]}
                                  onChange={(e) => updateLegacyCalibrationData(testIndex, level, e.target.value)}
                                  placeholder="0.00"
                                  className="h-14 px-4 text-lg touch-manipulation"
                                />
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <Label htmlFor="notes" className="text-lg font-medium">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about the calibration"
                    className="min-h-[120px] px-4 py-3 text-lg touch-manipulation"
                  />
                </div>

                <div className="flex justify-end pt-6">
                  <Button type="submit" disabled={loading} className="h-16 px-12 text-xl font-medium touch-manipulation">
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="mr-3 h-6 w-6" />
                        Save Calibration Record
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="records">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Calibration Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingRecords ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : records.length === 0 ? (
                <div className="py-8 text-center">
                  <Wrench className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">No calibration records found</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipment</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Serial</TableHead>
                        <TableHead>Calibration Date</TableHead>
                        <TableHead>Next Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((record) => {
                        const parsed = parseCalibrationData(record.calibration_data);
                        const formatLabel = getFormatLabel(parsed);

                        return (
                          <TableRow key={record.id}>
                            <TableCell className="font-medium">{record.equipment_name}</TableCell>
                            <TableCell>
                              <Badge variant={parsed.format === 'measurements' ? 'secondary' : 'outline'}>{formatLabel}</Badge>
                            </TableCell>
                            <TableCell>{record.equipment_serial || '-'}</TableCell>
                            <TableCell>{formatDate(record.calibration_date)}</TableCell>
                            <TableCell>{record.next_calibration_date ? formatDate(record.next_calibration_date) : '-'}</TableCell>
                            <TableCell>{getStatusBadge(record.status || 'active')}</TableCell>
                            <TableCell className="max-w-xs truncate">{record.notes || '-'}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" className="h-9" onClick={() => setSelectedRecord(record)}>
                                View Data
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <EquipmentManagement />
        </TabsContent>
      </Tabs>

      <Dialog open={Boolean(selectedRecord)} onOpenChange={(open) => !open && setSelectedRecord(null)}>
        <DialogContent className="max-w-6xl">
          {selectedRecord && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedRecord.equipment_name} — {formatDialogDate(selectedRecord.calibration_date)}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedRecordParsed && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={selectedRecordParsed.format === 'measurements' ? 'secondary' : 'outline'}>
                      {getFormatLabel(selectedRecordParsed)}
                    </Badge>
                    <span className="text-sm text-muted-foreground">Serial: {selectedRecord.equipment_serial || DISPLAY_EMPTY}</span>
                  </div>
                )}
                {renderRecordResults(selectedRecord)}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const csvEscape = (value: string | number | null | undefined) => `"${String(value ?? '').replace(/"/g, '""')}"`;
