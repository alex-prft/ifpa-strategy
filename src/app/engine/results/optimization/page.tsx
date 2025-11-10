'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import { ArrowLeft, Zap, Users, Eye, TestTube, Brain, Settings, Server, Cpu, Database, Shield, MonitorSpeaker } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ResultsSidebar from '@/components/ResultsSidebar';
import EngineActionsSummary from '@/components/EngineActionsSummary';

export default function ExperienceOptimizationPage() {
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
            <h3 className="text-lg font-semibold mb-2">Loading optimization data...</h3>
            <p className="text-muted-foreground text-center">Retrieving your experience optimization insights</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="optimization-page-container" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div id="optimization-page-layout" className="flex">
        {/* Sidebar Navigation */}
        <ResultsSidebar currentPage="optimization" />

        {/* Main Content */}
        <main id="optimization-main-content" className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
        <div id="optimization-content-wrapper" className="space-y-6">
          {/* Section Header */}
          <div id="optimization-header" className="flex items-center gap-3 mb-6">
            <Zap className="h-8 w-8 text-yellow-600" />
            <div>
              <h2 className="text-2xl font-bold">Experience Optimization</h2>
              <p className="text-muted-foreground">Advanced user experience optimization and personalization strategies</p>
            </div>
          </div>

          {/* Experience Optimization Tabs */}
          <Tabs id="optimization-tabs-container" defaultValue="content" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="experimentation">Experimentation</TabsTrigger>
              <TabsTrigger value="personalization">Personalization</TabsTrigger>
              <TabsTrigger value="ux">UX</TabsTrigger>
              <TabsTrigger value="technology">Technology</TabsTrigger>
            </TabsList>

            <TabsContent id="optimization-content-content" value="content">
              <div className="space-y-6">
                {/* Content Optimization Overview */}
                <Card id="optimization-content-performance-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Eye className="h-6 w-6 text-blue-600" />
                      <CardTitle>Content Optimization Performance</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent id="optimization-content-performance-content">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Content Engagement</h4>
                        <p className="text-2xl font-bold text-blue-600">84.2%</p>
                        <p className="text-xs text-blue-600 mt-1">↑ 12% improvement</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Time on Page</h4>
                        <p className="text-2xl font-bold text-green-600">4m 18s</p>
                        <p className="text-xs text-green-600 mt-1">↑ 25% increase</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Content Relevance</h4>
                        <p className="text-2xl font-bold text-purple-600">91%</p>
                        <p className="text-xs text-purple-600 mt-1">AI-driven matching</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Conversion Impact</h4>
                        <p className="text-2xl font-bold text-orange-600">+28%</p>
                        <p className="text-xs text-orange-600 mt-1">vs. non-optimized</p>
                      </Card>
                    </div>

                    {/* Content Optimization Strategies */}
                    <div>
                      <h4 className="font-semibold mb-3">Active Content Optimization Strategies:</h4>
                      <div className="space-y-3">
                        {[
                          {
                            strategy: 'Dynamic Fresh Produce Content',
                            description: 'Seasonal content adaptation based on availability and trends',
                            performance: 'Excellent',
                            impact: '+32% engagement'
                          },
                          {
                            strategy: 'Personalized Recipe Recommendations',
                            description: 'AI-powered recipe matching based on purchase history',
                            performance: 'Good',
                            impact: '+18% time on page'
                          },
                          {
                            strategy: 'Mobile-Optimized Content Blocks',
                            description: 'Responsive content design for mobile-first experience',
                            performance: 'Excellent',
                            impact: '+45% mobile engagement'
                          },
                          {
                            strategy: 'Interactive Nutrition Guides',
                            description: 'Dynamic nutrition information with comparison tools',
                            performance: 'Good',
                            impact: '+22% user interaction'
                          }
                        ].map((item, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{item.strategy}</h5>
                                <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={item.performance === 'Excellent' ? 'default' : 'secondary'}>
                                  {item.performance}
                                </Badge>
                                <p className="text-sm text-green-600 mt-1">{item.impact}</p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Performance by Category */}
                <Card id="optimization-content-category-card">
                  <CardHeader>
                    <CardTitle>Content Category Performance</CardTitle>
                  </CardHeader>
                  <CardContent id="optimization-content-category-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {[
                        { category: 'Product Information', score: 92, engagement: '5m 12s', conversions: '8.4%' },
                        { category: 'Educational Content', score: 88, engagement: '4m 38s', conversions: '6.2%' },
                        { category: 'Recipe Collections', score: 85, engagement: '6m 45s', conversions: '12.1%' },
                        { category: 'Seasonal Guides', score: 91, engagement: '3m 54s', conversions: '7.8%' },
                        { category: 'Nutrition Facts', score: 89, engagement: '4m 22s', conversions: '9.3%' },
                        { category: 'Sustainability Info', score: 82, engagement: '3m 15s', conversions: '4.5%' }
                      ].map((cat, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium">{cat.category}</h5>
                            <span className="text-lg font-bold">{cat.score}%</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Avg. Engagement:</span>
                              <span className="font-medium">{cat.engagement}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Conversion Rate:</span>
                              <span className="font-medium text-green-600">{cat.conversions}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  cat.score >= 90 ? 'bg-green-500' :
                                  cat.score >= 85 ? 'bg-blue-500' :
                                  cat.score >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${cat.score}%` }}
                              ></div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent id="optimization-experimentation-content" value="experimentation">
              <div className="space-y-6">
                {/* Experimentation Overview */}
                <Card id="optimization-experimentation-performance-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <TestTube className="h-6 w-6 text-purple-600" />
                      <CardTitle>Experimentation Program Performance</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent id="optimization-experimentation-performance-content">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Active Tests</h4>
                        <p className="text-2xl font-bold text-purple-600">14</p>
                        <p className="text-xs text-purple-600 mt-1">Running experiments</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Win Rate</h4>
                        <p className="text-2xl font-bold text-green-600">76%</p>
                        <p className="text-xs text-green-600 mt-1">Above industry benchmark</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Average Lift</h4>
                        <p className="text-2xl font-bold text-blue-600">+22%</p>
                        <p className="text-xs text-blue-600 mt-1">Per winning experiment</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Revenue Impact</h4>
                        <p className="text-2xl font-bold text-orange-600">$347K</p>
                        <p className="text-xs text-orange-600 mt-1">Last quarter</p>
                      </Card>
                    </div>

                    {/* Recent Test Results */}
                    <div>
                      <h4 className="font-semibold mb-3">Recent A/B Test Results:</h4>
                      <div className="space-y-3">
                        {[
                          {
                            test: 'Checkout Process Simplification',
                            status: 'Won',
                            lift: '+31%',
                            confidence: 98,
                            metric: 'Completion Rate',
                            duration: '3 weeks'
                          },
                          {
                            test: 'Product Gallery Enhancement',
                            status: 'Won',
                            lift: '+18%',
                            confidence: 92,
                            metric: 'Add to Cart Rate',
                            duration: '4 weeks'
                          },
                          {
                            test: 'Mobile Search Optimization',
                            status: 'Running',
                            lift: '+12%',
                            confidence: 73,
                            metric: 'Search Success Rate',
                            duration: '2 weeks'
                          },
                          {
                            test: 'Personalized Homepage Banner',
                            status: 'Won',
                            lift: '+45%',
                            confidence: 99,
                            metric: 'Click-through Rate',
                            duration: '2 weeks'
                          },
                          {
                            test: 'Social Proof Elements',
                            status: 'Lost',
                            lift: '-3%',
                            confidence: 85,
                            metric: 'Conversion Rate',
                            duration: '3 weeks'
                          }
                        ].map((test, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{test.test}</h5>
                                <p className="text-sm text-muted-foreground">
                                  Primary metric: {test.metric} • Duration: {test.duration}
                                </p>
                              </div>
                              <div className="text-right flex items-center gap-4">
                                <div>
                                  <p className={`font-semibold ${
                                    test.status === 'Won' ? 'text-green-600' :
                                    test.status === 'Lost' ? 'text-red-600' : 'text-blue-600'
                                  }`}>{test.lift}</p>
                                  <p className="text-xs text-muted-foreground">{test.confidence}% confidence</p>
                                </div>
                                <Badge variant={
                                  test.status === 'Won' ? 'default' :
                                  test.status === 'Lost' ? 'destructive' : 'secondary'
                                }>
                                  {test.status}
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Experiments */}
                <Card id="optimization-experiment-pipeline-card">
                  <CardHeader>
                    <CardTitle>Experiment Pipeline</CardTitle>
                  </CardHeader>
                  <CardContent id="optimization-experiment-pipeline-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { name: 'Category Page Redesign', priority: 'High', impact: 'High', effort: 'Medium', timeline: '2 weeks' },
                        { name: 'Email Capture Optimization', priority: 'High', impact: 'Medium', effort: 'Low', timeline: '1 week' },
                        { name: 'Cross-sell Algorithm Test', priority: 'Medium', impact: 'High', effort: 'High', timeline: '4 weeks' },
                        { name: 'Mobile Navigation Redesign', priority: 'Medium', impact: 'Medium', effort: 'Medium', timeline: '3 weeks' }
                      ].map((exp, index) => (
                        <Card key={index} className="p-4 border-l-4 border-l-blue-500">
                          <h5 className="font-medium mb-2">{exp.name}</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>Priority:</span>
                              <Badge variant={exp.priority === 'High' ? 'destructive' : 'secondary'}>
                                {exp.priority}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span>Expected Impact:</span>
                              <span className="font-medium">{exp.impact}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Effort Required:</span>
                              <span className="font-medium">{exp.effort}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Timeline:</span>
                              <span className="font-medium">{exp.timeline}</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent id="optimization-personalization-content" value="personalization">
              <Card id="optimization-personalization-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Brain className="h-6 w-6 text-indigo-600" />
                    <CardTitle>AI-Powered Personalization</CardTitle>
                  </div>
                </CardHeader>
                <CardContent id="optimization-personalization-card-content">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 bg-indigo-50">
                      <h4 className="font-semibold text-indigo-800">Personalization Rate</h4>
                      <p className="text-2xl font-bold text-indigo-600">87%</p>
                      <p className="text-xs text-indigo-600 mt-1">Of all experiences</p>
                    </Card>
                    <Card className="p-4 bg-green-50">
                      <h4 className="font-semibold text-green-800">Relevance Score</h4>
                      <p className="text-2xl font-bold text-green-600">93%</p>
                      <p className="text-xs text-green-600 mt-1">AI accuracy</p>
                    </Card>
                    <Card className="p-4 bg-blue-50">
                      <h4 className="font-semibold text-blue-800">Engagement Lift</h4>
                      <p className="text-2xl font-bold text-blue-600">+34%</p>
                      <p className="text-xs text-blue-600 mt-1">vs. non-personalized</p>
                    </Card>
                    <Card className="p-4 bg-purple-50">
                      <h4 className="font-semibold text-purple-800">Revenue Per User</h4>
                      <p className="text-2xl font-bold text-purple-600">+42%</p>
                      <p className="text-xs text-purple-600 mt-1">Personalized sessions</p>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    {/* Personalization Strategies */}
                    <div>
                      <h4 className="font-semibold mb-3">Active Personalization Strategies:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { name: 'Product Recommendations', performance: 94, type: 'AI-Driven' },
                          { name: 'Content Personalization', performance: 89, type: 'Behavioral' },
                          { name: 'Email Campaigns', performance: 91, type: 'Segmentation' },
                          { name: 'Homepage Experience', performance: 86, type: 'Dynamic' },
                          { name: 'Search Results', performance: 88, type: 'Intent-Based' },
                          { name: 'Pricing Display', performance: 83, type: 'Rule-Based' }
                        ].map((strategy, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium">{strategy.name}</h5>
                              <span className="text-lg font-bold">{strategy.performance}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{strategy.type}</Badge>
                              <div className="w-24 bg-gray-200 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full ${
                                    strategy.performance >= 90 ? 'bg-green-500' :
                                    strategy.performance >= 85 ? 'bg-blue-500' : 'bg-yellow-500'
                                  }`}
                                  style={{ width: `${strategy.performance}%` }}
                                ></div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Audience Segments */}
                    <div>
                      <h4 className="font-semibold mb-3">Top Performing Audience Segments:</h4>
                      <div className="space-y-3">
                        {[
                          { segment: 'Organic Premium Buyers', size: 12450, engagement: '+52%', revenue: '+68%' },
                          { segment: 'Bulk Commercial Customers', size: 3780, engagement: '+38%', revenue: '+45%' },
                          { segment: 'Health-Conscious Millennials', size: 8920, engagement: '+41%', revenue: '+32%' },
                          { segment: 'Local Farmers Market Supporters', size: 5630, engagement: '+29%', revenue: '+28%' }
                        ].map((seg, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{seg.segment}</h5>
                                <p className="text-sm text-muted-foreground">{seg.size.toLocaleString()} users</p>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-center">
                                  <p className="font-semibold text-blue-600">{seg.engagement}</p>
                                  <p className="text-muted-foreground">Engagement</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-semibold text-green-600">{seg.revenue}</p>
                                  <p className="text-muted-foreground">Revenue</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent id="optimization-ux-content" value="ux">
              <Card id="optimization-ux-performance-card">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-orange-600" />
                    <CardTitle>UX Optimization Performance</CardTitle>
                  </div>
                </CardHeader>
                <CardContent id="optimization-ux-performance-content">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 bg-orange-50">
                      <h4 className="font-semibold text-orange-800">Page Load Speed</h4>
                      <p className="text-2xl font-bold text-orange-600">1.8s</p>
                      <p className="text-xs text-orange-600 mt-1">↓ 0.4s improvement</p>
                    </Card>
                    <Card className="p-4 bg-green-50">
                      <h4 className="font-semibold text-green-800">Mobile Usability</h4>
                      <p className="text-2xl font-bold text-green-600">94%</p>
                      <p className="text-xs text-green-600 mt-1">Excellent score</p>
                    </Card>
                    <Card className="p-4 bg-blue-50">
                      <h4 className="font-semibold text-blue-800">User Satisfaction</h4>
                      <p className="text-2xl font-bold text-blue-600">4.7/5</p>
                      <p className="text-xs text-blue-600 mt-1">User feedback</p>
                    </Card>
                    <Card className="p-4 bg-purple-50">
                      <h4 className="font-semibold text-purple-800">Task Success Rate</h4>
                      <p className="text-2xl font-bold text-purple-600">89%</p>
                      <p className="text-xs text-purple-600 mt-1">Goal completion</p>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    {/* UX Improvements */}
                    <div>
                      <h4 className="font-semibold mb-3">Recent UX Improvements:</h4>
                      <div className="space-y-3">
                        {[
                          { improvement: 'Simplified Navigation Menu', impact: 'Reduced clicks by 32%', status: 'Completed' },
                          { improvement: 'Enhanced Search Functionality', impact: 'Improved success rate by 28%', status: 'Completed' },
                          { improvement: 'Mobile Checkout Optimization', impact: 'Reduced abandonment by 18%', status: 'In Progress' },
                          { improvement: 'Accessibility Enhancements', impact: 'WCAG 2.1 AA compliance', status: 'Completed' }
                        ].map((item, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{item.improvement}</h5>
                                <p className="text-sm text-muted-foreground">{item.impact}</p>
                              </div>
                              <Badge variant={item.status === 'Completed' ? 'default' : 'secondary'}>
                                {item.status}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Pain Point Analysis */}
                    <div>
                      <h4 className="font-semibold mb-3">Identified Pain Points & Solutions:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { issue: 'Complex Product Filtering', priority: 'High', solution: 'Implement smart filters with AI suggestions' },
                          { issue: 'Slow Image Loading', priority: 'Medium', solution: 'Optimize images with lazy loading' },
                          { issue: 'Unclear Pricing Information', priority: 'High', solution: 'Add transparent pricing tooltips' },
                          { issue: 'Limited Mobile Touch Targets', priority: 'Medium', solution: 'Increase button sizes for mobile' }
                        ].map((pain, index) => (
                          <Card key={index} className="p-4 border-l-4 border-l-red-500">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <h5 className="font-medium">{pain.issue}</h5>
                                <Badge variant={pain.priority === 'High' ? 'destructive' : 'secondary'}>
                                  {pain.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">{pain.solution}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent id="optimization-technology-content" value="technology">
              <div className="space-y-6">
                {/* Technology Infrastructure Overview - Wide Row */}
                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Server className="h-6 w-6 text-gray-600" />
                      <CardTitle>Technology Infrastructure Overview</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-800">System Uptime</h4>
                        <p className="text-2xl font-bold text-gray-600">99.97%</p>
                        <p className="text-xs text-gray-600 mt-1">Last 30 days</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Response Time</h4>
                        <p className="text-2xl font-bold text-blue-600">142ms</p>
                        <p className="text-xs text-blue-600 mt-1">↓ 28ms improvement</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">CDN Performance</h4>
                        <p className="text-2xl font-bold text-green-600">94%</p>
                        <p className="text-xs text-green-600 mt-1">Cache hit rate</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Security Score</h4>
                        <p className="text-2xl font-bold text-purple-600">A+</p>
                        <p className="text-xs text-purple-600 mt-1">SSL Labs rating</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Core Technology Stack:</h4>
                        <div className="space-y-3">
                          {[
                            { component: 'Frontend Framework', tech: 'Next.js 14', performance: 96, status: 'Optimized' },
                            { component: 'Backend API', tech: 'Node.js + Express', performance: 94, status: 'Stable' },
                            { component: 'Database', tech: 'PostgreSQL', performance: 98, status: 'Optimized' },
                            { component: 'Caching Layer', tech: 'Redis', performance: 92, status: 'Good' },
                            { component: 'CDN', tech: 'CloudFlare', performance: 95, status: 'Excellent' }
                          ].map((item, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h5 className="font-medium text-sm">{item.component}</h5>
                                  <p className="text-xs text-muted-foreground">{item.tech}</p>
                                </div>
                                <div className="text-right">
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    item.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                                    item.status === 'Optimized' ? 'bg-blue-100 text-blue-800' :
                                    item.status === 'Good' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {item.status}
                                  </span>
                                  <div className="text-sm font-medium mt-1">{item.performance}%</div>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${item.performance}%` }}></div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Performance Monitoring:</h4>
                        <div className="space-y-4">
                          {[
                            { metric: 'Core Web Vitals', score: 95, description: 'LCP, FID, CLS performance' },
                            { metric: 'PageSpeed Score', score: 92, description: 'Google PageSpeed Insights' },
                            { metric: 'Lighthouse Performance', score: 94, description: 'Overall performance audit' },
                            { metric: 'GTmetrix Grade', score: 96, description: 'A-grade performance rating' }
                          ].map((metric, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <h6 className="font-medium text-sm">{metric.metric}</h6>
                                <span className="font-bold text-green-600">{metric.score}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{metric.description}</p>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${metric.score}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security & Compliance */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Shield className="h-6 w-6 text-red-600" />
                      <CardTitle>Security & Compliance</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-red-50 text-center">
                        <h4 className="font-semibold text-red-800 mb-2">Security Rating</h4>
                        <div className="text-2xl font-bold text-red-600">A+</div>
                        <p className="text-xs text-red-600 mt-1">SSL Labs Grade</p>
                      </Card>
                      <Card className="p-4 bg-green-50 text-center">
                        <h4 className="font-semibold text-green-800 mb-2">Vulnerability Scan</h4>
                        <div className="text-2xl font-bold text-green-600">0</div>
                        <p className="text-xs text-green-600 mt-1">Critical issues</p>
                      </Card>
                      <Card className="p-4 bg-blue-50 text-center">
                        <h4 className="font-semibold text-blue-800 mb-2">Compliance Status</h4>
                        <div className="text-2xl font-bold text-blue-600">94%</div>
                        <p className="text-xs text-blue-600 mt-1">Requirements met</p>
                      </Card>
                      <Card className="p-4 bg-purple-50 text-center">
                        <h4 className="font-semibold text-purple-800 mb-2">Data Protection</h4>
                        <div className="text-2xl font-bold text-purple-600">256-bit</div>
                        <p className="text-xs text-purple-600 mt-1">Encryption</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Security Measures:</h4>
                        <div className="space-y-2">
                          {[
                            { measure: 'SSL/TLS Encryption', status: 'Active', grade: 'A+' },
                            { measure: 'Web Application Firewall', status: 'Active', grade: 'A' },
                            { measure: 'DDoS Protection', status: 'Active', grade: 'A+' },
                            { measure: 'Access Controls', status: 'Active', grade: 'A' },
                            { measure: 'Data Backup & Recovery', status: 'Active', grade: 'A+' },
                            { measure: 'Security Headers', status: 'Active', grade: 'A' }
                          ].map((security, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <span className="font-medium text-sm">{security.measure}</span>
                                <span className="text-xs text-green-600 ml-2">● {security.status}</span>
                              </div>
                              <span className="font-bold text-blue-600">{security.grade}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Compliance Standards:</h4>
                        <div className="space-y-3">
                          {[
                            { standard: 'GDPR', status: 'Compliant', details: 'Data privacy & protection' },
                            { standard: 'CCPA', status: 'Compliant', details: 'California privacy regulations' },
                            { standard: 'PCI DSS', status: 'Compliant', details: 'Payment card security' },
                            { standard: 'SOC 2 Type II', status: 'In Progress', details: 'Security & availability controls' },
                            { standard: 'WCAG 2.1 AA', status: 'Compliant', details: 'Web accessibility standards' }
                          ].map((compliance, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-1">
                                <h5 className="font-medium text-sm">{compliance.standard}</h5>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  compliance.status === 'Compliant' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {compliance.status}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">{compliance.details}</p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* API & Integration Performance */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Database className="h-6 w-6 text-blue-600" />
                      <CardTitle>API & Integration Performance</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">API Performance Metrics:</h4>
                        <div className="space-y-4">
                          {[
                            { endpoint: 'Product Catalog API', responseTime: 85, throughput: '2.4K req/min', uptime: 99.9 },
                            { endpoint: 'User Authentication API', responseTime: 45, throughput: '1.8K req/min', uptime: 99.95 },
                            { endpoint: 'Order Processing API', responseTime: 120, throughput: '890 req/min', uptime: 99.8 },
                            { endpoint: 'Analytics API', responseTime: 180, throughput: '450 req/min', uptime: 99.7 }
                          ].map((api, index) => (
                            <Card key={index} className="p-3">
                              <h5 className="font-medium mb-2">{api.endpoint}</h5>
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <div className="font-semibold text-blue-600">{api.responseTime}ms</div>
                                  <div className="text-muted-foreground">Response Time</div>
                                </div>
                                <div>
                                  <div className="font-semibold text-green-600">{api.throughput}</div>
                                  <div className="text-muted-foreground">Throughput</div>
                                </div>
                                <div>
                                  <div className="font-semibold text-purple-600">{api.uptime}%</div>
                                  <div className="text-muted-foreground">Uptime</div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Third-party Integrations:</h4>
                        <div className="space-y-3">
                          {[
                            { service: 'Optimizely Web Experimentation', health: 98, lastSync: '2 min ago', status: 'Active' },
                            { service: 'Optimizely Data Platform', health: 96, lastSync: '1 min ago', status: 'Active' },
                            { service: 'Payment Gateway (Stripe)', health: 99, lastSync: '30 sec ago', status: 'Active' },
                            { service: 'Email Service (SendGrid)', health: 94, lastSync: '5 min ago', status: 'Active' },
                            { service: 'Analytics Platform', health: 97, lastSync: '1 min ago', status: 'Active' }
                          ].map((integration, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h5 className="font-medium text-sm">{integration.service}</h5>
                                  <p className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    {integration.status}
                                  </span>
                                  <div className="text-sm font-medium mt-1">{integration.health}%</div>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${integration.health}%` }}></div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Technology Roadmap */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Cpu className="h-6 w-6 text-green-600" />
                      <CardTitle>Technology Enhancement Roadmap</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        {
                          phase: "Q4 2024",
                          title: "Performance & Optimization",
                          status: "in-progress",
                          initiatives: [
                            "Database query optimization and indexing improvements",
                            "Advanced caching layer implementation",
                            "CDN optimization for global performance"
                          ],
                          expectedImpact: "+25% performance improvement"
                        },
                        {
                          phase: "Q1 2025",
                          title: "Infrastructure Modernization",
                          status: "planned",
                          initiatives: [
                            "Container orchestration with Kubernetes",
                            "Microservices architecture migration",
                            "Auto-scaling implementation"
                          ],
                          expectedImpact: "+40% scalability & reliability"
                        },
                        {
                          phase: "Q2 2025",
                          title: "Advanced Security & Monitoring",
                          status: "future",
                          initiatives: [
                            "Enhanced threat detection systems",
                            "Real-time performance monitoring",
                            "Advanced logging and analytics"
                          ],
                          expectedImpact: "+50% security posture improvement"
                        },
                        {
                          phase: "Q3 2025",
                          title: "AI & Machine Learning Integration",
                          status: "future",
                          initiatives: [
                            "Edge computing deployment",
                            "AI-powered performance optimization",
                            "Predictive scaling algorithms"
                          ],
                          expectedImpact: "+60% operational efficiency"
                        }
                      ].map((roadmapItem, index) => (
                        <Card key={index} className={`p-4 border-l-4 ${
                          roadmapItem.status === 'in-progress' ? 'border-l-blue-600' :
                          roadmapItem.status === 'planned' ? 'border-l-green-600' : 'border-l-gray-400'
                        }`}>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h5 className="font-semibold">{roadmapItem.phase}: {roadmapItem.title}</h5>
                              <p className="text-sm text-green-600 mt-1">{roadmapItem.expectedImpact}</p>
                            </div>
                            <Badge variant={
                              roadmapItem.status === 'in-progress' ? 'default' :
                              roadmapItem.status === 'planned' ? 'secondary' : 'outline'
                            }>
                              {roadmapItem.status === 'in-progress' ? 'In Progress' :
                               roadmapItem.status === 'planned' ? 'Planned' : 'Future'}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {roadmapItem.initiatives.map((initiative, initIndex) => (
                              <div key={initIndex} className="flex items-center gap-2 text-sm">
                                <Settings className="h-3 w-3 text-blue-600" />
                                <span>{initiative}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Engine Actions & Summary */}
          <EngineActionsSummary areaId="experience-optimization" subSectionId="content" />
        </div>
        </main>
      </div>
    </div>
  );
}