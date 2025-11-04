'use client';

import { useState } from 'react';
import { PMGWorkflowOutput, MaturityPhase } from '@/lib/types/maturity';
import DetailedMaturityMatrix from './DetailedMaturityMatrix';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ExternalLink, Target, Award, Clock, Users, Shield, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

interface MaturityPlanDisplayProps {
  workflowResult: PMGWorkflowOutput;
}

export default function ModernMaturityPlanDisplay({ workflowResult }: MaturityPlanDisplayProps) {
  const { maturity_plan, executive_summary, next_steps, cmp_campaign_id } = workflowResult;

  const phaseColors = {
    crawl: { bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
    walk: { bg: 'bg-yellow-50', text: 'text-yellow-800', border: 'border-yellow-200' },
    run: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-200' },
    fly: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-200' }
  };

  const phaseIcons = {
    crawl: '🐛',
    walk: '🚶',
    run: '🏃',
    fly: '🦅'
  };

  return (
    <div className="space-y-6">
      {/* Executive Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Executive Summary
              </CardTitle>
              <CardDescription>Plan ID: {maturity_plan.plan_id}</CardDescription>
            </div>
            {cmp_campaign_id && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`https://app.optimizely.com/cmp/campaigns/${cmp_campaign_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View in CMP
                </a>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className="text-3xl font-bold text-primary">
                    {maturity_plan.overall_maturity_score}/5
                  </div>
                  <div className="text-sm text-muted-foreground">Overall Score</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${phaseColors[maturity_plan.current_phase].bg} ${phaseColors[maturity_plan.current_phase].text}`}>
                    <span className="mr-2">{phaseIcons[maturity_plan.current_phase]}</span>
                    {maturity_plan.current_phase.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Phase</div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="text-center space-y-2">
                  <div className={`inline-flex items-center px-4 py-2 rounded-full font-medium ${phaseColors[maturity_plan.target_phase].bg} ${phaseColors[maturity_plan.target_phase].text}`}>
                    <span className="mr-2">{phaseIcons[maturity_plan.target_phase]}</span>
                    {maturity_plan.target_phase.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">Target Phase</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="prose max-w-none">
            <p className="text-muted-foreground leading-relaxed">{executive_summary}</p>
          </div>

          <Card className="bg-muted/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Immediate Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {next_steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="text-sm">{step}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="matrix" className="gap-2">
            <Target className="h-4 w-4" />
            Matrix
          </TabsTrigger>
          <TabsTrigger value="phases" className="gap-2">
            <Clock className="h-4 w-4" />
            Phases
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-2">
            <Users className="h-4 w-4" />
            Roadmap
          </TabsTrigger>
          <TabsTrigger value="resources" className="gap-2">
            <Shield className="h-4 w-4" />
            Resources
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Maturity Assessment Overview</CardTitle>
              <CardDescription>Detailed analysis of your current personalization capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Assessment Rationale</h4>
                <p className="text-muted-foreground leading-relaxed">{maturity_plan.maturity_rationale}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Strategic Priorities</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {maturity_plan.strategic_priorities.map((priority, index) => (
                    <Card key={index} className="bg-muted/30">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 text-primary" />
                          <span className="font-medium">{priority}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-destructive/5 border-destructive/20">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Key Risks & Assumptions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {maturity_plan.risks_and_assumptions.map((risk, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                          <span className="text-sm">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                      <Shield className="h-5 w-5" />
                      Privacy Considerations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {maturity_plan.privacy_considerations.map((consideration, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Shield className="h-4 w-4 text-green-600 mt-0.5" />
                          <span className="text-sm">{consideration}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Matrix Tab */}
        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Maturity Matrix</CardTitle>
              <CardDescription>
                Detailed breakdown of capabilities, audiences, and use cases across all maturity phases
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DetailedMaturityMatrix />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Phases Tab */}
        <TabsContent value="phases">
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">4-Phase Maturity Journey</h3>
              <p className="text-muted-foreground">Progressive approach to personalization excellence</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {(['crawl', 'walk', 'run', 'fly'] as MaturityPhase[]).map((phase) => {
                const phaseData = maturity_plan.phases.find(p => p.phase === phase);
                const colors = phaseColors[phase];
                const isCurrentPhase = maturity_plan.current_phase === phase;
                const isTargetPhase = maturity_plan.target_phase === phase;

                return (
                  <Card
                    key={phase}
                    className={`${colors.bg} ${colors.border} border-2 ${
                      isCurrentPhase ? 'ring-4 ring-primary/20' : ''
                    }`}
                  >
                    <CardContent className="pt-6">
                      <div className="text-center space-y-4">
                        <div className="text-4xl">{phaseIcons[phase]}</div>
                        <div>
                          <h4 className={`font-bold text-lg ${colors.text}`}>
                            {phase.toUpperCase()}
                          </h4>
                          {phaseData && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {phaseData.duration_months} months
                            </p>
                          )}
                          {isCurrentPhase && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-primary text-primary-foreground rounded-full">
                              Current
                            </span>
                          )}
                          {isTargetPhase && (
                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                              Target
                            </span>
                          )}
                        </div>

                        {phaseData && (
                          <div className="space-y-3 text-left">
                            <p className="text-sm">{phaseData.description}</p>

                            <div>
                              <h5 className="font-medium text-sm mb-1">Key Focus:</h5>
                              <ul className="text-xs space-y-1">
                                {phaseData.kpi_focus.slice(0, 3).map((focus, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <div className="w-1 h-1 bg-current rounded-full" />
                                    {focus}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h5 className="font-medium text-sm mb-1">Capabilities:</h5>
                              <ul className="text-xs space-y-1">
                                {phaseData.organizational_capabilities.slice(0, 2).map((capability, index) => (
                                  <li key={index} className="flex items-center gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    {capability}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap">
          <Card>
            <CardHeader>
              <CardTitle>Implementation Roadmap</CardTitle>
              <CardDescription>Strategic timeline for maturity advancement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {[
                  { phase: 'Phase 1: Immediate (0-3 months)', items: maturity_plan.roadmap.phase_1_immediate, color: 'red' },
                  { phase: 'Phase 2: Short Term (3-6 months)', items: maturity_plan.roadmap.phase_2_short_term, color: 'yellow' },
                  { phase: 'Phase 3: Medium Term (6-12 months)', items: maturity_plan.roadmap.phase_3_medium_term, color: 'green' },
                  { phase: 'Phase 4: Long Term (12+ months)', items: maturity_plan.roadmap.phase_4_long_term, color: 'blue' }
                ].map((roadmapPhase, phaseIndex) => (
                  <div key={phaseIndex} className="space-y-4">
                    <h4 className="text-lg font-semibold">{roadmapPhase.phase}</h4>
                    <div className="space-y-4">
                      {roadmapPhase.items.map((item, itemIndex) => (
                        <Card key={itemIndex} className="border-l-4 border-l-primary">
                          <CardContent className="pt-4">
                            <div className="space-y-3">
                              <div className="flex justify-between items-start">
                                <h5 className="font-medium">{item.milestone}</h5>
                                <span className="px-2 py-1 text-xs bg-muted rounded-full">
                                  {item.timeline}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="font-medium">Dependencies:</span>
                                  <ul className="mt-1 space-y-1">
                                    {item.dependencies.map((dep, depIndex) => (
                                      <li key={depIndex} className="text-muted-foreground">• {dep}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <span className="font-medium">Success Criteria:</span>
                                  <ul className="mt-1 space-y-1">
                                    {item.success_criteria.map((criteria, critIndex) => (
                                      <li key={critIndex} className="text-muted-foreground flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        {criteria}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Budget Estimates */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Estimates</CardTitle>
                  <CardDescription>Financial planning for implementation</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {maturity_plan.budget_estimates.length > 0 ? (
                      maturity_plan.budget_estimates.map((budget, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                          <div>
                            <div className="font-medium">{budget.item}</div>
                            <div className="text-sm text-muted-foreground">
                              {budget.category} - {budget.phase.toUpperCase()}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{budget.cost_range}</div>
                            <div className="text-xs text-muted-foreground">
                              Confidence: {budget.confidence_level}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Budget estimates will be refined based on specific requirements and vendor selections.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Resource Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Resource Requirements</CardTitle>
                  <CardDescription>Team and skills planning</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {maturity_plan.resource_requirements.length > 0 ? (
                      maturity_plan.resource_requirements.map((resource, index) => (
                        <Card key={index} className="bg-muted/30">
                          <CardContent className="pt-4">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start">
                                <div className="font-medium">{resource.role}</div>
                                <div className="text-sm font-semibold text-primary">
                                  {resource.fte_requirement} FTE
                                </div>
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Phase: {resource.phase.toUpperCase()}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Skills: {resource.skills_needed.join(', ')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        Resource requirements will be detailed based on chosen implementation approach and timeline.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}