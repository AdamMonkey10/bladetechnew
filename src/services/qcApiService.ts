export interface BatchData {
  number: string;
  sku: string;
  status: string;
  completed_at: string;
  machine_type: 'miller' | 'kesel' | 'normac';
}

export interface QualityData {
  overall_status: 'pass' | 'fail' | 'warning';
  fault_count: number;
  faults: Array<{
    position: string;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
  }>;
}

export interface CoilMapData {
  length: number;
  faults: Array<{
    id: string;
    startPosition: number;
    finishPosition: number;
    type: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    description: string;
  }>;
}

export interface SPCMeasurement {
  testType: string;
  testDate: string;
  operator: string;
  status: 'pass' | 'fail';
  averageDepth?: number;
  topCoil?: number;
  bottomCoil?: number;
  measurements: number[];
  indexLengthFeet: number;
}

export interface SPCData {
  type: 'milling_depth' | 'grinding_coil';
  unit: string;
  measurements: SPCMeasurement[];
  statistics: {
    count: number;
    average: number;
    min: number;
    max: number;
    range: number;
  };
  specifications: {
    target: number;
    upperLimit: number;
    lowerLimit: number;
    cpk: number;
  };
}

export interface TestResult {
  test_type: string;
  test_date: string;
  status: 'pass' | 'fail' | 'pending';
}

export interface QCApiResponse {
  success: boolean;
  data: {
    batch: BatchData;
    quality: QualityData;
    coil_map: CoilMapData;
    spc_data: SPCData;
    test_results: TestResult[];
  };
}

class QCApiService {
  private readonly baseUrl = 'https://aztvdgphnogxbyqpeoqc.supabase.co/functions/v1/customer-api';
  private readonly apiKey = 'bladetech2025';

  async fetchBatchData(batchNumber: string): Promise<QCApiResponse> {
    try {
      const response = await fetch(`${this.baseUrl}?batchNumber=${encodeURIComponent(batchNumber)}`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const rawData = await response.json();
      
      if (!rawData.success) {
        throw new Error(rawData.error || 'API request failed');
      }

      // Transform the external API response to match our expected structure
      const transformedData: QCApiResponse = {
        success: true,
        data: {
          batch: {
            number: rawData.data.batchNumber || batchNumber,
            sku: rawData.data.skuCode || 'Unknown',
            status: rawData.data.status || 'unknown',
            completed_at: new Date().toISOString(), // Fallback to current date
            machine_type: 'miller' as const // Default machine type
          },
          quality: {
            overall_status: rawData.data.faults && rawData.data.faults.length > 0 ? 'fail' : 'pass',
            fault_count: rawData.data.faults ? rawData.data.faults.length : 0,
            faults: rawData.data.faults || []
          },
          coil_map: {
            length: rawData.data.coilLength || 0,
            faults: rawData.data.faults || []
          },
          spc_data: {
            type: 'milling_depth' as const,
            unit: 'mm',
            measurements: [], // No measurements in simplified API
            statistics: {
              count: 0,
              average: 0,
              min: 0,
              max: 0,
              range: 0
            },
            specifications: {
              target: 25,
              upperLimit: 30,
              lowerLimit: 20,
              cpk: 1.33
            }
          },
          test_results: [] // No test results in simplified API
        }
      };

      return transformedData;
    } catch (error) {
      console.error('Error fetching batch data:', error);
      throw error;
    }
  }

  getSeverityColor(severity: 'critical' | 'high' | 'medium' | 'low'): string {
    const colors = {
      critical: '#ef4444', // red
      high: '#f97316',     // orange
      medium: '#eab308',   // yellow
      low: '#3b82f6'       // blue
    };
    return colors[severity];
  }

  getStatusColor(status: 'pass' | 'fail' | 'warning' | 'pending'): string {
    const colors = {
      pass: '#22c55e',     // green
      fail: '#ef4444',     // red
      warning: '#f59e0b',  // amber
      pending: '#6b7280'   // gray
    };
    return colors[status];
  }
}

export const qcApiService = new QCApiService();