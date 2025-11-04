'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { PMGWorkflowOutput } from '@/lib/types/maturity';

interface MaturityAnalyticsDashboardProps {
  workflowResult: PMGWorkflowOutput;
}

export default function MaturityAnalyticsDashboard({ workflowResult }: MaturityAnalyticsDashboardProps) {
  const { maturity_plan } = workflowResult;

  // Chart Data
  const maturityScoreData = [
    { phase: 'Crawl', currentScore: 2.1, targetScore: 3.0, benchmark: 2.5 },
    { phase: 'Walk', currentScore: 1.8, targetScore: 3.5, benchmark: 3.0 },
    { phase: 'Run', currentScore: 1.2, targetScore: 4.0, benchmark: 3.5 },
    { phase: 'Fly', currentScore: 0.8, targetScore: 4.5, benchmark: 4.0 }
  ];

  const capabilityRadarData = [
    { capability: 'Experimentation', A: maturity_plan.overall_maturity_score * 0.9, B: 4.5, fullMark: 5 },
    { capability: 'Personalization', A: maturity_plan.overall_maturity_score * 1.1, B: 4.2, fullMark: 5 },
    { capability: 'Data Integration', A: maturity_plan.overall_maturity_score * 0.8, B: 3.8, fullMark: 5 },
    { capability: 'Analytics', A: maturity_plan.overall_maturity_score * 1.2, B: 4.0, fullMark: 5 },
    { capability: 'Campaign Mgmt', A: maturity_plan.overall_maturity_score * 0.7, B: 3.5, fullMark: 5 },
    { capability: 'Customer Insights', A: maturity_plan.overall_maturity_score * 1.0, B: 4.1, fullMark: 5 }
  ];

  const progressTimelineData = [
    { month: 'Month 1', progress: 15, milestone: 'Foundation Setup' },
    { month: 'Month 2', progress: 28, milestone: 'Basic Implementation' },
    { month: 'Month 3', progress: 45, milestone: 'First Tests Running' },
    { month: 'Month 6', progress: 65, milestone: 'Advanced Features' },
    { month: 'Month 9', progress: 80, milestone: 'Optimization Phase' },
    { month: 'Month 12', progress: 95, milestone: 'Mature Operations' }
  ];

  const investmentBreakdownData = [
    { name: 'Technology', value: 45, color: 'hsl(var(--chart-1))' },
    { name: 'Resources', value: 30, color: 'hsl(var(--chart-2))' },
    { name: 'Training', value: 15, color: 'hsl(var(--chart-3))' },
    { name: 'Consulting', value: 10, color: 'hsl(var(--chart-4))' }
  ];

  const roiProjectionData = [
    { quarter: 'Q1', roi: -10, investment: 100, revenue: 90 },
    { quarter: 'Q2', roi: 5, investment: 150, revenue: 157 },
    { quarter: 'Q3', roi: 25, investment: 180, revenue: 225 },
    { quarter: 'Q4', roi: 45, investment: 200, revenue: 290 },
    { quarter: 'Q5', roi: 65, investment: 210, revenue: 346 },
    { quarter: 'Q6', roi: 85, investment: 220, revenue: 407 }
  ];

  const chartConfig = {
    current: { label: "Current Score", color: "hsl(var(--chart-1))" },
    target: { label: "Target Score", color: "hsl(var(--chart-2))" },
    benchmark: { label: "Industry Benchmark", color: "hsl(var(--chart-3))" },
    progress: { label: "Progress %", color: "hsl(var(--chart-4))" },
    roi: { label: "ROI %", color: "hsl(var(--chart-5))" }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Maturity Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into your personalization maturity journey
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="capabilities">Capabilities</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="investment">Investment</TabsTrigger>
          <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Maturity</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  📊
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{maturity_plan.overall_maturity_score}/5</div>
                <p className="text-xs text-muted-foreground">
                  +0.8 from last assessment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Target Phase</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  🎯
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{maturity_plan.target_phase}</div>
                <p className="text-xs text-muted-foreground">
                  Expected in {maturity_plan.phases.find(p => p.phase === maturity_plan.target_phase)?.duration_months || 12} months
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Initiatives</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  🚀
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{maturity_plan.strategic_priorities.length}</div>
                <p className="text-xs text-muted-foreground">
                  Strategic priorities identified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Risk Factors</CardTitle>
                <div className="h-4 w-4 text-muted-foreground">
                  ⚠️
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{maturity_plan.risks_and_assumptions.length}</div>
                <p className="text-xs text-muted-foreground">
                  Identified risks to monitor
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Maturity Progression Analysis</CardTitle>
                <CardDescription>
                  Current vs target scores across maturity phases
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ChartContainer config={chartConfig}>
                  <BarChart data={maturityScoreData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="phase" />
                    <YAxis domain={[0, 5]} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="currentScore" fill="hsl(var(--chart-1))" name="Current Score" />
                    <Bar dataKey="targetScore" fill="hsl(var(--chart-2))" name="Target Score" />
                    <Bar dataKey="benchmark" fill="hsl(var(--chart-3))" name="Industry Benchmark" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Progress Timeline</CardTitle>
                <CardDescription>
                  Implementation progress over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <AreaChart data={progressTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="progress"
                      stroke="hsl(var(--chart-4))"
                      fill="hsl(var(--chart-4))"
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Capability Assessment</CardTitle>
                <CardDescription>
                  Current capabilities vs industry best practices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <RadarChart data={capabilityRadarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="capability" />
                    <PolarRadiusAxis domain={[0, 5]} />
                    <Radar
                      name="Your Organization"
                      dataKey="A"
                      stroke="hsl(var(--chart-1))"
                      fill="hsl(var(--chart-1))"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Best Practice"
                      dataKey="B"
                      stroke="hsl(var(--chart-2))"
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.1}
                    />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                  </RadarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Investment Breakdown</CardTitle>
                <CardDescription>
                  Recommended investment allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig}>
                  <PieChart>
                    <Pie
                      data={investmentBreakdownData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${((percent as number) * 100).toFixed(0)}%`}
                    >
                      {investmentBreakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Roadmap</CardTitle>
              <CardDescription>
                Detailed timeline with milestones and dependencies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {maturity_plan.roadmap.phase_1_immediate.concat(
                  maturity_plan.roadmap.phase_2_short_term,
                  maturity_plan.roadmap.phase_3_medium_term,
                  maturity_plan.roadmap.phase_4_long_term
                ).slice(0, 6).map((item, index) => (
                  <div key={index} className="flex items-start space-x-4 pb-4 border-b border-gray-200">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
                      {index + 1}
                    </div>
                    <div className="space-y-1 flex-1">
                      <h4 className="text-sm font-medium leading-none">{item.milestone}</h4>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                        <span>📅 {item.timeline}</span>
                        <span>•</span>
                        <span>✅ {item.success_criteria.length} success criteria</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ROI Projection</CardTitle>
              <CardDescription>
                Expected return on investment over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <LineChart data={roiProjectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="quarter" />
                  <YAxis />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="roi"
                    stroke="hsl(var(--chart-5))"
                    strokeWidth={2}
                    name="ROI %"
                  />
                  <Line
                    type="monotone"
                    dataKey="investment"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Investment ($K)"
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    name="Revenue ($K)"
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Budget Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {maturity_plan.budget_estimates.slice(0, 3).map((budget, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{budget.item}</span>
                      <span className="text-sm text-muted-foreground">{budget.cost_range}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resource Planning</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {maturity_plan.resource_requirements.slice(0, 3).map((resource, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm font-medium">{resource.role}</span>
                      <span className="text-sm text-muted-foreground">{resource.fte_requirement} FTE</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Conversion Rate</span>
                    <span className="text-sm text-muted-foreground">+25%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Revenue per Visitor</span>
                    <span className="text-sm text-muted-foreground">+40%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Time to Value</span>
                    <span className="text-sm text-muted-foreground">-60%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {maturity_plan.intelligent_recommendations && (
            <>
              {/* Quick Wins Section */}
              <Card>
                <CardHeader>
                  <CardTitle>🚀 Quick Win Opportunities</CardTitle>
                  <CardDescription>
                    High-impact personalization tactics you can implement immediately
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {maturity_plan.intelligent_recommendations.quick_wins.slice(0, 4).map((win, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-blue-50">
                        <h4 className="font-semibold text-green-800 mb-2">{win.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{win.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                            {win.complexity} complexity
                          </span>
                          <span className="text-gray-500">{win.implementationTime}</span>
                        </div>
                        <div className="mt-2 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                          💡 {win.example}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Omnichannel Strategies */}
              <Card>
                <CardHeader>
                  <CardTitle>📱 Omnichannel Personalization Strategies</CardTitle>
                  <CardDescription>
                    Channel-specific tactics powered by your marketing technology stack
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    {maturity_plan.intelligent_recommendations.omnichannel_strategies.map((strategy, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-2xl">
                            {strategy.channel === 'email' && '📧'}
                            {strategy.channel === 'web' && '🌐'}
                            {strategy.channel === 'sms' && '📱'}
                            {strategy.channel === 'paid-ads' && '🎯'}
                            {strategy.channel === 'social' && '📲'}
                            {strategy.channel === 'mobile' && '📲'}
                          </span>
                          <div>
                            <h4 className="font-semibold capitalize">{strategy.channel} Personalization</h4>
                            <p className="text-sm text-gray-600">{strategy.strategy}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700">Key Tactics:</h5>
                          <ul className="text-sm space-y-1">
                            {strategy.tactics.slice(0, 3).map((tactic, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>{tactic}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
                          <div className="font-medium text-blue-800">Expected Impact:</div>
                          <div className="text-blue-700">{strategy.expectedLift}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Technology Synergies */}
              <Card>
                <CardHeader>
                  <CardTitle>🔗 Technology Integration Opportunities</CardTitle>
                  <CardDescription>
                    Maximize ROI by leveraging synergies between your existing tools
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {maturity_plan.intelligent_recommendations.technology_synergies.map((synergy, index) => (
                      <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-l-4 border-purple-400">
                        <p className="text-gray-700">{synergy}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Advanced Use Cases */}
              <Card>
                <CardHeader>
                  <CardTitle>🎯 Advanced Personalization Use Cases</CardTitle>
                  <CardDescription>
                    Sophisticated strategies tailored to your technology ecosystem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {maturity_plan.intelligent_recommendations.personalization_use_cases.slice(0, 6).map((useCase, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="font-semibold text-gray-800">{useCase.title}</h4>
                          <div className="flex gap-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              useCase.complexity === 'low' ? 'bg-green-100 text-green-800' :
                              useCase.complexity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {useCase.complexity}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded ${
                              useCase.businessImpact === 'high' ? 'bg-blue-100 text-blue-800' :
                              useCase.businessImpact === 'medium' ? 'bg-gray-100 text-gray-800' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {useCase.businessImpact} impact
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{useCase.description}</p>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-700 mb-1">Technologies:</div>
                            <div className="flex flex-wrap gap-1">
                              {useCase.technologies.map((tech, i) => (
                                <span key={i} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700 mb-1">Key Metrics:</div>
                            <div className="text-gray-600">
                              {useCase.kpis.slice(0, 2).join(', ')}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
                          <div className="font-medium text-gray-700">Example:</div>
                          <div className="text-gray-600">{useCase.example}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}