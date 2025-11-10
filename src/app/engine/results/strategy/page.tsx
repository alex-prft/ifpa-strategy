'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import { ArrowLeft, Target, Calendar, Users, BarChart3, TrendingUp, CheckCircle2, Clock, AlertTriangle, Brain, Star, Lightbulb, Zap, Award, ArrowUp, Rocket, Activity } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Link from 'next/link';
import Image from 'next/image';
import ResultsSidebar from '@/components/ResultsSidebar';
import EngineActionsSummary from '@/components/EngineActionsSummary';

// OSA Insights component with AI insights, priority recommendations, and strategic highlights
function OSAInsights({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole?: string }) {
  return (
    <div id="osa-insights" className="space-y-6">
      {/* Top AI Insights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-purple-600" />
            <CardTitle>Top AI Insights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                insight: "Personalization Opportunity",
                description: "Your audience segments show 40% variance in engagement patterns, indicating high personalization potential",
                confidence: 94,
                impact: "High"
              },
              {
                insight: "Content Performance Gap",
                description: "Educational content performs 3x better than promotional content in driving conversions",
                confidence: 89,
                impact: "Medium"
              },
              {
                insight: "Mobile Experience Priority",
                description: "65% of your traffic is mobile, but conversion rates are 28% lower than desktop",
                confidence: 96,
                impact: "High"
              },
              {
                insight: "Seasonal Trend Discovery",
                description: "Q2 shows consistent 35% uplift in engagement - optimize campaigns accordingly",
                confidence: 87,
                impact: "Medium"
              }
            ].map((item, index) => (
              <Card key={index} className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-purple-800">{item.insight}</h4>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.impact} Impact
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{item.description}</p>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">Confidence:</div>
                    <div className="text-xs font-medium">{item.confidence}%</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Recommendations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
            <CardTitle>Priority Recommendations</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              {
                priority: "P0",
                title: "Implement Mobile-First Personalization",
                description: "Deploy responsive personalization for mobile users to close the 28% conversion gap",
                effort: "Medium",
                timeline: "4-6 weeks",
                expectedLift: "+32% mobile conversion"
              },
              {
                priority: "P1",
                title: "Launch Behavioral Segmentation",
                description: "Create dynamic audience segments based on engagement patterns and purchase history",
                effort: "High",
                timeline: "6-8 weeks",
                expectedLift: "+24% overall engagement"
              },
              {
                priority: "P1",
                title: "Content Strategy Optimization",
                description: "Shift content mix to favor educational over promotional based on performance data",
                effort: "Low",
                timeline: "2-3 weeks",
                expectedLift: "+18% content engagement"
              }
            ].map((rec, index) => (
              <Card key={index} className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        rec.priority === 'P0' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {rec.priority}
                      </span>
                      <h4 className="font-semibold">{rec.title}</h4>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div><span className="font-medium">Effort:</span> {rec.effort}</div>
                    <div><span className="font-medium">Timeline:</span> {rec.timeline}</div>
                    <div className="text-green-600 font-medium">{rec.expectedLift}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Highlights */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6 text-yellow-600" />
            <CardTitle>Strategic Highlights</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Award className="h-4 w-4 text-blue-600" />
                Competitive Advantages
              </h4>
              <div className="space-y-3">
                {[
                  "Strong mobile traffic foundation (65% mobile users)",
                  "High-performing educational content library",
                  "Established seasonal optimization patterns",
                  "Diverse audience segments ready for personalization"
                ].map((advantage, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>{advantage}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                Innovation Opportunities
              </h4>
              <div className="space-y-3">
                {[
                  "AI-driven content recommendation engine",
                  "Dynamic pricing optimization based on behavior",
                  "Predictive customer journey mapping",
                  "Real-time personalization at scale"
                ].map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Zap className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>{opportunity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Strategy Overview component with quick wins, impact/effort matrix, and implementation details
function StrategyOverview({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole?: string }) {
  const quickWins = [
    {
      title: 'Mobile Experience Optimization',
      description: 'Implement responsive design improvements and mobile-specific personalization to address the 28% conversion gap',
      impact: 9,
      effort: 4,
      timeline: '3-4 weeks',
      expectedLift: '+32% mobile conversion',
      priority: 1
    },
    {
      title: 'Content Strategy Realignment',
      description: 'Shift content mix to favor educational over promotional content based on 3x performance advantage',
      impact: 7,
      effort: 2,
      timeline: '2-3 weeks',
      expectedLift: '+24% content engagement',
      priority: 2
    },
    {
      title: 'Behavioral Email Segmentation',
      description: 'Implement dynamic segmentation based on user behavior patterns and engagement history',
      impact: 8,
      effort: 3,
      timeline: '4-5 weeks',
      expectedLift: '+28% email performance',
      priority: 3
    }
  ];

  // Impact vs Effort matrix data
  const matrixItems = [
    { name: 'Mobile Optimization', impact: 9, effort: 4, category: 'quick-win' },
    { name: 'Email Segmentation', impact: 8, effort: 3, category: 'quick-win' },
    { name: 'Content Realignment', impact: 7, effort: 2, category: 'quick-win' },
    { name: 'AI Personalization', impact: 9, effort: 8, category: 'major-project' },
    { name: 'Data Platform Upgrade', impact: 8, effort: 9, category: 'major-project' },
    { name: 'Social Media Integration', impact: 4, effort: 3, category: 'minor' },
    { name: 'Newsletter Redesign', impact: 5, effort: 2, category: 'minor' },
    { name: 'Advanced Analytics', impact: 8, effort: 7, category: 'major-project' }
  ];

  return (
    <div className="space-y-8">
      {/* Top 3 Quick Wins */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-600" />
          Top 3 Quick Wins
        </h3>
        <div className="space-y-4">
          {quickWins.map((win, index) => (
            <Card key={index} className="border-l-4 border-l-green-500">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-800">#{win.priority}</span>
                    </div>
                    <h4 className="font-semibold text-lg">{win.title}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">{win.expectedLift}</div>
                    <div className="text-xs text-muted-foreground">Expected lift</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-4">{win.description}</p>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-blue-600">{win.impact}/10</div>
                    <div className="text-xs text-muted-foreground">Impact</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-orange-600">{win.effort}/10</div>
                    <div className="text-xs text-muted-foreground">Effort</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-purple-600">{win.timeline}</div>
                    <div className="text-xs text-muted-foreground">Timeline</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Impact vs Effort Matrix */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Impact vs Effort Matrix
        </h3>
        <Card>
          <CardContent className="p-6">
            <div className="relative w-full h-96 border border-gray-200 rounded-lg bg-gradient-to-tr from-gray-50 to-white">
              {/* Axis labels */}
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-sm font-medium text-muted-foreground">
                Effort →
              </div>
              <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 -rotate-90 text-sm font-medium text-muted-foreground">
                Impact →
              </div>

              {/* Quadrant labels */}
              <div className="absolute top-2 left-2 text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">
                Quick Wins
              </div>
              <div className="absolute top-2 right-2 text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                Major Projects
              </div>
              <div className="absolute bottom-2 left-2 text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-1 rounded">
                Fill-ins
              </div>
              <div className="absolute bottom-2 right-2 text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded">
                Thankless Tasks
              </div>

              {/* Matrix items */}
              {matrixItems.map((item, index) => {
                const x = (item.effort / 10) * 90 + 5; // 5-95% of width
                const y = 95 - (item.impact / 10) * 90; // Inverted Y axis, 5-95% of height

                return (
                  <div
                    key={index}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-full text-xs font-medium cursor-pointer transition-transform hover:scale-110 ${
                      item.category === 'quick-win'
                        ? 'bg-green-200 text-green-800 border-2 border-green-500'
                        : item.category === 'major-project'
                        ? 'bg-blue-200 text-blue-800 border-2 border-blue-500'
                        : 'bg-gray-200 text-gray-800 border-2 border-gray-400'
                    }`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                    title={`Impact: ${item.impact}/10, Effort: ${item.effort}/10`}
                  >
                    {item.name}
                  </div>
                );
              })}

              {/* Grid lines */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 opacity-20">
                <div className="border-r border-b border-gray-400"></div>
                <div className="border-b border-gray-400"></div>
                <div className="border-r border-gray-400"></div>
                <div></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Implementation Details & Next Steps */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Implementation Details & Next Steps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Immediate Actions (Next 2 weeks)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "Audit current mobile experience and identify key friction points",
                  "Analyze existing content library performance metrics",
                  "Set up behavior tracking for email engagement patterns",
                  "Establish baseline metrics for all quick win initiatives"
                ].map((action, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Clock className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span>{action}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Success Metrics & KPIs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  "Mobile conversion rate improvement: Target +32%",
                  "Content engagement metrics: Target +24%",
                  "Email performance lift: Target +28%",
                  "Overall ROI measurement and tracking setup"
                ].map((metric, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{metric}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function StrategyPlansPage() {
  const [workflowResult, setWorkflowResult] = useState<OSAWorkflowOutput | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Load workflow result from sessionStorage
    const savedResult = sessionStorage.getItem('osa_latest_result');
    if (savedResult) {
      setWorkflowResult(JSON.parse(savedResult));
    } else {
      // Redirect to engine if no result found
      router.push('/engine');
    }
  }, [router]);

  if (!workflowResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Loading strategy data...</h3>
            <p className="text-muted-foreground text-center">Retrieving your personalized strategy results</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="strategy-page-container" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div id="strategy-page-layout" className="flex">
        {/* Sidebar Navigation */}
        <ResultsSidebar currentPage="strategy" />

        {/* Main Content */}
        <main id="strategy-main-content" className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
        <div id="strategy-content-wrapper" className="space-y-6">
          {/* Section Header */}
          <div id="strategy-header" className="flex items-center gap-3 mb-6">
            <Target className="h-8 w-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold">Strategy Plans</h2>
              <p className="text-muted-foreground">Comprehensive strategy planning and roadmap development</p>
            </div>
          </div>

          {/* Strategy Plans Tabs */}
          <Tabs id="strategy-tabs-container" defaultValue="osa" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="osa">OSA</TabsTrigger>
              <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
              <TabsTrigger value="maturity">Maturity</TabsTrigger>
              <TabsTrigger value="phases">Phases</TabsTrigger>
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
            </TabsList>

            <TabsContent id="strategy-osa-content" value="osa">
              <OSAInsights workflowResult={workflowResult} selectedRole="marketing-manager" />
            </TabsContent>

            <TabsContent id="strategy-quick-wins-content" value="quick-wins">
              <StrategyOverview workflowResult={workflowResult} selectedRole="marketing-manager" />
            </TabsContent>

            <TabsContent id="strategy-maturity-content" value="maturity">
              <div className="space-y-6">
                {/* Current Maturity Score */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Target className="h-6 w-6 text-blue-600" />
                      <CardTitle>Current Maturity Score</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <div className="text-6xl font-bold text-blue-600 mb-2">7.3</div>
                      <div className="text-lg text-muted-foreground">Overall Maturity Score</div>
                      <div className="text-sm text-green-600 mt-1">+0.8 improvement from last assessment</div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {[
                        { category: 'Strategy', score: 78, trend: '+5', color: 'blue' },
                        { category: 'Technology', score: 65, trend: '+12', color: 'green' },
                        { category: 'Data', score: 72, trend: '+3', color: 'purple' },
                        { category: 'Content', score: 80, trend: '+8', color: 'orange' },
                        { category: 'Testing', score: 70, trend: '+15', color: 'red' }
                      ].map((item) => (
                        <Card key={item.category} className="text-center p-4">
                          <h4 className="font-semibold mb-2">{item.category}</h4>
                          <div className={`text-2xl font-bold text-${item.color}-600`}>{item.score}</div>
                          <div className="text-xs text-muted-foreground">/100</div>
                          <div className="text-xs text-green-600 mt-1">{item.trend}</div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Industry Benchmark Comparison */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-6 w-6 text-green-600" />
                      <CardTitle>Industry Benchmark Comparison</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        {
                          category: 'Overall Maturity',
                          yourScore: 73,
                          industryAvg: 62,
                          topPerformers: 85,
                          position: 'Above Average',
                          color: 'green'
                        },
                        {
                          category: 'Personalization Capabilities',
                          yourScore: 78,
                          industryAvg: 55,
                          topPerformers: 90,
                          position: 'Strong Position',
                          color: 'blue'
                        },
                        {
                          category: 'Data Integration & Analytics',
                          yourScore: 65,
                          industryAvg: 68,
                          topPerformers: 88,
                          position: 'Slight Gap',
                          color: 'yellow'
                        },
                        {
                          category: 'Testing & Optimization',
                          yourScore: 70,
                          industryAvg: 58,
                          topPerformers: 82,
                          position: 'Above Average',
                          color: 'green'
                        }
                      ].map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{item.category}</h4>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              item.color === 'green' ? 'bg-green-100 text-green-800' :
                              item.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {item.position}
                            </span>
                          </div>
                          <div className="relative">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div
                                className="bg-blue-600 h-3 rounded-full relative"
                                style={{ width: `${(item.yourScore / 100) * 100}%` }}
                              >
                                <span className="absolute right-0 top-4 text-xs font-medium">
                                  You: {item.yourScore}%
                                </span>
                              </div>
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground mt-1">
                              <span>Industry Avg: {item.industryAvg}%</span>
                              <span>Top 10%: {item.topPerformers}%</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Dimension Breakdown Analysis */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Award className="h-6 w-6 text-purple-600" />
                      <CardTitle>Dimension Breakdown Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4 text-green-800">Strengths & Advantages</h4>
                        <div className="space-y-3">
                          {[
                            { area: 'Content Personalization', score: 80, note: 'Strong foundational content library' },
                            { area: 'Strategic Planning', score: 78, note: 'Clear vision and roadmap alignment' },
                            { area: 'Testing Culture', score: 75, note: 'Growing experimentation mindset' }
                          ].map((strength, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                              <div>
                                <div className="font-medium">{strength.area}</div>
                                <div className="text-sm text-muted-foreground">{strength.note}</div>
                              </div>
                              <div className="text-lg font-bold text-green-600">{strength.score}%</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4 text-red-800">Areas for Improvement</h4>
                        <div className="space-y-3">
                          {[
                            { area: 'Technology Integration', score: 65, note: 'Need modern martech stack upgrades' },
                            { area: 'Data Analytics Maturity', score: 68, note: 'Limited predictive capabilities' },
                            { area: 'Advanced Automation', score: 58, note: 'Manual processes need optimization' }
                          ].map((weakness, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                              <div>
                                <div className="font-medium">{weakness.area}</div>
                                <div className="text-sm text-muted-foreground">{weakness.note}</div>
                              </div>
                              <div className="text-lg font-bold text-red-600">{weakness.score}%</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Readiness Summary - Wide Row */}
                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-6 w-6 text-blue-600" />
                      <CardTitle>Readiness Summary</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                          <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h4 className="font-semibold text-green-800">Ready to Execute</h4>
                        <p className="text-sm text-muted-foreground mt-2">Content optimization and basic personalization initiatives</p>
                        <div className="text-xs text-green-600 mt-1 font-medium">3 initiatives ready</div>
                      </div>

                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                          <Clock className="h-8 w-8 text-yellow-600" />
                        </div>
                        <h4 className="font-semibold text-yellow-800">Planning Required</h4>
                        <p className="text-sm text-muted-foreground mt-2">Advanced analytics and automation projects</p>
                        <div className="text-xs text-yellow-600 mt-1 font-medium">5 initiatives planned</div>
                      </div>

                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                          <Target className="h-8 w-8 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-blue-800">Future State</h4>
                        <p className="text-sm text-muted-foreground mt-2">AI-powered personalization at scale</p>
                        <div className="text-xs text-blue-600 mt-1 font-medium">12-18 months target</div>
                      </div>

                      <div className="text-center">
                        <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                          <Award className="h-8 w-8 text-purple-600" />
                        </div>
                        <h4 className="font-semibold text-purple-800">Innovation Potential</h4>
                        <p className="text-sm text-muted-foreground mt-2">Industry-leading optimization capabilities</p>
                        <div className="text-xs text-purple-600 mt-1 font-medium">24+ months vision</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Next Steps & Timeline - Wide Row */}
                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-orange-600" />
                      <CardTitle>Next Steps & Timeline</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                          <h4 className="font-semibold text-blue-800 mb-2">Next 30 Days</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5"></div>
                              <span>Complete mobile experience audit</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5"></div>
                              <span>Implement basic email segmentation</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5"></div>
                              <span>Set up enhanced analytics tracking</span>
                            </li>
                          </ul>
                        </div>

                        <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                          <h4 className="font-semibold text-green-800 mb-2">90-Day Milestones</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5"></div>
                              <span>Launch mobile optimization program</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5"></div>
                              <span>Deploy content personalization</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-600 mt-1.5"></div>
                              <span>Achieve 25% improvement targets</span>
                            </li>
                          </ul>
                        </div>

                        <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                          <h4 className="font-semibold text-purple-800 mb-2">6-Month Vision</h4>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5"></div>
                              <span>Advanced behavioral segmentation</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5"></div>
                              <span>Predictive analytics implementation</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <div className="w-2 h-2 rounded-full bg-purple-600 mt-1.5"></div>
                              <span>Cross-channel optimization</span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent id="strategy-phases-content" value="phases">
              <div className="space-y-6">
                {/* OPAL Phase Progression Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Rocket className="h-6 w-6 text-blue-600" />
                      <CardTitle>OPAL Phase Progression Overview</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-6">
                      <div className="text-4xl font-bold text-blue-600 mb-2">Walk Phase</div>
                      <div className="text-lg text-muted-foreground">Current Maturity Level</div>
                      <div className="text-sm text-green-600 mt-1">Ready to advance to Run Phase in 6-8 months</div>
                    </div>

                    {/* Phase Progression Visual */}
                    <div className="relative flex items-center justify-between mb-8">
                      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 transform -translate-y-1/2"></div>
                      <div className="absolute top-1/2 left-0 h-1 bg-blue-600 transform -translate-y-1/2" style={{ width: '50%' }}></div>

                      {[
                        { phase: 'Crawl', status: 'completed', icon: Activity },
                        { phase: 'Walk', status: 'current', icon: ArrowUp },
                        { phase: 'Run', status: 'next', icon: TrendingUp },
                        { phase: 'Fly', status: 'future', icon: Rocket }
                      ].map((item, index) => (
                        <div key={index} className="relative z-10 flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                            item.status === 'completed' ? 'bg-green-600 text-white' :
                            item.status === 'current' ? 'bg-blue-600 text-white' :
                            item.status === 'next' ? 'bg-yellow-500 text-white' :
                            'bg-gray-300 text-gray-600'
                          }`}>
                            <item.icon className="h-6 w-6" />
                          </div>
                          <div className="text-sm font-medium text-center">{item.phase}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Completed</h4>
                        <p className="text-2xl font-bold text-green-600">Crawl</p>
                        <p className="text-xs text-green-600 mt-1">Foundation established</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Current</h4>
                        <p className="text-2xl font-bold text-blue-600">Walk</p>
                        <p className="text-xs text-blue-600 mt-1">Scaling capabilities</p>
                      </Card>
                      <Card className="p-4 bg-yellow-50">
                        <h4 className="font-semibold text-yellow-800">Next Phase</h4>
                        <p className="text-2xl font-bold text-yellow-600">Run</p>
                        <p className="text-xs text-yellow-600 mt-1">6-8 months target</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Future Vision</h4>
                        <p className="text-2xl font-bold text-purple-600">Fly</p>
                        <p className="text-xs text-purple-600 mt-1">12-18 months goal</p>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Detailed Phase Breakdown */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Crawl Phase */}
                  <Card className="border-l-4 border-l-green-500">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Activity className="h-6 w-6 text-green-600" />
                        <div>
                          <CardTitle className="text-green-800">Crawl Phase</CardTitle>
                          <p className="text-sm text-green-600">Foundation & Basic Implementation</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Status</span>
                          <Badge className="bg-green-100 text-green-800">Completed</Badge>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Key Capabilities Achieved:</h5>
                          <div className="space-y-2">
                            {[
                              'Basic website analytics setup',
                              'Initial content management system',
                              'Email marketing platform integration',
                              'Fundamental SEO optimization',
                              'Social media presence establishment'
                            ].map((capability, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                <span>{capability}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Timeline:</h5>
                          <p className="text-sm text-muted-foreground">Completed in 3-4 months</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Walk Phase */}
                  <Card className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <ArrowUp className="h-6 w-6 text-blue-600" />
                        <div>
                          <CardTitle className="text-blue-800">Walk Phase</CardTitle>
                          <p className="text-sm text-blue-600">Scaling & Advanced Features</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Status</span>
                          <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Current Focus Areas:</h5>
                          <div className="space-y-2">
                            {[
                              { item: 'Advanced segmentation & personalization', status: 'in-progress' },
                              { item: 'A/B testing program implementation', status: 'completed' },
                              { item: 'Marketing automation workflows', status: 'in-progress' },
                              { item: 'Enhanced analytics & reporting', status: 'completed' },
                              { item: 'Multi-channel campaign coordination', status: 'planned' }
                            ].map((capability, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                {capability.status === 'completed' ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                ) : capability.status === 'in-progress' ? (
                                  <Clock className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <AlertTriangle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                )}
                                <span>{capability.item}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Progress:</h5>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">65% complete • 4 months remaining</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Run Phase */}
                  <Card className="border-l-4 border-l-yellow-500">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-yellow-600" />
                        <div>
                          <CardTitle className="text-yellow-800">Run Phase</CardTitle>
                          <p className="text-sm text-yellow-600">Optimization & Intelligence</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Status</span>
                          <Badge variant="outline">Next Phase</Badge>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Planned Capabilities:</h5>
                          <div className="space-y-2">
                            {[
                              'AI-driven predictive analytics',
                              'Real-time personalization at scale',
                              'Advanced customer journey optimization',
                              'Omnichannel experience orchestration',
                              'Machine learning recommendation engines'
                            ].map((capability, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <Target className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                <span>{capability}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Prerequisites:</h5>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>• Complete Walk phase capabilities</p>
                            <p>• Advanced data infrastructure</p>
                            <p>• Team training & skill development</p>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Timeline:</h5>
                          <p className="text-sm text-muted-foreground">Target: 6-8 months to initiate</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Fly Phase */}
                  <Card className="border-l-4 border-l-purple-500">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <Rocket className="h-6 w-6 text-purple-600" />
                        <div>
                          <CardTitle className="text-purple-800">Fly Phase</CardTitle>
                          <p className="text-sm text-purple-600">Innovation & Market Leadership</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-medium">Status</span>
                          <Badge variant="outline">Future Vision</Badge>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Innovation Goals:</h5>
                          <div className="space-y-2">
                            {[
                              'Industry-leading AI optimization',
                              'Autonomous campaign management',
                              'Predictive customer lifecycle modeling',
                              'Advanced market trend anticipation',
                              'Next-generation experience innovation'
                            ].map((capability, index) => (
                              <div key={index} className="flex items-start gap-2 text-sm">
                                <Award className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                <span>{capability}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Success Metrics:</h5>
                          <div className="space-y-1 text-sm text-muted-foreground">
                            <p>• Industry benchmark leadership</p>
                            <p>• Autonomous optimization (80%+)</p>
                            <p>• Predictive accuracy (95%+)</p>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-semibold mb-2">Timeline:</h5>
                          <p className="text-sm text-muted-foreground">Vision: 12-18 months horizon</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent id="strategy-roadmap-content" value="roadmap">
              <div className="space-y-6">
                {/* Strategic Implementation Roadmap Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                      <CardTitle>Strategic Implementation Roadmap</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Timeline Overview */}
                      <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

                        {[
                          {
                            period: "Q4 2024",
                            title: "Foundation & Quick Wins",
                            status: "in-progress",
                            color: "blue",
                            description: "Mobile optimization, content strategy, email segmentation",
                            initiatives: 5,
                            progress: 40
                          },
                          {
                            period: "Q1 2025",
                            title: "Scaling & Automation",
                            status: "planned",
                            color: "green",
                            description: "Advanced personalization, testing program, workflow automation",
                            initiatives: 7,
                            progress: 0
                          },
                          {
                            period: "Q2 2025",
                            title: "Intelligence & Optimization",
                            status: "future",
                            color: "yellow",
                            description: "AI-driven analytics, predictive modeling, omnichannel orchestration",
                            initiatives: 6,
                            progress: 0
                          },
                          {
                            period: "Q3-Q4 2025",
                            title: "Innovation & Leadership",
                            status: "future",
                            color: "purple",
                            description: "Autonomous optimization, market leadership capabilities",
                            initiatives: 4,
                            progress: 0
                          }
                        ].map((quarter, index) => (
                          <div key={index} className="relative flex items-start space-x-4 pb-8">
                            <div className={`w-4 h-4 rounded-full border-2 relative z-10 ${
                              quarter.status === 'in-progress' ? 'bg-blue-600 border-blue-600' :
                              quarter.status === 'planned' ? 'bg-white border-green-600' :
                              'bg-white border-gray-300'
                            }`}></div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h4 className="font-semibold">{quarter.period}: {quarter.title}</h4>
                                  <p className="text-sm text-muted-foreground">{quarter.description}</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium">{quarter.initiatives} initiatives</div>
                                  {quarter.progress > 0 && (
                                    <div className="text-xs text-blue-600">{quarter.progress}% complete</div>
                                  )}
                                </div>
                              </div>
                              {quarter.progress > 0 && (
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${quarter.progress}%` }}
                                  ></div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Next 90 Days - Critical Milestones */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Clock className="h-6 w-6 text-orange-600" />
                      <CardTitle>Next 90 Days - Critical Milestones</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Month 1 */}
                      <Card className="p-4 border-l-4 border-l-red-500">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-red-800">Month 1 (Dec 2024)</h4>
                          <Badge className="bg-red-100 text-red-800">Critical</Badge>
                        </div>
                        <div className="space-y-3">
                          {[
                            { task: "Mobile Experience Audit Complete", deadline: "Week 2", priority: "high" },
                            { task: "Email Segmentation Foundation", deadline: "Week 3", priority: "high" },
                            { task: "Content Performance Analysis", deadline: "Week 4", priority: "medium" },
                            { task: "A/B Testing Framework Setup", deadline: "Week 4", priority: "high" }
                          ].map((milestone, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div>
                                <div className="font-medium">{milestone.task}</div>
                                <div className="text-xs text-muted-foreground">{milestone.deadline}</div>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${
                                milestone.priority === 'high' ? 'bg-red-500' :
                                milestone.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Month 2 */}
                      <Card className="p-4 border-l-4 border-l-yellow-500">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-yellow-800">Month 2 (Jan 2025)</h4>
                          <Badge variant="outline">Important</Badge>
                        </div>
                        <div className="space-y-3">
                          {[
                            { task: "Mobile Optimization Implementation", deadline: "Week 2", priority: "high" },
                            { task: "Advanced Email Campaigns Launch", deadline: "Week 3", priority: "medium" },
                            { task: "Content Strategy Realignment", deadline: "Week 1", priority: "medium" },
                            { task: "Performance Baseline Establishment", deadline: "Week 4", priority: "high" }
                          ].map((milestone, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div>
                                <div className="font-medium">{milestone.task}</div>
                                <div className="text-xs text-muted-foreground">{milestone.deadline}</div>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${
                                milestone.priority === 'high' ? 'bg-red-500' :
                                milestone.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      {/* Month 3 */}
                      <Card className="p-4 border-l-4 border-l-green-500">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-green-800">Month 3 (Feb 2025)</h4>
                          <Badge variant="secondary">Optimization</Badge>
                        </div>
                        <div className="space-y-3">
                          {[
                            { task: "Results Analysis & Reporting", deadline: "Week 1", priority: "high" },
                            { task: "Personalization Engine Testing", deadline: "Week 2", priority: "medium" },
                            { task: "Q1 Strategy Refinement", deadline: "Week 3", priority: "medium" },
                            { task: "Phase 2 Planning & Preparation", deadline: "Week 4", priority: "high" }
                          ].map((milestone, index) => (
                            <div key={index} className="flex items-center justify-between text-sm">
                              <div>
                                <div className="font-medium">{milestone.task}</div>
                                <div className="text-xs text-muted-foreground">{milestone.deadline}</div>
                              </div>
                              <div className={`w-2 h-2 rounded-full ${
                                milestone.priority === 'high' ? 'bg-red-500' :
                                milestone.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                              }`}></div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Implementation Sequence & Dependencies */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-purple-600" />
                      <CardTitle>Implementation Sequence & Dependencies</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Critical Path Analysis */}
                      <div>
                        <h4 className="font-semibold mb-4">Critical Path & Dependencies</h4>
                        <div className="space-y-4">
                          {[
                            {
                              sequence: 1,
                              initiative: "Mobile Experience Foundation",
                              dependencies: ["Analytics setup", "Performance baseline"],
                              blocks: ["Content personalization", "Advanced testing"],
                              timeline: "Weeks 1-4",
                              risk: "low"
                            },
                            {
                              sequence: 2,
                              initiative: "Email & Content Optimization",
                              dependencies: ["Mobile foundation", "Audience data"],
                              blocks: ["Marketing automation", "Cross-channel campaigns"],
                              timeline: "Weeks 3-8",
                              risk: "medium"
                            },
                            {
                              sequence: 3,
                              initiative: "Personalization Engine",
                              dependencies: ["Email optimization", "Testing framework"],
                              blocks: ["AI implementation", "Advanced analytics"],
                              timeline: "Weeks 6-12",
                              risk: "high"
                            },
                            {
                              sequence: 4,
                              initiative: "Advanced Analytics & AI",
                              dependencies: ["Personalization engine", "Data quality"],
                              blocks: ["Autonomous optimization"],
                              timeline: "Weeks 10-16",
                              risk: "high"
                            }
                          ].map((item, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
                                    {item.sequence}
                                  </div>
                                  <div>
                                    <h5 className="font-semibold">{item.initiative}</h5>
                                    <p className="text-sm text-muted-foreground">{item.timeline}</p>
                                  </div>
                                </div>
                                <Badge variant={
                                  item.risk === 'low' ? 'secondary' :
                                  item.risk === 'medium' ? 'default' : 'destructive'
                                }>
                                  {item.risk} risk
                                </Badge>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                  <h6 className="font-medium text-red-800 mb-2">Depends On:</h6>
                                  <div className="space-y-1">
                                    {item.dependencies.map((dep, depIndex) => (
                                      <div key={depIndex} className="flex items-center gap-2">
                                        <ArrowLeft className="h-3 w-3 text-red-600" />
                                        <span className="text-red-700">{dep}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h6 className="font-medium text-green-800 mb-2">Enables:</h6>
                                  <div className="space-y-1">
                                    {item.blocks.map((block, blockIndex) => (
                                      <div key={blockIndex} className="flex items-center gap-2">
                                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                                        <span className="text-green-700">{block}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      {/* Resource Allocation */}
                      <div>
                        <h4 className="font-semibold mb-4">Resource Allocation & Team Requirements</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Card className="p-4">
                            <h5 className="font-semibold mb-3">Internal Resources</h5>
                            <div className="space-y-3">
                              {[
                                { role: "Marketing Manager", allocation: "100%", focus: "Strategy & coordination" },
                                { role: "Technical Lead", allocation: "75%", focus: "Implementation oversight" },
                                { role: "Content Strategist", allocation: "50%", focus: "Content optimization" },
                                { role: "Data Analyst", allocation: "60%", focus: "Performance tracking" }
                              ].map((resource, index) => (
                                <div key={index} className="flex items-center justify-between">
                                  <div>
                                    <div className="font-medium text-sm">{resource.role}</div>
                                    <div className="text-xs text-muted-foreground">{resource.focus}</div>
                                  </div>
                                  <Badge variant="outline">{resource.allocation}</Badge>
                                </div>
                              ))}
                            </div>
                          </Card>

                          <Card className="p-4">
                            <h5 className="font-semibold mb-3">External Support</h5>
                            <div className="space-y-3">
                              {[
                                { vendor: "Optimizely Professional Services", scope: "Platform optimization" },
                                { vendor: "Design Agency", scope: "Mobile UX redesign" },
                                { vendor: "Development Contractor", scope: "Technical implementation" },
                                { vendor: "Analytics Consultant", scope: "Data strategy" }
                              ].map((support, index) => (
                                <div key={index} className="flex items-start justify-between">
                                  <div>
                                    <div className="font-medium text-sm">{support.vendor}</div>
                                    <div className="text-xs text-muted-foreground">{support.scope}</div>
                                  </div>
                                  <Badge variant="secondary">External</Badge>
                                </div>
                              ))}
                            </div>
                          </Card>
                        </div>
                      </div>

                      {/* Success Metrics & KPIs */}
                      <div>
                        <h4 className="font-semibold mb-4">Success Metrics & Checkpoint KPIs</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            {
                              category: "Quick Wins (30 days)",
                              metrics: [
                                "Mobile conversion: +15%",
                                "Email engagement: +20%",
                                "Content time-on-page: +25%"
                              ],
                              color: "green"
                            },
                            {
                              category: "Mid-term (60 days)",
                              metrics: [
                                "Overall conversion: +18%",
                                "Personalization coverage: 60%",
                                "Testing velocity: 8 tests/month"
                              ],
                              color: "blue"
                            },
                            {
                              category: "Quarterly (90 days)",
                              metrics: [
                                "Revenue lift: +25%",
                                "Engagement score: 85+",
                                "Automation rate: 70%"
                              ],
                              color: "purple"
                            }
                          ].map((checkpoint, index) => (
                            <Card key={index} className="p-4">
                              <h5 className={`font-semibold mb-3 text-${checkpoint.color}-800`}>{checkpoint.category}</h5>
                              <div className="space-y-2">
                                {checkpoint.metrics.map((metric, metricIndex) => (
                                  <div key={metricIndex} className="flex items-center gap-2 text-sm">
                                    <Target className={`h-3 w-3 text-${checkpoint.color}-600`} />
                                    <span>{metric}</span>
                                  </div>
                                ))}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Engine Actions & Summary */}
          <EngineActionsSummary areaId="strategy-plans" subSectionId="osa" />
        </div>
        </main>
      </div>
    </div>
  );
}