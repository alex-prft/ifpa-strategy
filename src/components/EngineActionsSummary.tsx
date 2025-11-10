'use client';

import { useState } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Settings,
  Database,
  Zap,
  Brain,
  Cpu,
  Cog,
  Bot,
  Code,
  FileText,
  Target,
  Save,
  RotateCcw,
  Lightbulb,
  Workflow,
  GitBranch,
  Filter
} from 'lucide-react';
import { getEnhancedEngineSummary, convertToMappingKey } from '@/../opal-config/opal-mapping/mapping-utils';

interface EngineActionsSummaryProps {
  areaId?: string;
  subSectionId?: string;
}

export default function EngineActionsSummary({ areaId = 'analytics-insights', subSectionId = 'osa' }: EngineActionsSummaryProps) {
  const [customRules, setCustomRules] = useState('');

  // Get the mapping configuration for this specific page
  const mappingKeys = convertToMappingKey(areaId, subSectionId);
  const enhancedSummary = getEnhancedEngineSummary(mappingKeys.area, mappingKeys.subSection);

  const handleSaveRules = () => {
    // Save custom rules logic would go here
    console.log('Saving custom rules:', customRules);
  };

  const handleResetRules = () => {
    setCustomRules('');
  };

  return (
    <div id="engine-actions-summary" className="w-full mt-8">
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="engine-actions" className="border rounded-lg">
          <AccordionTrigger className="px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50 hover:bg-gradient-to-r hover:from-slate-100 hover:to-blue-100 rounded-t-lg">
            <div className="flex items-center gap-3">
              <Settings className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-semibold">Engine Actions & Summary</span>
              <Badge variant="secondary" className="ml-2">
                OSA Intelligence
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-6">

              {/* How OSA Generates These Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    How OSA Generates These Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* OPAL Agents */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Bot className="h-4 w-4 text-blue-600" />
                        OPAL Agents
                      </h4>
                      <div className="space-y-2">
                        {enhancedSummary.opalAgents.map((agent, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Cpu className="h-3 w-3 text-blue-500" />
                            <span>{agent}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* OPAL Instructions */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Code className="h-4 w-4 text-green-600" />
                        OPAL Instructions
                      </h4>
                      <div className="space-y-2">
                        {enhancedSummary.opalInstructions.map((instruction, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <FileText className="h-3 w-3 text-green-500" />
                            <span>{instruction}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* OPAL Tools */}
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Cog className="h-4 w-4 text-orange-600" />
                        OPAL Tools
                      </h4>
                      <div className="space-y-2">
                        {enhancedSummary.opalTools.map((tool, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Zap className="h-3 w-3 text-orange-500" />
                            <span>{tool}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* RAG Decision Layer Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-indigo-600" />
                    RAG Decision Layer Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      How the AI brain uses this data to tailor your results with the Personal Configurator:
                    </p>

                    <div className="space-y-3">
                      {enhancedSummary.ragActions.map((action, index) => (
                        <div key={index} className="p-4 border rounded-lg">
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-indigo-100">
                              <Workflow className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-700">{action}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custom Personal Configurator */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-yellow-600" />
                    Custom Personal Configurator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Add custom rules to improve the data, results, and recommendations on this page:
                    </p>

                    <Textarea
                      placeholder="Example:
• Prioritize insights for B2B food industry segments
• Focus on mobile user experience improvements
• Emphasize seasonal content performance patterns
• Weight customer lifetime value over single conversions
• Highlight content gaps in competitor analysis"
                      value={customRules}
                      onChange={(e) => setCustomRules(e.target.value)}
                      className="min-h-[120px]"
                    />

                    <div className="flex items-center gap-2">
                      <Button onClick={handleSaveRules} size="sm">
                        <Save className="h-4 w-4 mr-1" />
                        Save Rules
                      </Button>
                      <Button onClick={handleResetRules} size="sm" variant="outline">
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Reset
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2">
                      These rules will be applied to future analysis and recommendations for this page category.
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}