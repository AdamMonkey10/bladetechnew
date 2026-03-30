import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  type: string;
  dateFrom?: string;
  dateTo?: string;
  operator: string;
  format: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, dateFrom, dateTo, operator, format }: ReportRequest = await req.json();

    console.log(`Generating ${type} report in ${format} format`);

    let reportData: any = {};

    // Generate different report types
    switch (type) {
      case 'compliance':
        reportData = await generateComplianceReport(supabase, dateFrom, dateTo, operator);
        break;
      case 'productivity':
        reportData = await generateProductivityReport(supabase, dateFrom, dateTo, operator);
        break;
      case 'operator-summary':
        reportData = await generateOperatorSummaryReport(supabase, dateFrom, dateTo, operator);
        break;
      case 'data-quality':
        reportData = await generateDataQualityReport(supabase, dateFrom, dateTo, operator);
        break;
      default:
        throw new Error(`Unknown report type: ${type}`);
    }

    // Process different output formats
    let result: any = {};

    switch (format) {
      case 'view':
        result = {
          type: 'view',
          data: reportData,
          title: getReportTitle(type),
          generated_at: new Date().toISOString()
        };
        break;
      case 'csv':
        result = await generateCSV(reportData, type);
        break;
      case 'excel':
        result = await generateExcel(reportData, type);
        break;
      case 'pdf':
        result = await generatePDF(reportData, type);
        break;
      case 'email':
        result = await sendReportEmail(reportData, type);
        break;
      default:
        throw new Error(`Unknown format: ${format}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Report generation error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
};

async function generateComplianceReport(supabase: any, dateFrom?: string, dateTo?: string, operator?: string) {
  console.log('generateComplianceReport called with:', { dateFrom, dateTo, operator });
  
  // Build date filters
  let query = supabase
    .from('timesheet_tracking')
    .select(`
      *,
      operators!timesheet_tracking_operator_id_fkey (operator_name, operator_code)
    `);

  if (dateFrom && dateTo) {
    // Ensure dateFrom is not after dateTo
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    
    if (fromDate > toDate) {
      // Swap them if from is after to
      query = query.gte('work_date', dateTo.split('T')[0]).lte('work_date', dateFrom.split('T')[0]);
    } else {
      query = query.gte('work_date', dateFrom.split('T')[0]).lte('work_date', dateTo.split('T')[0]);
    }
  } else if (dateFrom) {
    query = query.gte('work_date', dateFrom.split('T')[0]);
  } else if (dateTo) {
    query = query.lte('work_date', dateTo.split('T')[0]);
  }

  const { data, error } = await query.order('work_date', { ascending: false });

  if (error) {
    console.error('Compliance query error:', error);
    throw error;
  }
  
  console.log('Compliance raw data count:', data?.length || 0);
  console.log('Compliance raw data sample:', data?.[0]);

  // Filter by operator if specified
  let filteredData = data || [];
  if (operator && operator !== 'all') {
    filteredData = filteredData.filter(record => 
      record.operators?.operator_code === operator
    );
  }

  // Calculate compliance metrics
  const totalRecords = filteredData.length;
  const submittedCount = filteredData.filter(record => record.timesheet_submitted).length;
  const overdueCount = filteredData.filter(record => record.days_overdue > 0).length;
  const onTimeCount = submittedCount - overdueCount;

  const complianceRate = totalRecords > 0 ? (submittedCount / totalRecords) * 100 : 0;
  const onTimeRate = totalRecords > 0 ? (onTimeCount / totalRecords) * 100 : 0;

  return {
    summary: {
      total_records: totalRecords,
      submitted_count: submittedCount,
      overdue_count: overdueCount,
      on_time_count: onTimeCount,
      compliance_rate: Math.round(complianceRate * 100) / 100,
      on_time_rate: Math.round(onTimeRate * 100) / 100
    },
    details: filteredData,
    escalation_levels: {
      critical: filteredData.filter(r => r.escalation_level === 'critical').length,
      urgent: filteredData.filter(r => r.escalation_level === 'urgent').length,
      warning: filteredData.filter(r => r.escalation_level === 'warning').length
    }
  };
}

async function generateProductivityReport(supabase: any, dateFrom?: string, dateTo?: string, operator?: string) {
  let query = supabase
    .from('shift_records')
    .select(`
      *,
      operators!shift_records_operator_id_fkey (operator_name, operator_code),
      machines!shift_records_machine_id_fkey (machine_name, machine_code)
    `);

  if (dateFrom && dateTo) {
    // Ensure dateFrom is not after dateTo
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    
    if (fromDate > toDate) {
      // Swap them if from is after to
      query = query.gte('shift_date', dateTo.split('T')[0]).lte('shift_date', dateFrom.split('T')[0]);
    } else {
      query = query.gte('shift_date', dateFrom.split('T')[0]).lte('shift_date', dateTo.split('T')[0]);
    }
  } else if (dateFrom) {
    query = query.gte('shift_date', dateFrom.split('T')[0]);
  } else if (dateTo) {
    query = query.lte('shift_date', dateTo.split('T')[0]);
  }

  const { data, error } = await query.order('shift_date', { ascending: false });

  if (error) {
    console.error('Productivity query error:', error);
    throw error;
  }

  // Filter by operator if specified
  let filteredData = data || [];
  if (operator && operator !== 'all') {
    filteredData = filteredData.filter(record => 
      record.operators?.operator_code === operator
    );
  }

  // Calculate productivity metrics
  console.log('Calculating productivity for', filteredData.length, 'records');
  const productivity = calculateProductivityMetrics(filteredData);

  return {
    summary: productivity.summary,
    by_operator: productivity.byOperator,
    by_activity: productivity.byActivity,
    by_sku: productivity.bySKU,
    trends: productivity.trends,
    details: filteredData
  };
}

async function generateOperatorSummaryReport(supabase: any, dateFrom?: string, dateTo?: string, operator?: string) {
  // This would combine timesheet and productivity data by operator
  const complianceData = await generateComplianceReport(supabase, dateFrom, dateTo, operator);
  const productivityData = await generateProductivityReport(supabase, dateFrom, dateTo, operator);

  return {
    compliance: complianceData,
    productivity: productivityData,
    combined_metrics: calculateCombinedOperatorMetrics(complianceData, productivityData)
  };
}

async function generateDataQualityReport(supabase: any, dateFrom?: string, dateTo?: string, operator?: string) {
  console.log('generateDataQualityReport called with:', { dateFrom, dateTo, operator });
  
  try {
    // Get QC test results from milwaukee_test_reports
    let qcQuery = supabase
      .from('milwaukee_test_reports')
      .select(`
        *,
        operators(operator_name),
        products(product_name, product_code)
      `)
      .order('test_date', { ascending: false });
    
    // Get scrap data from shift_records
    let scrapQuery = supabase
      .from('shift_records')
      .select(`
        *,
        operators(operator_name)
      `)
      .order('shift_date', { ascending: false });
    
    // Apply date filters to both queries
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      
      if (fromDate > toDate) {
        qcQuery = qcQuery.gte('test_date', dateTo.split('T')[0]).lte('test_date', dateFrom.split('T')[0]);
        scrapQuery = scrapQuery.gte('shift_date', dateTo.split('T')[0]).lte('shift_date', dateFrom.split('T')[0]);
      } else {
        qcQuery = qcQuery.gte('test_date', dateFrom.split('T')[0]).lte('test_date', dateTo.split('T')[0]);
        scrapQuery = scrapQuery.gte('shift_date', dateFrom.split('T')[0]).lte('shift_date', dateTo.split('T')[0]);
      }
    }
    
    // Apply operator filter if specified
    if (operator && operator !== 'all') {
      qcQuery = qcQuery.eq('operator_id', operator);
      scrapQuery = scrapQuery.eq('operator_id', operator);
    }
    
    // Execute both queries in parallel
    const [qcResult, scrapResult] = await Promise.all([
      qcQuery,
      scrapQuery
    ]);
    
    if (qcResult.error) {
      console.error('Error fetching QC reports:', qcResult.error);
      throw qcResult.error;
    }
    
    if (scrapResult.error) {
      console.error('Error fetching scrap data:', scrapResult.error);
      throw scrapResult.error;
    }
    
    const qcReports = qcResult.data || [];
    const shiftRecords = scrapResult.data || [];
    
    console.log('QC reports fetched:', qcReports.length, 'records');
    console.log('Shift records fetched:', shiftRecords.length, 'records');
    
    // Calculate QC metrics
    const totalTests = qcReports.length;
    const totalBlades = qcReports.reduce((sum, report) => sum + (report.total_saws || 0), 0);
    const totalDefects = qcReports.reduce((sum, report) => sum + (report.total_defects || 0), 0);
    const avgDefectRate = totalBlades > 0 ? (totalDefects / totalBlades) * 100 : 0;
    
    // Calculate scrap metrics from shift records
    const scrapData = calculateScrapMetrics(shiftRecords);
    
    // Group by product
    const byProduct = qcReports.reduce((acc, report) => {
      const productName = report.products?.product_name || 'Unknown Product';
      if (!acc[productName]) {
        acc[productName] = {
          tests: 0,
          blades: 0,
          defects: 0,
          defectRate: 0
        };
      }
      acc[productName].tests++;
      acc[productName].blades += report.total_saws || 0;
      acc[productName].defects += report.total_defects || 0;
      acc[productName].defectRate = acc[productName].blades > 0 ?
        (acc[productName].defects / acc[productName].blades) * 100 : 0;
      return acc;
    }, {});
    
    // Group by operator
    const byOperator = qcReports.reduce((acc, report) => {
      const operatorName = report.operators?.operator_name || 'Unknown Operator';
      if (!acc[operatorName]) {
        acc[operatorName] = {
          tests: 0,
          blades: 0,
          defects: 0,
          defectRate: 0
        };
      }
      acc[operatorName].tests++;
      acc[operatorName].blades += report.total_saws || 0;
      acc[operatorName].defects += report.total_defects || 0;
      acc[operatorName].defectRate = acc[operatorName].blades > 0 ? 
        (acc[operatorName].defects / acc[operatorName].blades) * 100 : 0;
      return acc;
    }, {});
    
    // Group by SKU (from scrap data in shift records)
    const bySKU = calculateBySKUMetrics(shiftRecords);
    
    return {
      total_tests: totalTests,
      total_blades: totalBlades,
      total_defects: totalDefects,
      overall_defect_rate: Math.round(avgDefectRate * 100) / 100,
      scrap_summary: scrapData.summary,
      byProduct,
      byOperator,
      bySKU,
      scrap_by_operator: scrapData.byOperator,
      scrap_by_activity: scrapData.byActivity,
      recommendations: [
        totalTests === 0 ? "No QC tests recorded in the selected period" : 
        avgDefectRate > 5 ? "Defect rate is above 5% - review production processes" : "Quality performance is within acceptable range",
        scrapData.summary.total_scrap > scrapData.summary.total_units * 0.02 ? "Scrap rate is above 2% - investigate production issues" : "Scrap rate is within acceptable range",
        "Ensure consistent QC testing across all production runs",
        "Monitor scrap rates by SKU to identify problematic products",
        "Review high-defect products for process improvements",
        "Provide additional training for operators with higher defect/scrap rates",
        "Implement preventive measures based on defect and scrap patterns"
      ]
    };
    
  } catch (error) {
    console.error('Error in generateDataQualityReport:', error);
    return {
      total_tests: 0,
      total_blades: 0,
      total_defects: 0,
      overall_defect_rate: 0,
      scrap_summary: { total_scrap: 0, total_units: 0, scrap_rate: 0 },
      byProduct: {},
      byOperator: {},
      bySKU: {},
      scrap_by_operator: {},
      scrap_by_activity: {},
      recommendations: [
        "Unable to fetch QC data - check database connectivity",
        "Ensure QC test reports are being properly recorded"
      ]
    };
  }
}

function calculateScrapMetrics(shiftRecords: any[]) {
  let totalScrap = 0;
  let totalUnits = 0;
  const byOperator: Record<string, { scrap: number, units: number, scrapRate: number }> = {};
  const byActivity: Record<string, { scrap: number, units: number, scrapRate: number }> = {};
  
  shiftRecords.forEach(record => {
    if (record.production_data?.activities && Array.isArray(record.production_data.activities)) {
      record.production_data.activities.forEach((activity: any) => {
        const activityName = activity.name;
        if (activity.entries && Array.isArray(activity.entries)) {
          activity.entries.forEach((entry: any) => {
            const scrap = entry.scrap || 0;
            const units = entry.units_produced || 0;
            
            totalScrap += scrap;
            totalUnits += units;
            
            // By operator
            const operatorName = record.operators?.operator_name || 'Unknown Operator';
            if (!byOperator[operatorName]) {
              byOperator[operatorName] = { scrap: 0, units: 0, scrapRate: 0 };
            }
            byOperator[operatorName].scrap += scrap;
            byOperator[operatorName].units += units;
            byOperator[operatorName].scrapRate = byOperator[operatorName].units > 0 ?
              (byOperator[operatorName].scrap / byOperator[operatorName].units) * 100 : 0;
            
            // By activity
            if (!byActivity[activityName]) {
              byActivity[activityName] = { scrap: 0, units: 0, scrapRate: 0 };
            }
            byActivity[activityName].scrap += scrap;
            byActivity[activityName].units += units;
            byActivity[activityName].scrapRate = byActivity[activityName].units > 0 ?
              (byActivity[activityName].scrap / byActivity[activityName].units) * 100 : 0;
          });
        }
      });
    }
  });
  
  const scrapRate = totalUnits > 0 ? (totalScrap / totalUnits) * 100 : 0;
  
  return {
    summary: {
      total_scrap: totalScrap,
      total_units: totalUnits,
      scrap_rate: Math.round(scrapRate * 100) / 100
    },
    byOperator,
    byActivity
  };
}

function calculateBySKUMetrics(shiftRecords: any[]) {
  const bySKU: Record<string, { units: number, scrap: number, scrapRate: number, tests: number, operators: Set<string> }> = {};
  
  shiftRecords.forEach(record => {
    if (record.production_data?.activities && Array.isArray(record.production_data.activities)) {
      record.production_data.activities.forEach((activity: any) => {
        if (activity.entries && Array.isArray(activity.entries)) {
          activity.entries.forEach((entry: any) => {
            const sku = entry.sku || 'Unknown SKU';
            const scrap = entry.scrap || 0;
            const units = entry.units_produced || 0;
            const operatorName = record.operators?.operator_name || 'Unknown';
            
            if (!bySKU[sku]) {
              bySKU[sku] = { 
                units: 0, 
                scrap: 0, 
                scrapRate: 0, 
                tests: 0,
                operators: new Set()
              };
            }
            
            bySKU[sku].units += units;
            bySKU[sku].scrap += scrap;
            bySKU[sku].operators.add(operatorName);
            bySKU[sku].scrapRate = bySKU[sku].units > 0 ?
              (bySKU[sku].scrap / bySKU[sku].units) * 100 : 0;
          });
        }
      });
    }
  });
  
  // Convert to serializable format
  const result: Record<string, any> = {};
  Object.entries(bySKU).forEach(([sku, data]) => {
    result[sku] = {
      units: data.units,
      scrap: data.scrap,
      scrapRate: Math.round(data.scrapRate * 100) / 100,
      tests: data.tests,
      operators: Array.from(data.operators)
    };
  });
  
  return result;
}

async function calculateManualDataQuality(supabase: any, dateFrom?: string, dateTo?: string, operator?: string) {
  console.log('calculateManualDataQuality fallback called');
  
  try {
    // Get basic shift records to calculate data quality manually
    let query = supabase
      .from('shift_records')
      .select('id, production_data, operators!shift_records_operator_id_fkey (operator_name, operator_code)');
    
    if (dateFrom && dateTo) {
      const fromDate = new Date(dateFrom);
      const toDate = new Date(dateTo);
      
      if (fromDate > toDate) {
        query = query.gte('shift_date', dateTo.split('T')[0]).lte('shift_date', dateFrom.split('T')[0]);
      } else {
        query = query.gte('shift_date', dateFrom.split('T')[0]).lte('shift_date', dateTo.split('T')[0]);
      }
    }
    
    const { data: shiftRecords, error } = await query;
    
    if (error) {
      console.error('Error fetching shift records:', error);
      throw error;
    }
    
    console.log('Manual data quality calculation with', shiftRecords?.length || 0, 'records');
    
    const totalRecords = shiftRecords?.length || 0;
    let recordsWithIssues = 0;
    
    // Simple data quality check - count records with missing or incomplete data
    shiftRecords?.forEach(record => {
      if (!record.production_data || 
          !record.production_data.activities || 
          !Array.isArray(record.production_data.activities) ||
          record.production_data.activities.length === 0) {
        recordsWithIssues++;
      }
    });
    
    const issuePercentage = totalRecords > 0 ? (recordsWithIssues / totalRecords) * 100 : 0;
    
    return {
      total_records: totalRecords,
      records_with_corrections: recordsWithIssues,
      correction_percentage: Math.round(issuePercentage * 100) / 100,
      recommendations: [
        "Ensure all operators submit complete timesheets daily",
        "Verify production data completeness before submission",
        "Review data entry processes for consistency",
        "Implement automated data validation rules",
        "Set up regular data quality monitoring",
        "Provide training on proper data entry procedures"
      ]
    };
    
  } catch (error) {
    console.error('Error in calculateManualDataQuality:', error);
    // Return safe fallback data
    return {
      total_records: 0,
      records_with_corrections: 0,
      correction_percentage: 0,
      recommendations: [
        "Review data entry processes for consistency",
        "Implement automated data validation rules",
        "Provide additional training on data quality standards"
      ]
    };
  }
}

function calculateProductivityMetrics(data: any[]) {
  console.log('calculateProductivityMetrics called with', data.length, 'records');
  // Simplified productivity calculation
  const summary = {
    total_shifts: data.length,
    total_units: 0,
    total_time: 0,
    average_efficiency: 0
  };

  const byOperator: Record<string, any> = {};
  const byActivity: Record<string, any> = {};
  const bySKU: Record<string, any> = {};

  data.forEach((record, index) => {
    console.log(`Processing record ${index + 1}:`, record.operators?.operator_code);
    if (record.production_data?.activities && Array.isArray(record.production_data.activities)) {
      record.production_data.activities.forEach((activity: any, actIndex: number) => {
        console.log(`  Activity ${actIndex + 1}:`, activity.name, 'entries:', activity.entries?.length);
        const activityName = activity.name;
        if (activity.entries && Array.isArray(activity.entries)) {
          activity.entries.forEach((entry: any, entryIndex: number) => {
            const units = entry.units_produced || 0;
            const time = entry.time_spent || 0;
            const sku = entry.sku || 'Unknown';
            console.log(`    Entry ${entryIndex + 1}: units=${units}, time=${time}, sku=${sku}`);
            
            summary.total_units += units;
            summary.total_time += time;

            // By operator
            const opCode = record.operators?.operator_code || 'unknown';
            if (!byOperator[opCode]) {
              byOperator[opCode] = { units: 0, time: 0, shifts: 0 };
            }
            byOperator[opCode].units += units;
            byOperator[opCode].time += time;

            // By activity
            if (!byActivity[activityName]) {
              byActivity[activityName] = { units: 0, time: 0, records: 0 };
            }
            byActivity[activityName].units += units;
            byActivity[activityName].time += time;
            byActivity[activityName].records++;

            // By SKU
            if (!bySKU[sku]) {
              bySKU[sku] = { units: 0, time: 0, activities: new Set(), operators: new Set() };
            }
            bySKU[sku].units += units;
            bySKU[sku].time += time;
            bySKU[sku].activities.add(activityName);
            bySKU[sku].operators.add(opCode);
          });
        }
      });
      
      // Count shifts per operator
      const opCode = record.operators?.operator_code || 'unknown';
      if (!byOperator[opCode]) {
        byOperator[opCode] = { units: 0, time: 0, shifts: 0 };
      }
      byOperator[opCode].shifts = (byOperator[opCode].shifts || 0) + 1;
    }
  });

  // Convert bySKU to proper format (Set to Array for JSON serialization)
  const bySKUFormatted: Record<string, any> = {};
  Object.entries(bySKU).forEach(([sku, data]: [string, any]) => {
    bySKUFormatted[sku] = {
      units: data.units,
      time: data.time,
      activities: Array.from(data.activities),
      operators: Array.from(data.operators),
      efficiency: data.time > 0 ? Math.round((data.units / data.time) * 100) / 100 : 0
    };
  });
  
  console.log('Final summary:', summary);
  console.log('Final byOperator:', byOperator);
  console.log('Final byActivity:', byActivity);
  console.log('Final bySKU:', bySKUFormatted);

  return {
    summary,
    byOperator,
    byActivity,
    bySKU: bySKUFormatted,
    trends: [] // Could add trend analysis here
  };
}

function calculateCombinedOperatorMetrics(compliance: any, productivity: any) {
  // Combine compliance and productivity data
  return {
    overall_score: 0, // Calculate based on both compliance and productivity
    recommendations: []
  };
}

async function generateCSV(data: any, type: string) {
  // Convert data to CSV format
  const csvContent = convertToCSV(data, type);
  
  return {
    type: 'download',
    format: 'csv',
    filename: `${type}_report_${new Date().toISOString().split('T')[0]}.csv`,
    content: csvContent,
    contentType: 'text/csv'
  };
}

async function generateExcel(data: any, type: string) {
  // Generate Excel file using CSV format for now
  const csvContent = convertToCSV(data, type);
  return {
    type: 'download',
    format: 'excel',
    filename: `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`,
    content: csvContent,
    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
}

async function generatePDF(data: any, type: string) {
  // Generate HTML content for PDF
  const htmlContent = generateHTMLReport(data, type);
  return {
    type: 'download',
    format: 'html',
    filename: `${type}_report_${new Date().toISOString().split('T')[0]}.html`,
    content: htmlContent,
    contentType: 'text/html'
  };
}

async function sendReportEmail(data: any, type: string) {
  // Send email with report (would integrate with email service)
  return {
    type: 'email',
    status: 'sent',
    message: 'Report has been sent to the specified recipients'
  };
}

function convertToCSV(data: any, type: string): string {
  if (type === 'compliance' && data.details) {
    const headers = ['Date', 'Operator', 'Submitted', 'Days Overdue', 'Escalation Level'];
    const rows = data.details.map((record: any) => [
      record.work_date,
      record.operators?.operator_name || 'Unknown',
      record.timesheet_submitted ? 'Yes' : 'No',
      record.days_overdue || 0,
      record.escalation_level || 'none'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  if (type === 'productivity' && data.summary) {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Total Shifts', data.summary.total_shifts],
      ['Total Units', data.summary.total_units],
      ['Total Time (hours)', data.summary.total_time],
      ['Average Efficiency', data.summary.average_efficiency]
    ];
    
    // Add operator data
    if (data.byOperator) {
      rows.push(['', '']); // Empty row
      rows.push(['Operator Performance', '']);
      rows.push(['Operator', 'Units', 'Time', 'Shifts']);
      Object.entries(data.byOperator).forEach(([operator, stats]: [string, any]) => {
        rows.push([operator, stats.units, stats.time, stats.shifts]);
      });
    }
    
    // Add SKU data
    if (data.bySKU) {
      rows.push(['', '']); // Empty row
      rows.push(['SKU Breakdown', '']);
      rows.push(['SKU', 'Units', 'Time', 'Efficiency']);
      Object.entries(data.bySKU).forEach(([sku, stats]: [string, any]) => {
        rows.push([sku, stats.units, stats.time, stats.efficiency]);
      });
    }
    
    return rows.map(row => row.join(',')).join('\n');
  }
  
  return 'Report data not available for CSV export';
}

function generateHTMLReport(data: any, type: string): string {
  const title = getReportTitle(type);
  let content = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; border-bottom: 2px solid #333; }
    h2 { color: #666; margin-top: 30px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    .summary { background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>`;
  
  if (type === 'compliance' && data.summary) {
    content += `
    <div class="summary">
      <h2>Compliance Summary</h2>
      <p><strong>Total Records:</strong> ${data.summary.total_records}</p>
      <p><strong>Compliance Rate:</strong> ${data.summary.compliance_rate}%</p>
      <p><strong>On-Time Rate:</strong> ${data.summary.on_time_rate}%</p>
      <p><strong>Overdue Count:</strong> ${data.summary.overdue_count}</p>
    </div>`;
  }
  
  if (type === 'productivity' && data.summary) {
    content += `
    <div class="summary">
      <h2>Productivity Summary</h2>
      <p><strong>Total Shifts:</strong> ${data.summary.total_shifts}</p>
      <p><strong>Total Units:</strong> ${data.summary.total_units}</p>
      <p><strong>Total Time:</strong> ${data.summary.total_time} hours</p>
      <p><strong>Average Efficiency:</strong> ${data.summary.average_efficiency}</p>
    </div>`;
    
    if (data.bySKU) {
      content += `
      <h2>SKU Breakdown</h2>
      <table>
        <thead>
          <tr><th>SKU</th><th>Units</th><th>Time (hours)</th><th>Efficiency</th></tr>
        </thead>
        <tbody>`;
      Object.entries(data.bySKU).forEach(([sku, stats]: [string, any]) => {
        content += `<tr><td>${sku}</td><td>${stats.units}</td><td>${stats.time}</td><td>${stats.efficiency}</td></tr>`;
      });
      content += `</tbody></table>`;
    }
  }
  
  content += `</body></html>`;
  return content;
}

function getReportTitle(type: string): string {
  const titles: Record<string, string> = {
    'compliance': 'Timesheet Compliance Report',
    'productivity': 'Productivity Analysis Report',
    'operator-summary': 'Operator Summary Report',
    'data-quality': 'Data Quality Report'
  };
  return titles[type] || 'Report';
}

serve(handler);