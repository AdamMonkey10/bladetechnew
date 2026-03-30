import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WeeklyBreakdownData {
  weekStart: string;
  weekEnd: string;
  summary: {
    totalProduction: number;
    totalRuntime: number;
    overallEfficiency: number;
    operatorsWorked: number;
    machinesUtilized: number;
    skusProduced: number;
  };
  operators: Array<{
    operatorName: string;
    totalUnits: number;
    totalRuntime: number;
    averageEfficiency: number;
    machines: Array<{
      machine: string;
      units: number;
      runtime: number;
      efficiency: number;
    }>;
  }>;
  machines: Array<{
    machine: string;
    totalUnits: number;
    totalRuntime: number;
    efficiency: number;
    utilization: number;
    operators: Array<{
      operatorName: string;
      units: number;
      runtime: number;
      efficiency: number;
    }>;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!openAIApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { weeklyData, mode = 'initial', messages = [] } = body;

    if (!weeklyData) {
      return new Response(
        JSON.stringify({ error: 'Weekly data is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing weekly breakdown data for:', weeklyData.weekStart, 'to', weeklyData.weekEnd, 'Mode:', mode);

    // Handle conversation mode
    if (mode === 'conversation') {
      const conversationPrompt = `You are an expert production analyst. You have access to the following weekly production data:

Summary:
- Week: ${weeklyData.weekStart} to ${weeklyData.weekEnd}
- Total Production: ${Number(weeklyData.summary?.totalProduction ?? 0).toLocaleString()} units
- Total Runtime: ${Number(weeklyData.summary?.totalRuntime ?? 0).toFixed(1)} hours
- Overall Efficiency: ${Number(weeklyData.summary?.overallEfficiency ?? 0).toFixed(1)}%
- Active Operators: ${weeklyData.summary?.operatorsWorked ?? 0}
- Machines Utilized: ${weeklyData.summary?.machinesUtilized ?? 0}

Top Operators:
${(weeklyData.operators || []).slice(0, 5).map((op: any) => 
  `- ${op.operatorName}: ${op.totalUnits} units, ${Number(op.averageEfficiency ?? 0).toFixed(1)}% efficiency`
).join('\n')}

Machine Performance:
${(weeklyData.machines || []).map((m: any) => 
  `- ${m.machine}: ${m.totalUnits} units, ${Number(m.efficiency ?? 0).toFixed(1)}% efficiency, ${Number(m.utilization ?? 0).toFixed(1)}% utilization`
).join('\n')}

Answer questions clearly and specifically, referencing actual numbers from the data. Keep responses concise but insightful.`;

      const conversationMessages = [
        { role: 'system', content: conversationPrompt },
        ...messages
      ];

      const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: conversationMessages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!chatResponse.ok) {
        const errorText = await chatResponse.text();
        console.error('OpenAI chat error:', chatResponse.status, errorText);
        throw new Error(`OpenAI API error: ${chatResponse.status}`);
      }

      const chatData = await chatResponse.json();
      const reply = chatData.choices[0].message.content;

      return new Response(
        JSON.stringify({ 
          reply,
          mode: 'conversation'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      );
    }

    // Prepare analysis prompt with structured data
    const analysisPrompt = `
You are an expert production analyst for a manufacturing company. Analyze the following weekly production data and provide comprehensive insights and recommendations.

WEEKLY DATA SUMMARY:
- Week: ${weeklyData.weekStart} to ${weeklyData.weekEnd}
- Total Production: ${Number(weeklyData.summary?.totalProduction ?? 0).toLocaleString()} units
- Total Runtime: ${Number(weeklyData.summary?.totalRuntime ?? 0).toFixed(1)} hours
- Overall Efficiency: ${Number(weeklyData.summary?.overallEfficiency ?? 0).toFixed(1)}%
- Active Operators: ${weeklyData.summary?.operatorsWorked ?? 0}
- Machines Utilized: ${weeklyData.summary?.machinesUtilized ?? 0}
- SKUs Produced: ${weeklyData.summary?.skusProduced ?? 0}

OPERATOR PERFORMANCE:
${(weeklyData.operators || []).map(op => {
  const machinesList = Array.isArray(op.machines)
    ? op.machines.map((m: any) => typeof m === 'string' ? m : `${m.machine}(${Number(m?.efficiency ?? 0).toFixed(1)}%)`).join(', ')
    : op.machineBreakdown
      ? Object.entries(op.machineBreakdown as Record<string, any>).map(([machine, d]) => `${machine}(${Number((d as any)?.efficiency ?? 0).toFixed(1)}%)`).join(', ')
      : 'N/A';
  return `\n- ${op.operatorName}: ${op.totalUnits ?? 0} units, ${Number(op.totalRuntime ?? 0).toFixed(1)}h runtime, ${Number(op.averageEfficiency ?? 0).toFixed(1)}% efficiency\n  Machines: ${machinesList}\n`;
}).join('')}

MACHINE PERFORMANCE:
${(weeklyData.machines || []).map(machine => `
- ${machine.machine}: ${machine.totalUnits ?? 0} units, ${Number(machine.totalRuntime ?? 0).toFixed(1)}h runtime, ${Number(machine.efficiency ?? 0).toFixed(1)}% efficiency, ${Number(machine.utilization ?? 0).toFixed(1)}% utilization
  Operators: ${Array.isArray(machine.operators) && machine.operators.length > 0 ? machine.operators.map(op => `${op.operatorName}(${Number(op?.efficiency ?? 0).toFixed(1)}%)`).join(', ') : 'N/A'}
`).join('')}

Please provide a comprehensive analysis in the following JSON format:

{
  "executiveSummary": "2-3 sentence overview of the week's performance highlighting key achievements and concerns",
  "performanceTrends": {
    "strengths": ["List 3-4 key strengths observed this week"],
    "concerns": ["List 2-3 areas of concern or declining performance"],
    "opportunities": ["List 2-3 immediate improvement opportunities"]
  },
  "operatorAnalysis": {
    "topPerformers": [
      {
        "name": "operator name",
        "achievement": "specific achievement description",
        "efficiency": "efficiency percentage"
      }
    ],
    "needsAttention": [
      {
        "name": "operator name",
        "issue": "specific issue description",
        "recommendation": "specific action recommendation"
      }
    ],
    "trainingOpportunities": ["List specific training recommendations based on performance patterns"]
  },
  "machineAnalysis": {
    "detailedBreakdown": [
      {
        "machine": "machine name",
        "overallUtilization": "utilization percentage",
        "overallEfficiency": "efficiency percentage",
        "shifts": [
          {
            "shift": "shift name/time period",
            "operators": ["operator names working this shift"],
            "units": "units produced this shift",
            "runtime": "runtime hours this shift",
            "efficiency": "efficiency percentage this shift",
            "utilization": "utilization percentage this shift",
            "issues": ["any performance issues during this shift"],
            "recommendations": ["shift-specific recommendations"]
          }
        ],
        "insights": "machine-specific insights and patterns",
        "recommendations": ["machine-specific recommendations"]
      }
    ],
    "bestUtilized": [
      {
        "machine": "machine name",
        "utilization": "utilization percentage",
        "insight": "why this machine performed well"
      }
    ],
    "underutilized": [
      {
        "machine": "machine name",
        "utilization": "utilization percentage",
        "recommendation": "specific recommendation to improve utilization"
      }
    ],
    "maintenanceAlerts": ["List any machines showing performance patterns that suggest maintenance needs"]
  },
  "qualityInsights": {
    "efficiencyTrends": "Analysis of efficiency patterns across operators and machines",
    "bottlenecks": ["Identify specific bottlenecks in the production process"],
    "optimizationOpportunities": ["Specific suggestions for process optimization"]
  },
  "actionableRecommendations": {
    "immediate": ["Actions that can be implemented this week"],
    "shortTerm": ["Actions for the next 2-4 weeks"],
    "strategic": ["Longer-term strategic recommendations"]
  },
  "keyMetrics": {
    "efficiencyRating": "Overall efficiency assessment (Excellent/Good/Needs Improvement)",
    "utilizationRating": "Overall utilization assessment (Excellent/Good/Needs Improvement)",
    "priorityAreas": ["Top 3 areas requiring immediate management attention"]
  }
}

Ensure all recommendations are specific, actionable, and based on the actual data provided. Focus on operational excellence and continuous improvement.`;

    // Call OpenAI with simple retry for rate limits (429) and transient errors (5xx)
    const openAIRequest = async (payload: any) => {
      let attempt = 0;
      const maxAttempts = 3;
      while (attempt < maxAttempts) {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) return res;

        const txt = await res.text();
        console.error('OpenAI API error attempt', attempt + 1, res.status, txt);

        // Retry on 429 (rate limit) and 5xx errors
        if (res.status === 429 || (res.status >= 500 && res.status < 600)) {
          attempt++;
          const backoffMs = 500 * attempt * attempt; // 0.5s, 2s, 4.5s
          await new Promise((r) => setTimeout(r, backoffMs));
          continue;
        }

        throw new Error(`OpenAI API error: ${res.status}`);
      }

      throw new Error('OpenAI API error: 429');
    };

    // Try OpenAI first, but gracefully fall back to a heuristic analysis on failure (e.g., quota/429)
    const buildHeuristicAnalysis = (data: WeeklyBreakdownData) => {
      const summary = data.summary || ({} as any);
      const operators = Array.isArray(data.operators) ? data.operators : [];
      const machines = Array.isArray(data.machines) ? data.machines : [];

      const totalProduction = Number(summary.totalProduction ?? 0);
      const totalRuntime = Number(summary.totalRuntime ?? 0);
      const overallEfficiency = Number(summary.overallEfficiency ?? 0);

      const avgUtilization = machines.length
        ? machines.reduce((acc, m: any) => acc + Number(m?.utilization ?? 0), 0) / machines.length
        : 0;

      const topMachineByUnits = machines.reduce((best: any, m: any) => {
        const units = Number(m?.totalUnits ?? 0);
        return !best || units > Number(best.totalUnits ?? 0) ? m : best;
      }, null as any);

      const zeroRuntimeMachines = machines.filter((m: any) => Number(m?.totalRuntime ?? 0) === 0).map((m: any) => m.machine);
      const underutilizedMachines = machines.filter((m: any) => {
        const util = Number(m?.utilization ?? 0);
        const run = Number(m?.totalRuntime ?? 0);
        return run > 0 && util > 0 && util < 10;
      });

      const maintenanceAlertMachines = machines.filter((m: any) => Number(m?.efficiency ?? 0) > 0 && Number(m?.efficiency ?? 0) < 70);

      const sortedOps = [...operators].sort((a: any, b: any) => Number(b?.averageEfficiency ?? 0) - Number(a?.averageEfficiency ?? 0));
      const topPerformers = sortedOps.slice(0, Math.min(2, sortedOps.length)).map((o: any) => ({
        name: o?.operatorName ?? 'Unknown',
        achievement: `Produced ${Number(o?.totalUnits ?? 0).toLocaleString()} units across ${Object.keys((o?.machineBreakdown ?? {})).length || (Array.isArray(o?.machines) ? o.machines.length : 0)} machines`,
        efficiency: `${Number(o?.averageEfficiency ?? 0).toFixed(1)}%`
      }));

      const needsAttention = operators
        .filter((o: any) => Number(o?.averageEfficiency ?? 0) > 0 && Number(o?.averageEfficiency ?? 0) < 80)
        .map((o: any) => ({
          name: o?.operatorName ?? 'Unknown',
          issue: 'Efficiency below target threshold',
          recommendation: 'Provide targeted coaching and review best practices from top performers'
        }));

      const trainingOpportunities = [
        ...(zeroRuntimeMachines.length ? [`Cross-train operators to run: ${zeroRuntimeMachines.join(', ')}`] : []),
        'Standardize top-performer methods into SOPs and brief huddles',
        'Refresher on changeover and first-piece validation to reduce ramp-up waste'
      ];

      const bestUtilized = machines
        .filter((m: any) => Number(m?.utilization ?? 0) > 0)
        .sort((a: any, b: any) => Number(b?.utilization ?? 0) - Number(a?.utilization ?? 0))
        .slice(0, 2)
        .map((m: any) => ({
          machine: m?.machine ?? 'Unknown',
          utilization: `${Number(m?.utilization ?? 0).toFixed(1)}%`,
          insight: 'Consistent scheduling and minimal downtime observed'
        }));

      const underutilized = underutilizedMachines.slice(0, 3).map((m: any) => ({
        machine: m?.machine ?? 'Unknown',
        utilization: `${Number(m?.utilization ?? 0).toFixed(1)}%`,
        recommendation: 'Load-level shift or cross-train to increase run time on this asset'
      }));

      const maintenanceAlerts = maintenanceAlertMachines.map((m: any) => (
        `${m?.machine ?? 'Unknown'}: Low efficiency (${Number(m?.efficiency ?? 0).toFixed(1)}%). Investigate optics, alignment, and preventive maintenance.`
      ));

      // Build detailed machine breakdown with shift analysis
      const detailedBreakdown = machines.map((machine: any) => {
        const machineOps = Array.isArray(machine.operators) ? machine.operators : [];
        const shifts = machineOps.length > 0 ? machineOps.map((op: any) => ({
          shift: `Operated by ${op.operatorName || 'Unknown'}`,
          operators: [op.operatorName || 'Unknown'],
          units: (op.units || 0).toString(),
          runtime: `${Number(op.runtime || 0).toFixed(1)}h`,
          efficiency: `${Number(op.efficiency || 0).toFixed(1)}%`,
          utilization: machine.utilization ? `${Number(machine.utilization).toFixed(1)}%` : 'N/A',
          issues: Number(op.efficiency || 0) < 80 ? ['Below target efficiency'] : [],
          recommendations: Number(op.efficiency || 0) < 80 ? ['Review standard operating procedures'] : ['Maintain current performance']
        })) : [{
          shift: 'No operator data available',
          operators: ['N/A'],
          units: '0',
          runtime: '0h',
          efficiency: '0%',
          utilization: '0%',
          issues: ['No production data'],
          recommendations: ['Verify machine scheduling and operator assignments']
        }];

        return {
          machine: machine.machine || 'Unknown',
          overallUtilization: `${Number(machine.utilization || 0).toFixed(1)}%`,
          overallEfficiency: `${Number(machine.efficiency || 0).toFixed(1)}%`,
          shifts,
          insights: `Total runtime: ${Number(machine.totalRuntime || 0).toFixed(1)}h, Total units: ${machine.totalUnits || 0}`,
          recommendations: Number(machine.efficiency || 0) < 80 ? 
            ['Schedule maintenance check', 'Review operator training needs'] : 
            ['Continue current maintenance schedule', 'Consider as benchmark for other machines']
        };
      });

      const strengths = [
        `Overall efficiency at ${overallEfficiency.toFixed(1)}%`,
        topMachineByUnits ? `${topMachineByUnits.machine} led output with ${Number(topMachineByUnits.totalUnits ?? 0).toLocaleString()} units` : 'Stable throughput on leading asset',
        avgUtilization > 0 ? `Avg. utilization ${avgUtilization.toFixed(1)}%` : 'Consistent scheduling across shifts'
      ];

      const concerns = [
        ...(zeroRuntimeMachines.length ? [`Idle/unused capacity: ${zeroRuntimeMachines.join(', ')}`] : []),
        ...(maintenanceAlertMachines.length ? ['Some machines show efficiency below 70%'] : []),
      ];

      const opportunities = [
        'Capture and scale top-performer techniques via quick SOPs',
        ...(underutilizedMachines.length ? ['Rebalance work to underutilized equipment to smooth flow'] : []),
        'Tighten changeover routines and pre-flight checks to reduce losses'
      ];

      const immediate = [
        ...(underutilizedMachines.length ? ['Create a one-week pilot schedule to load-level onto underutilized machines'] : []),
        'Hold 10-min shift huddle to align on daily targets and first-piece checks',
        ...(maintenanceAlertMachines.length ? ['Log CM tickets and perform quick condition checks on low-efficiency machines'] : [])
      ];

      const shortTerm = [
        'Draft SOPs with visuals for the top 2 SKUs and run them for two weeks',
        'Cross-train one additional operator per underutilized asset',
        'Introduce simple andon log for downtime reasons to target top two losses'
      ];

      const strategic = [
        'Establish weekly performance review with actions owner-tracked',
        'Build SMED program to reduce changeover time by 30-50%',
        'Develop skills matrix and training plan to balance shifts and assets'
      ];

      const efficiencyRating = overallEfficiency >= 100 ? 'Excellent' : overallEfficiency >= 85 ? 'Good' : 'Needs Improvement';
      const utilizationRating = avgUtilization >= 60 ? 'Excellent' : avgUtilization >= 35 ? 'Good' : 'Needs Improvement';

      const priorityAreas = [
        ...(underutilizedMachines.slice(0, 1).map((m: any) => `Increase utilization on ${m.machine}`)),
        ...(needsAttention.slice(0, 1).map((n: any) => `Support operator: ${n.name}`)),
        ...(maintenanceAlertMachines.slice(0, 1).map((m: any) => `Stabilize ${m.machine} efficiency`))
      ];

      const executiveSummary = `From ${data.weekStart} to ${data.weekEnd}, output totaled ${totalProduction.toLocaleString()} units over ${totalRuntime.toFixed(1)} hours. ` +
        `Efficiency averaged ${overallEfficiency.toFixed(1)}%. ${topMachineByUnits ? `${topMachineByUnits.machine} led output` : 'Output was concentrated on primary assets'}. ` +
        `${zeroRuntimeMachines.length ? `${zeroRuntimeMachines.length} assets were idle at times; load-leveling can improve flow.` : 'Utilization was balanced across active assets.'}`;

      return {
        executiveSummary,
        performanceTrends: { strengths, concerns, opportunities },
        operatorAnalysis: { topPerformers, needsAttention, trainingOpportunities },
        machineAnalysis: { detailedBreakdown, bestUtilized, underutilized, maintenanceAlerts },
        qualityInsights: {
          efficiencyTrends: `Average efficiency ${overallEfficiency.toFixed(1)}% with opportunity to stabilize low-performing assets`,
          bottlenecks: zeroRuntimeMachines.length ? [
            `Capacity sitting idle on: ${zeroRuntimeMachines.join(', ')}`
          ] : [
            'Changeovers and first-piece checks likely drive the main flow constraint'
          ],
          optimizationOpportunities: [
            'Standard work and pre-flight checklists to reduce ramp-up losses',
            'Load-level work to underutilized equipment to protect bottleneck capacity',
            'Quick PM checks on low-efficiency machines to restore baseline performance'
          ]
        },
        actionableRecommendations: { immediate, shortTerm, strategic },
        keyMetrics: { efficiencyRating, utilizationRating, priorityAreas }
      } as any;
    };

    let analysisResult: any | null = null;
    let analysisSource: 'openai' | 'heuristic' = 'heuristic';

    try {
      const response = await openAIRequest({
        model: 'gpt-5-2025-08-07',
        messages: [
          {
            role: 'system',
            content: 'You are an expert production analyst specializing in manufacturing operations, efficiency optimization, and performance analysis. Provide detailed, actionable insights based on production data.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_completion_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const aiResponse = await response.json();
      console.log('AI analysis completed successfully');

      try {
        analysisResult = JSON.parse(aiResponse.choices[0].message.content);
        analysisSource = 'openai';
      } catch (parseError) {
        console.error('Failed to parse AI response, falling back to heuristic:', parseError);
        analysisResult = buildHeuristicAnalysis(weeklyData);
        analysisSource = 'heuristic';
      }
    } catch (aiError) {
      console.error('OpenAI call failed, using heuristic analysis:', aiError);
      analysisResult = buildHeuristicAnalysis(weeklyData);
      analysisSource = 'heuristic';
    }

    return new Response(
      JSON.stringify({
        analysis: analysisResult,
        weekInfo: {
          weekStart: weeklyData.weekStart,
          weekEnd: weeklyData.weekEnd,
          analyzedAt: new Date().toISOString(),
          source: analysisSource
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-weekly-breakdown function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to analyze weekly breakdown data',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});