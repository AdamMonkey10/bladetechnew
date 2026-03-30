import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface ProductionInsight {
  id: string
  type: 'trend' | 'anomaly' | 'alert'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  priority: number
  data?: any
  createdAt: string
}

interface OperatorPerformance {
  operatorId: string
  operatorName: string
  efficiency: number
  unitsPerHour: number
  scrapRate: number
  hoursWorked: number
  trend: 'improving' | 'declining' | 'stable'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: shiftData, error: shiftError } = await supabaseClient
      .from('shift_records')
      .select(`
        *,
        operators (operator_name, operator_code)
      `)
      .gte('shift_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])

    if (shiftError) {
      console.error('Error fetching shift data:', shiftError)
      return new Response(JSON.stringify({ error: 'Failed to fetch shift data' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { data: poData, error: poError } = await supabaseClient
      .from('customer_pos')
      .select('*')
      .eq('status', false)

    if (poError) {
      console.error('Error fetching PO data:', poError)
    }

    const insights: ProductionInsight[] = []
    let insightId = 1

    // Analyze operator performance trends
    const operatorStats = analyzeOperatorPerformance(shiftData || [])
    
    // Generate efficiency insights
    operatorStats.forEach(operator => {
      if (operator.trend === 'declining' && operator.efficiency < 80) {
        insights.push({
          id: `insight-${insightId++}`,
          type: 'alert',
          title: `${operator.operatorName} Efficiency Declining`,
          description: `${operator.operatorName} efficiency dropped to ${operator.efficiency.toFixed(1)}% (${operator.unitsPerHour.toFixed(1)} u/h).`,
          impact: 'high',
          priority: 90,
          data: { operatorId: operator.operatorId, efficiency: operator.efficiency },
          createdAt: new Date().toISOString()
        })
      } else if (operator.trend === 'improving' && operator.efficiency > 110) {
        insights.push({
          id: `insight-${insightId++}`,
          type: 'trend',
          title: `${operator.operatorName} Performance Improving`,
          description: `${operator.operatorName} showing strong improvement at ${operator.efficiency.toFixed(1)}% efficiency (${operator.unitsPerHour.toFixed(1)} u/h).`,
          impact: 'medium',
          priority: 60,
          data: { operatorId: operator.operatorId, efficiency: operator.efficiency },
          createdAt: new Date().toISOString()
        })
      }
    })

    // Analyze scrap rate patterns
    const scrapAnalysis = analyzeScrapRates(shiftData || [])
    if (scrapAnalysis.overallRate > 5) {
      insights.push({
        id: `insight-${insightId++}`,
        type: 'alert',
        title: 'High Scrap Rate Detected',
        description: `Overall scrap rate at ${scrapAnalysis.overallRate.toFixed(1)}%. Top contributors: ${scrapAnalysis.topContributors.join(', ')}`,
        impact: 'high',
        priority: 95,
        data: scrapAnalysis,
        createdAt: new Date().toISOString()
      })
    }

    // Analyze delivery risks
    if (poData && poData.length > 0) {
      const deliveryRisks = analyzeDeliveryRisks(poData, shiftData || [])
      deliveryRisks.forEach(risk => {
        insights.push({
          id: `insight-${insightId++}`,
          type: 'alert',
          title: `Delivery Risk: ${risk.poNumber}`,
          description: `${risk.customerName} PO ${risk.poNumber} at ${risk.progress}% completion. ${risk.daysRemaining} days until delivery.`,
          impact: risk.daysRemaining < 3 ? 'high' : 'medium',
          priority: risk.daysRemaining < 3 ? 85 : 70,
          data: risk,
          createdAt: new Date().toISOString()
        })
      })
    }


    // Sort insights by priority (highest first)
    insights.sort((a, b) => b.priority - a.priority)

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in production-insights function:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

function analyzeOperatorPerformance(shiftData: any[]): OperatorPerformance[] {
  const operatorMap = new Map<string, any>()

  shiftData.forEach(shift => {
    if (!shift.operators || !shift.production_data?.activities) return

    const operatorId = shift.operator_id
    const operatorName = shift.operators.operator_name
    
    if (!operatorMap.has(operatorId)) {
      operatorMap.set(operatorId, {
        operatorId,
        operatorName,
        totalUnits: 0,
        totalHours: 0,
        totalScrap: 0,
        shifts: []
      })
    }

    const operator = operatorMap.get(operatorId)
    
    // Calculate shift metrics
    let shiftUnits = 0
    let shiftHours = 0
    let shiftScrap = 0

    Object.values(shift.production_data.activities).forEach((activities: any) => {
      if (Array.isArray(activities)) {
        activities.forEach(activity => {
          shiftUnits += parseInt(activity.UnitsProduced) || 0
          shiftHours += parseFloat(activity.TimeSpent) || 0
          shiftScrap += parseInt(activity.ScrapProduced) || 0
        })
      }
    })

    operator.totalUnits += shiftUnits
    operator.totalHours += shiftHours
    operator.totalScrap += shiftScrap
    operator.shifts.push({
      date: shift.shift_date,
      units: shiftUnits,
      hours: shiftHours,
      efficiency: shiftHours > 0 ? (shiftUnits / shiftHours) : 0
    })
  })

  return Array.from(operatorMap.values()).map(op => {
    const unitsPerHour = op.totalHours > 0 ? op.totalUnits / op.totalHours : 0
    const scrapRate = op.totalUnits > 0 ? (op.totalScrap / op.totalUnits) * 100 : 0
    
    // Determine trend by comparing recent vs older shifts
    let trend: 'improving' | 'declining' | 'stable' = 'stable'
    if (op.shifts.length >= 3) {
      const recent = op.shifts.slice(-2).reduce((sum, s) => sum + s.efficiency, 0) / 2
      const older = op.shifts.slice(0, -2).reduce((sum, s) => sum + s.efficiency, 0) / Math.max(1, op.shifts.length - 2)
      
      if (recent > older * 1.1) trend = 'improving'
      else if (recent < older * 0.9) trend = 'declining'
    }

    return {
      operatorId: op.operatorId,
      operatorName: op.operatorName,
      efficiency: unitsPerHour > 0 ? (unitsPerHour / 400) * 100 : 0, // Assuming 400 u/h baseline
      unitsPerHour,
      scrapRate,
      hoursWorked: op.totalHours,
      trend
    }
  })
}

function analyzeScrapRates(shiftData: any[]): any {
  let totalUnits = 0
  let totalScrap = 0
  const operatorScrap = new Map<string, { scrap: number, units: number }>()

  shiftData.forEach(shift => {
    if (!shift.production_data?.activities) return

    Object.values(shift.production_data.activities).forEach((activities: any) => {
      if (Array.isArray(activities)) {
        activities.forEach(activity => {
          const units = parseInt(activity.UnitsProduced) || 0
          const scrap = parseInt(activity.ScrapProduced) || 0
          
          totalUnits += units
          totalScrap += scrap

          const operatorName = shift.operators?.operator_name || 'Unknown'
          if (!operatorScrap.has(operatorName)) {
            operatorScrap.set(operatorName, { scrap: 0, units: 0 })
          }
          const op = operatorScrap.get(operatorName)!
          op.scrap += scrap
          op.units += units
        })
      }
    })
  })

  const topContributors = Array.from(operatorScrap.entries())
    .map(([name, data]) => ({ name, rate: data.units > 0 ? (data.scrap / data.units) * 100 : 0 }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3)
    .map(op => `${op.name} (${op.rate.toFixed(1)}%)`)

  return {
    overallRate: totalUnits > 0 ? (totalScrap / totalUnits) * 100 : 0,
    topContributors
  }
}

function analyzeDeliveryRisks(poData: any[], shiftData: any[]): any[] {
  const risks = []

  poData.forEach(po => {
    if (!po.delivery_date) return

    const deliveryDate = new Date(po.delivery_date)
    const today = new Date()
    const daysRemaining = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysRemaining <= 7 && po.progress_percentage < 80) {
      risks.push({
        poNumber: po.po_number,
        customerName: po.customer_name,
        progress: po.progress_percentage,
        daysRemaining,
        deliveryDate: po.delivery_date
      })
    }
  })

  return risks
}
