import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingUp, TrendingDown, Lightbulb, Bell } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface ProductionInsight {
  id: string
  type: 'trend' | 'anomaly' | 'recommendation' | 'alert'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  priority: number
  data?: any
  createdAt: string
}

export function ProductionInsights() {
  const [insights, setInsights] = useState<ProductionInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('production-insights')
        
        if (error) {
          console.error('Error fetching insights:', error)
          setError('Failed to load production insights')
          return
        }

        setInsights(data?.insights || [])
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load production insights')
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
    
    // Refresh insights every 30 minutes
    const interval = setInterval(fetchInsights, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Production Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">Loading insights...</div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            Production Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{error}</div>
        </CardContent>
      </Card>
    )
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'alert':
        return <AlertTriangle className="h-4 w-4" />
      case 'trend':
        return <TrendingUp className="h-4 w-4" />
      case 'anomaly':
        return <TrendingDown className="h-4 w-4" />
      case 'recommendation':
        return <Lightbulb className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'destructive'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'text-destructive'
      case 'trend':
        return 'text-primary'
      case 'anomaly':
        return 'text-orange-600'
      case 'recommendation':
        return 'text-blue-600'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Production Intelligence
          <Badge variant="outline" className="ml-auto">
            {insights.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <div>No insights available at the moment</div>
            <div className="text-sm">AI is analyzing your production data...</div>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.slice(0, 8).map((insight) => (
              <div
                key={insight.id}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className={`${getTypeColor(insight.type)} mt-0.5`}>
                  {getIcon(insight.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                    <Badge variant={getImpactColor(insight.impact)} className="text-xs">
                      {insight.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {insight.description}
                  </p>
                </div>
              </div>
            ))}
            
            {insights.length > 8 && (
              <div className="text-center pt-2">
                <Badge variant="outline" className="text-xs">
                  +{insights.length - 8} more insights available
                </Badge>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}