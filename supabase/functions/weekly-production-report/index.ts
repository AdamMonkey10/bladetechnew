import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyReportRequest {
  weekStartDate?: string;
  manualTrigger?: boolean;
  recipientGroupIds?: string[];
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resendApiKey = Deno.env.get('RESEND_API_KEY');
const resend = resendApiKey ? new Resend(resendApiKey) : null;

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting weekly production report generation...');

    let { weekStartDate, manualTrigger = false, recipientGroupIds }: WeeklyReportRequest = {};
    
    if (req.method === 'POST') {
      const body = await req.json();
      weekStartDate = body.weekStartDate;
      manualTrigger = body.manualTrigger;
      recipientGroupIds = body.recipientGroupIds;
    }

    // Calculate week start date (Monday) if not provided
    if (!weekStartDate) {
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday = 0, Monday = 1
      const monday = new Date(now);
      monday.setDate(now.getDate() - daysToSubtract - 7); // Previous week
      weekStartDate = monday.toISOString().split('T')[0];
    }

    console.log(`Generating report for week starting: ${weekStartDate}`);

    // Generate the report data
    const { data: reportData, error: reportError } = await supabase
      .rpc('generate_weekly_production_report', { 
        week_start_date: weekStartDate 
      });

    if (reportError) {
      console.error('Error generating report data:', reportError);
      throw reportError;
    }

    console.log('Report data generated successfully');

    // Save the report to the database
    const { data: savedReport, error: saveError } = await supabase
      .from('weekly_reports')
      .insert({
        week_start_date: weekStartDate,
        week_end_date: reportData.week_end_date,
        report_data: reportData,
        status: 'completed'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving report:', saveError);
      throw saveError;
    }

    // Get recipients
    let recipientsQuery = supabase
      .from('report_recipients')
      .select(`
        *,
        recipient_group_members!inner(
          group_id,
          report_groups!inner(name)
        )
      `)
      .eq('active', true);

    if (recipientGroupIds && recipientGroupIds.length > 0) {
      recipientsQuery = recipientsQuery.in('recipient_group_members.group_id', recipientGroupIds);
    }

    const { data: recipients, error: recipientsError } = await recipientsQuery;

    if (recipientsError) {
      console.error('Error fetching recipients:', recipientsError);
      throw recipientsError;
    }

    if (!recipients || recipients.length === 0) {
      console.log('No active recipients found, skipping email send');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Report generated successfully but no recipients configured',
        reportId: savedReport.id,
        emailResults: {
          sent: 0,
          failed: 0,
          details: []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if Resend is configured
    if (!resend) {
      console.log('RESEND_API_KEY not configured, skipping email send');
      return new Response(JSON.stringify({ 
        success: true, 
        message: 'Report generated successfully but email service not configured',
        reportId: savedReport.id,
        emailResults: {
          sent: 0,
          failed: 0,
          details: []
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate HTML email content
    const emailHtml = generateEmailHtml(reportData);
    
    // Send emails to recipients
    const emailPromises = recipients.map(async (recipient: any) => {
      try {
        const emailResponse = await resend.emails.send({
          from: 'BladeTech Production <reports@bladetech.com>',
          to: [recipient.email],
          subject: `Weekly Production Report - ${formatDateRange(weekStartDate, reportData.week_end_date)}`,
          html: emailHtml,
        });

        console.log(`Email sent to ${recipient.email}:`, emailResponse.id);
        return { email: recipient.email, success: true, id: emailResponse.id };
      } catch (error) {
        console.error(`Failed to send email to ${recipient.email}:`, error);
        return { email: recipient.email, success: false, error: error.message };
      }
    });

    const emailResults = await Promise.all(emailPromises);
    const successCount = emailResults.filter(r => r.success).length;
    const failureCount = emailResults.filter(r => !r.success).length;

    console.log(`Report sent to ${successCount} recipients, ${failureCount} failures`);

    return new Response(JSON.stringify({
      success: true,
      reportId: savedReport.id,
      emailResults: {
        sent: successCount,
        failed: failureCount,
        details: emailResults
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in weekly-production-report function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

function generateEmailHtml(reportData: any): string {
  const { production_metrics, qc_metrics, po_metrics } = reportData;
  
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num >= 0 ? '+' : ''}${num}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return '#10B981'; // green
    if (change < 0) return '#EF4444'; // red
    return '#6B7280'; // gray
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Weekly Production Report</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f9fafb; }
        .container { max-width: 600px; margin: 0 auto; background-color: white; }
        .header { background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 24px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
        .header p { margin: 8px 0 0 0; opacity: 0.9; }
        .content { padding: 24px; }
        .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
        .metric-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
        .metric-title { font-size: 14px; color: #6b7280; margin-bottom: 8px; font-weight: 500; }
        .metric-value { font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 4px; }
        .metric-change { font-size: 12px; font-weight: 500; }
        .section { margin-bottom: 32px; }
        .section-title { font-size: 18px; font-weight: 600; color: #111827; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 2px solid #f3f4f6; }
        .alert { background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
        .alert-title { font-weight: 600; color: #dc2626; margin-bottom: 4px; }
        .footer { background-color: #f9fafb; padding: 24px; text-align: center; color: #6b7280; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Weekly Production Report</h1>
          <p>${formatDateRange(reportData.week_start_date, reportData.week_end_date)}</p>
        </div>
        
        <div class="content">
          <!-- Production Metrics -->
          <div class="section">
            <h2 class="section-title">📊 Production Overview</h2>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="metric-title">Labels Printed</div>
                <div class="metric-value">${formatNumber(production_metrics.current_week.total_labels)}</div>
                <div class="metric-change" style="color: ${getChangeColor(production_metrics.week_over_week.labels_change)}">
                  ${formatPercentage(production_metrics.week_over_week.labels_change)} vs last week
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Total Quantity</div>
                <div class="metric-value">${formatNumber(production_metrics.current_week.total_quantity)}</div>
                <div class="metric-change" style="color: ${getChangeColor(production_metrics.week_over_week.quantity_change)}">
                  ${formatPercentage(production_metrics.week_over_week.quantity_change)} vs last week
                </div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Active Operators</div>
                <div class="metric-value">${production_metrics.current_week.active_operators}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Active POs</div>
                <div class="metric-value">${production_metrics.current_week.active_pos}</div>
              </div>
            </div>
          </div>

          <!-- Quality Control -->
          <div class="section">
            <h2 class="section-title">🔍 Quality Control</h2>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="metric-title">Tests Performed</div>
                <div class="metric-value">${formatNumber(qc_metrics.total_tests)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Overall Defect Rate</div>
                <div class="metric-value">${qc_metrics.overall_defect_rate}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Total Saws Tested</div>
                <div class="metric-value">${formatNumber(qc_metrics.total_saws)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Total Defects</div>
                <div class="metric-value">${formatNumber(qc_metrics.total_defects)}</div>
              </div>
            </div>
          </div>

          <!-- Purchase Orders -->
          <div class="section">
            <h2 class="section-title">📋 Purchase Order Status</h2>
            <div class="metric-grid">
              <div class="metric-card">
                <div class="metric-title">Total POs</div>
                <div class="metric-value">${formatNumber(po_metrics.total_pos)}</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Completion Rate</div>
                <div class="metric-value">${po_metrics.completion_rate}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Average Progress</div>
                <div class="metric-value">${po_metrics.avg_progress}%</div>
              </div>
              <div class="metric-card">
                <div class="metric-title">Due This Week</div>
                <div class="metric-value">${formatNumber(po_metrics.due_this_week)}</div>
              </div>
            </div>
            
            ${po_metrics.overdue_pos > 0 ? `
            <div class="alert">
              <div class="alert-title">⚠️ Attention Required</div>
              <p>${po_metrics.overdue_pos} PO(s) are overdue and require immediate attention.</p>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="footer">
          <p>Generated automatically by BladeTech Production System</p>
          <p>Report generated on ${new Date().toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
      </div>
    </body>
    </html>
  `;
}