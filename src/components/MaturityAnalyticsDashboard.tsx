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
      </Tabs>
    </div>
  );
}