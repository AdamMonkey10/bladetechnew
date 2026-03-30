import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Settings, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Loader2,
  RefreshCw,
  Star,
  Award,
  Wrench,
  Lightbulb,
  ArrowRight,
  MessageSquare,
  Send,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AIChatMessage } from './AIChatMessage';

interface AIAnalysisResult {
  executiveSummary: string;
  performanceTrends: {
    strengths: string[];
    concerns: string[];
    opportunities: string[];
  };
  operatorAnalysis: {
    topPerformers: Array<{
      name: string;
      achievement: string;
      efficiency: string;
    }>;
    needsAttention: Array<{
      name: string;
      issue: string;
      recommendation: string;
    }>;
    trainingOpportunities: string[];
  };
  machineAnalysis: {
    detailedBreakdown?: Array<{
      machine: string;
      overallUtilization: string;
      overallEfficiency: string;
      shifts: Array<{
        shift: string;
        operators: string[];
        units: string;
        runtime: string;
        efficiency: string;
        utilization: string;
        issues: string[];
        recommendations: string[];
      }>;
      insights: string;
      recommendations: string[];
    }>;
    bestUtilized: Array<{
      machine: string;
      utilization: string;
      insight: string;
    }>;
    underutilized: Array<{
      machine: string;
      utilization: string;
      recommendation: string;
    }>;
    maintenanceAlerts: string[];
  };
  qualityInsights: {
    efficiencyTrends: string;
    bottlenecks: string[];
    optimizationOpportunities: string[];
  };
  actionableRecommendations: {
    immediate: string[];
    shortTerm: string[];
    strategic: string[];
  };
  keyMetrics: {
    efficiencyRating: string;
    utilizationRating: string;
    priorityAreas: string[];
  };
}

interface WeekInfo {
  weekStart: string;
  weekEnd: string;
  analyzedAt: string;
}

interface AIWeeklyAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weeklyData: any;
}

export function AIWeeklyAnalysisDialog({ open, onOpenChange, weeklyData }: AIWeeklyAnalysisDialogProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [weekInfo, setWeekInfo] = useState<WeekInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'analysis' | 'conversation'>('analysis');
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string, timestamp: string}>>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Debug logging
  React.useEffect(() => {
    if (open) {
      console.log('AI Analysis Dialog opened with data:', weeklyData);
    }
  }, [open, weeklyData]);

  // Auto-run analysis when dialog becomes open
  React.useEffect(() => {
    if (open && !analysis && !isAnalyzing) {
      performAnalysis();
    }
  }, [open]);

  const performAnalysis = async () => {
    if (!weeklyData) {
      toast({
        title: "No Data Available",
        description: "Weekly breakdown data is required for analysis.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

    try {
      console.log('Invoking analyze-weekly-breakdown with payload:', {
        summary: weeklyData?.summary,
        operatorsCount: weeklyData?.operators?.length,
        machinesCount: weeklyData?.machines?.length,
        weekStart: weeklyData?.weekStart,
        weekEnd: weeklyData?.weekEnd,
      });
      const { data, error: functionError } = await supabase.functions.invoke('analyze-weekly-breakdown', {
        body: { weeklyData, mode: 'initial' }
      });
      console.log('Function response:', { data, functionError });

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data.analysis);
      setWeekInfo(data.weekInfo);
      
      toast({
        title: "Analysis Complete",
        description: "AI has successfully analyzed your weekly production data.",
      });

    } catch (err) {
      console.error('Analysis error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze weekly data');
      toast({
        title: "Analysis Failed",
        description: "Failed to generate AI analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const sendChatMessage = async () => {
    if (!inputMessage.trim() || !weeklyData) return;

    const userMessage = {
      role: 'user' as const,
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsSending(true);

    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const { data, error: functionError } = await supabase.functions.invoke('analyze-weekly-breakdown', {
        body: { 
          weeklyData, 
          mode: 'conversation',
          messages: [...conversationHistory, { role: 'user', content: userMessage.content }]
        }
      });

      if (functionError) throw functionError;

      const assistantMessage = {
        role: 'assistant' as const,
        content: data.reply,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      setTimeout(() => {
        chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
      }, 100);

    } catch (err) {
      console.error('Chat error:', err);
      toast({
        title: "Chat Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const askSuggestedQuestion = (question: string) => {
    setInputMessage(question);
    setTimeout(() => sendChatMessage(), 100);
  };

  const getRatingColor = (rating: string) => {
    switch (rating?.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'needs improvement': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (newOpen && !analysis && !isAnalyzing) {
      performAnalysis();
    }
    if (!newOpen) {
      setChatMode('analysis');
      setMessages([]);
      setInputMessage('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                AI Weekly Production Analysis
              </DialogTitle>
              <DialogDescription>
                {weekInfo ? (
                  `Analysis for week ${weekInfo.weekStart} to ${weekInfo.weekEnd}`
                ) : (
                  'Comprehensive AI-powered insights and recommendations for your weekly production data'
                )}
              </DialogDescription>
            </div>
            {analysis && (
              <Button
                variant={chatMode === 'conversation' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChatMode(chatMode === 'analysis' ? 'conversation' : 'analysis')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {chatMode === 'analysis' ? 'Ask Questions' : 'View Analysis'}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Analyzing Production Data</h3>
                <p className="text-muted-foreground">
                  AI is processing your weekly breakdown data and generating insights...
                </p>
              </div>
            </div>
          )}

          {error && !isAnalyzing && (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold text-red-600">Analysis Failed</h3>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={performAnalysis} variant="outline" className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry Analysis
                </Button>
              </div>
            </div>
          )}

          {analysis && !isAnalyzing && chatMode === 'analysis' && (
            <ScrollArea className="h-full">
              <div className="space-y-6 pr-6">
                {/* Executive Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-base leading-relaxed">{analysis.executiveSummary}</p>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">EFFICIENCY RATING</h4>
                        <Badge className={getRatingColor(analysis.keyMetrics.efficiencyRating)}>
                          {analysis.keyMetrics.efficiencyRating}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm text-muted-foreground">UTILIZATION RATING</h4>
                        <Badge className={getRatingColor(analysis.keyMetrics.utilizationRating)}>
                          {analysis.keyMetrics.utilizationRating}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Tabs defaultValue="performance" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="operators">Operators</TabsTrigger>
                    <TabsTrigger value="machines">Machines</TabsTrigger>
                    <TabsTrigger value="actions">Actions</TabsTrigger>
                  </TabsList>

                  <TabsContent value="performance" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Strengths */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Strengths
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.performanceTrends.strengths.map((strength, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <Star className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Concerns */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                            Concerns
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.performanceTrends.concerns.map((concern, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <AlertTriangle className="h-3 w-3 text-orange-500 mt-0.5 flex-shrink-0" />
                                {concern}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Opportunities */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-blue-600">
                            <Lightbulb className="h-4 w-4" />
                            Opportunities
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.performanceTrends.opportunities.map((opportunity, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <Lightbulb className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                                {opportunity}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Priority Areas */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-4 w-4 text-red-600" />
                          Priority Areas Requiring Attention
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {analysis.keyMetrics.priorityAreas.map((area, idx) => (
                            <Badge key={idx} variant="destructive" className="text-center py-2">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="operators" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Top Performers */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-green-600">
                            <Award className="h-4 w-4" />
                            Top Performers
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {analysis.operatorAnalysis.topPerformers.map((performer, idx) => (
                            <div key={idx} className="p-3 bg-green-50 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{performer.name}</h4>
                                <Badge variant="secondary">{performer.efficiency}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{performer.achievement}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Needs Attention */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-orange-600">
                            <Users className="h-4 w-4" />
                            Needs Attention
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {analysis.operatorAnalysis.needsAttention.map((operator, idx) => (
                            <div key={idx} className="p-3 bg-orange-50 rounded-lg">
                              <h4 className="font-semibold mb-1">{operator.name}</h4>
                              <p className="text-sm text-muted-foreground mb-2">{operator.issue}</p>
                              <p className="text-sm font-medium text-orange-700">
                                <ArrowRight className="h-3 w-3 inline mr-1" />
                                {operator.recommendation}
                              </p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Training Opportunities */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          Training Opportunities
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {analysis.operatorAnalysis.trainingOpportunities.map((training, idx) => (
                            <li key={idx} className="text-sm flex items-start gap-2">
                              <ArrowRight className="h-3 w-3 text-blue-500 mt-0.5 flex-shrink-0" />
                              {training}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="machines" className="space-y-4">
                    {/* Detailed Machine Breakdown */}
                    {analysis.machineAnalysis.detailedBreakdown && analysis.machineAnalysis.detailedBreakdown.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Settings className="h-4 w-4 text-blue-600" />
                            Detailed Machine & Shift Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {analysis.machineAnalysis.detailedBreakdown.map((machine, idx) => (
                            <div key={idx} className="border rounded-lg p-4 space-y-3">
                              <div className="flex justify-between items-center">
                                <h4 className="text-lg font-semibold">{machine.machine}</h4>
                                <div className="flex gap-2">
                                  <Badge variant="outline">Util: {machine.overallUtilization}</Badge>
                                  <Badge variant="outline">Eff: {machine.overallEfficiency}</Badge>
                                </div>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">{machine.insights}</p>
                              
                              {/* Shift Breakdown */}
                              <div className="space-y-2">
                                <h5 className="font-medium text-sm text-muted-foreground">SHIFT BREAKDOWN</h5>
                                <div className="grid gap-2">
                                  {machine.shifts.map((shift, shiftIdx) => (
                                    <div key={shiftIdx} className="bg-gray-50 p-3 rounded">
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className="font-medium text-sm">{shift.shift}</p>
                                          <p className="text-xs text-muted-foreground">
                                            Operators: {shift.operators.join(', ')}
                                          </p>
                                        </div>
                                        <div className="text-right text-xs space-y-1">
                                          <div>Units: {shift.units}</div>
                                          <div>Runtime: {shift.runtime}</div>
                                          <div>Efficiency: {shift.efficiency}</div>
                                        </div>
                                      </div>
                                      
                                      {shift.issues.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs font-medium text-orange-600">Issues:</p>
                                          <ul className="text-xs text-orange-700 ml-2">
                                            {shift.issues.map((issue, issueIdx) => (
                                              <li key={issueIdx}>• {issue}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      
                                      {shift.recommendations.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs font-medium text-blue-600">Recommendations:</p>
                                          <ul className="text-xs text-blue-700 ml-2">
                                            {shift.recommendations.map((rec, recIdx) => (
                                              <li key={recIdx}>• {rec}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                              
                              {/* Machine Recommendations */}
                              {machine.recommendations.length > 0 && (
                                <div className="mt-3 p-3 bg-blue-50 rounded">
                                  <h6 className="font-medium text-sm text-blue-800 mb-1">Machine Recommendations:</h6>
                                  <ul className="text-sm text-blue-700 space-y-1">
                                    {machine.recommendations.map((rec, recIdx) => (
                                      <li key={recIdx} className="flex items-start gap-1">
                                        <ArrowRight className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                        {rec}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {/* Best Utilized */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-green-600">
                            <Settings className="h-4 w-4" />
                            Best Utilized Machines
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {analysis.machineAnalysis.bestUtilized.map((machine, idx) => (
                            <div key={idx} className="p-3 bg-green-50 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{machine.machine}</h4>
                                <Badge variant="secondary">{machine.utilization}</Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{machine.insight}</p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      {/* Underutilized */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-orange-600">
                            <Clock className="h-4 w-4" />
                            Underutilized Machines
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {analysis.machineAnalysis.underutilized.map((machine, idx) => (
                            <div key={idx} className="p-3 bg-orange-50 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-semibold">{machine.machine}</h4>
                                <Badge variant="outline">{machine.utilization}</Badge>
                              </div>
                              <p className="text-sm font-medium text-orange-700">
                                <ArrowRight className="h-3 w-3 inline mr-1" />
                                {machine.recommendation}
                              </p>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Maintenance Alerts */}
                    {analysis.machineAnalysis.maintenanceAlerts.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-600">
                            <Wrench className="h-4 w-4" />
                            Maintenance Alerts
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.machineAnalysis.maintenanceAlerts.map((alert, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <Wrench className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                                {alert}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* Immediate Actions */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            Immediate (This Week)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.actionableRecommendations.immediate.map((action, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Short Term Actions */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-orange-600">
                            <Clock className="h-4 w-4" />
                            Short Term (2-4 Weeks)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.actionableRecommendations.shortTerm.map((action, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {/* Strategic Actions */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-blue-600">
                            <Target className="h-4 w-4" />
                            Strategic (Long Term)
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {analysis.actionableRecommendations.strategic.map((action, idx) => (
                              <li key={idx} className="text-sm flex items-start gap-2">
                                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}

          {analysis && !isAnalyzing && chatMode === 'conversation' && (
            <div className="flex flex-col h-full">
              {messages.length === 0 && (
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground mb-2">Quick questions to get started:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Which operator needs the most urgent training?",
                      "What's causing the efficiency issues?",
                      "How can we improve utilization this week?",
                      "What are the root causes for the concerns identified?"
                    ].map((question, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        onClick={() => askSuggestedQuestion(question)}
                        disabled={isSending}
                        className="text-xs"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        {question}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <ScrollArea className="flex-1 pr-4 mb-4" ref={chatScrollRef}>
                <div className="space-y-4">
                  {messages.map((msg, i) => (
                    <AIChatMessage
                      key={i}
                      role={msg.role}
                      content={msg.content}
                      timestamp={msg.timestamp}
                    />
                  ))}
                  {isSending && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  )}
                </div>
              </ScrollArea>

              <div className="flex gap-2 mt-auto">
                <Input
                  placeholder="Ask a question about the production data..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                  disabled={isSending}
                />
                <Button
                  onClick={sendChatMessage}
                  disabled={!inputMessage.trim() || isSending}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {weekInfo && (
              `Generated on ${new Date(weekInfo.analyzedAt).toLocaleString()}`
            )}
          </div>
          <div className="space-x-2">
            {analysis && (
              <Button onClick={performAnalysis} variant="outline" disabled={isAnalyzing}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Analysis
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}