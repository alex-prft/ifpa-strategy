'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import { ArrowLeft, Settings, Database, FileText, Zap, Mail, BookOpen, Users, Activity, TrendingUp, MessageSquare, Brain, BarChart3, Calendar, Target } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ResultsSidebar from '@/components/ResultsSidebar';
import EngineActionsSummary from '@/components/EngineActionsSummary';

// Content Recommendations DXP Tool Component
function ContentRecommendationsContent({ workflowResult, selectedRole }: { workflowResult: OSAWorkflowOutput, selectedRole?: string }) {
  return (
    <div id="content-recommendations-content" className="space-y-6">
      {/* NLP Topic Analysis - Wide Row */}
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-purple-600" />
            <CardTitle>NLP Topic Analysis</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-purple-50">
              <h4 className="font-semibold text-purple-800">Topics Identified</h4>
              <p className="text-2xl font-bold text-purple-600">847</p>
              <p className="text-xs text-purple-600 mt-1">Unique content themes</p>
            </Card>
            <Card className="p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-800">Sentiment Score</h4>
              <p className="text-2xl font-bold text-blue-600">92%</p>
              <p className="text-xs text-blue-600 mt-1">Positive sentiment</p>
            </Card>
            <Card className="p-4 bg-green-50">
              <h4 className="font-semibold text-green-800">Content Relevance</h4>
              <p className="text-2xl font-bold text-green-600">89%</p>
              <p className="text-xs text-green-600 mt-1">Topic-audience match</p>
            </Card>
            <Card className="p-4 bg-orange-50">
              <h4 className="font-semibold text-orange-800">Trend Accuracy</h4>
              <p className="text-2xl font-bold text-orange-600">94%</p>
              <p className="text-xs text-orange-600 mt-1">Prediction success</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Top Performing Topics:</h4>
              <div className="space-y-3">
                {[
                  { topic: 'Fresh Produce Quality', engagement: 94, sentiment: 'Positive', trend: 'Rising' },
                  { topic: 'Sustainable Farming', engagement: 89, sentiment: 'Very Positive', trend: 'Rising' },
                  { topic: 'Nutrition Education', engagement: 87, sentiment: 'Positive', trend: 'Stable' },
                  { topic: 'Local Sourcing', engagement: 92, sentiment: 'Positive', trend: 'Rising' },
                  { topic: 'Seasonal Availability', engagement: 85, sentiment: 'Neutral', trend: 'Seasonal' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium">{item.topic}</h5>
                      <p className="text-sm text-muted-foreground">Sentiment: {item.sentiment}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-blue-600">{item.engagement}%</p>
                      <p className={`text-sm ${
                        item.trend === 'Rising' ? 'text-green-600' :
                        item.trend === 'Stable' ? 'text-blue-600' : 'text-yellow-600'
                      }`}>{item.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Content Gap Analysis:</h4>
              <div className="space-y-3">
                {[
                  { gap: 'Organic Certification Process', demand: 'High', availability: 'Low', priority: 'P0' },
                  { gap: 'Storage & Preservation Tips', demand: 'Medium', availability: 'Medium', priority: 'P1' },
                  { gap: 'Recipe Innovation Ideas', demand: 'High', availability: 'Medium', priority: 'P1' },
                  { gap: 'Price Transparency Info', demand: 'Medium', availability: 'Low', priority: 'P0' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h5 className="font-medium">{item.gap}</h5>
                      <p className="text-sm text-muted-foreground">Demand: {item.demand} | Available: {item.availability}</p>
                    </div>
                    <Badge variant={item.priority === 'P0' ? 'destructive' : 'default'}>
                      {item.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visitor Interest Profiles - Wide Row */}
      <Card className="col-span-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-green-600" />
            <CardTitle>Visitor Interest Profiles</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-green-50">
              <h4 className="font-semibold text-green-800">Active Profiles</h4>
              <p className="text-2xl font-bold text-green-600">23.4K</p>
              <p className="text-xs text-green-600 mt-1">Visitor profiles</p>
            </Card>
            <Card className="p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-800">Interest Categories</h4>
              <p className="text-2xl font-bold text-blue-600">47</p>
              <p className="text-xs text-blue-600 mt-1">Unique interests</p>
            </Card>
            <Card className="p-4 bg-purple-50">
              <h4 className="font-semibold text-purple-800">Profile Accuracy</h4>
              <p className="text-2xl font-bold text-purple-600">91%</p>
              <p className="text-xs text-purple-600 mt-1">Interest prediction</p>
            </Card>
            <Card className="p-4 bg-orange-50">
              <h4 className="font-semibold text-orange-800">Engagement Lift</h4>
              <p className="text-2xl font-bold text-orange-600">+34%</p>
              <p className="text-xs text-orange-600 mt-1">With profiling</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                segment: 'Health-Conscious Shoppers',
                size: 8420,
                interests: ['Organic produce', 'Nutrition facts', 'Wellness tips'],
                engagement: 94,
                conversion: 8.2
              },
              {
                segment: 'Budget-Conscious Families',
                size: 12150,
                interests: ['Bulk buying', 'Seasonal deals', 'Storage tips'],
                engagement: 87,
                conversion: 6.1
              },
              {
                segment: 'Gourmet Enthusiasts',
                size: 3890,
                interests: ['Premium varieties', 'Exotic fruits', 'Recipe ideas'],
                engagement: 92,
                conversion: 11.3
              }
            ].map((profile, index) => (
              <Card key={index} className="p-4">
                <h5 className="font-semibold mb-2">{profile.segment}</h5>
                <p className="text-sm text-muted-foreground mb-3">{profile.size.toLocaleString()} visitors</p>
                <div className="space-y-2 mb-4">
                  <h6 className="text-sm font-medium">Top Interests:</h6>
                  <div className="space-y-1">
                    {profile.interests.map((interest, interestIndex) => (
                      <Badge key={interestIndex} variant="outline" className="mr-1 mb-1">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="font-semibold text-blue-600">{profile.engagement}%</div>
                    <div className="text-muted-foreground">Engagement</div>
                  </div>
                  <div>
                    <div className="font-semibold text-green-600">{profile.conversion}%</div>
                    <div className="text-muted-foreground">Conversion</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendation Effectiveness Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <CardTitle>Recommendation Effectiveness Analytics</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="p-4 bg-blue-50">
              <h4 className="font-semibold text-blue-800">Overall CTR</h4>
              <p className="text-2xl font-bold text-blue-600">8.3%</p>
              <p className="text-xs text-blue-600 mt-1">↑ 1.2% vs baseline</p>
            </Card>
            <Card className="p-4 bg-green-50">
              <h4 className="font-semibold text-green-800">Revenue Impact</h4>
              <p className="text-2xl font-bold text-green-600">$47K</p>
              <p className="text-xs text-green-600 mt-1">Last 30 days</p>
            </Card>
            <Card className="p-4 bg-purple-50">
              <h4 className="font-semibold text-purple-800">Coverage Rate</h4>
              <p className="text-2xl font-bold text-purple-600">78%</p>
              <p className="text-xs text-purple-600 mt-1">Sessions with recs</p>
            </Card>
            <Card className="p-4 bg-orange-50">
              <h4 className="font-semibold text-orange-800">Personalization</h4>
              <p className="text-2xl font-bold text-orange-600">94%</p>
              <p className="text-xs text-orange-600 mt-1">Recommendation fit</p>
            </Card>
          </div>

          <div className="space-y-4">
            {[
              { category: 'Product Recommendations', performance: 92, ctr: '12.4%', revenue: '$28K', sessions: '18.2K' },
              { category: 'Related Content', performance: 87, ctr: '8.7%', revenue: '$15K', sessions: '24.1K' },
              { category: 'Personalized Offers', performance: 89, ctr: '9.2%', revenue: '$22K', sessions: '15.8K' },
              { category: 'Cross-sell Suggestions', performance: 84, ctr: '6.8%', revenue: '$18K', sessions: '21.3K' }
            ].map((item, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="font-medium">{item.category}</h5>
                    <p className="text-sm text-muted-foreground">Performance Score: {item.performance}%</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 text-right">
                    <div>
                      <p className="font-semibold text-blue-600">{item.ctr}</p>
                      <p className="text-xs text-muted-foreground">CTR</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-600">{item.revenue}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                    <div>
                      <p className="font-semibold text-purple-600">{item.sessions}</p>
                      <p className="text-xs text-muted-foreground">Sessions</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Content Recommendations Roadmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-6 w-6 text-purple-600" />
            <CardTitle>Strategic Content Recommendations Roadmap</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[
              {
                phase: "Q4 2024",
                title: "Foundation Enhancement",
                status: "in-progress",
                initiatives: [
                  "Advanced NLP topic modeling implementation",
                  "Real-time interest profile updates",
                  "Cross-platform recommendation sync"
                ],
                expectedImpact: "+15% CTR improvement"
              },
              {
                phase: "Q1 2025",
                title: "AI-Driven Personalization",
                status: "planned",
                initiatives: [
                  "Machine learning recommendation engine",
                  "Behavioral prediction algorithms",
                  "Dynamic content adaptation"
                ],
                expectedImpact: "+25% engagement lift"
              },
              {
                phase: "Q2 2025",
                title: "Omnichannel Integration",
                status: "future",
                initiatives: [
                  "Cross-device recommendation tracking",
                  "Email & web content synchronization",
                  "Social media content amplification"
                ],
                expectedImpact: "+30% cross-channel engagement"
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
                      <Target className="h-3 w-3 text-blue-600" />
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
  );
}

export default function DXPToolsPage() {
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
            <h3 className="text-lg font-semibold mb-2">Loading DXP tools data...</h3>
            <p className="text-muted-foreground text-center">Retrieving your Optimizely DXP integrations</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="dxptools-page-container" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div id="dxptools-page-layout" className="flex">
        {/* Sidebar Navigation */}
        <ResultsSidebar currentPage="dxptools" />

        {/* Main Content */}
        <main id="dxptools-main-content" className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
        <div id="dxptools-content-wrapper" className="space-y-6">
          {/* Section Header */}
          <div id="dxptools-header" className="flex items-center gap-3 mb-6">
            <Settings className="h-8 w-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold">Optimizely DXP Tools</h2>
              <p className="text-muted-foreground">Comprehensive DXP tool analysis and optimization recommendations</p>
            </div>
          </div>

          {/* DXP Tools Tabs */}
          <Tabs id="dxptools-tabs-container" defaultValue="content-recs" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="content-recs">Content Recs</TabsTrigger>
              <TabsTrigger value="cms">CMS</TabsTrigger>
              <TabsTrigger value="odp">ODP</TabsTrigger>
              <TabsTrigger value="webx">WEBX</TabsTrigger>
              <TabsTrigger value="cmp">CMP</TabsTrigger>
            </TabsList>

            <TabsContent id="dxptools-content-recs-content" value="content-recs">
              <ContentRecommendationsContent workflowResult={workflowResult} selectedRole="marketing-manager" />
            </TabsContent>

            <TabsContent id="dxptools-cms-content" value="cms">
              <div className="space-y-6">
                {/* Content Model Performance */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Database className="h-6 w-6 text-green-600" />
                      <CardTitle>Content Model Performance</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Content Types</h4>
                        <p className="text-2xl font-bold text-green-600">24</p>
                        <p className="text-xs text-green-600 mt-1">Active models</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Model Efficiency</h4>
                        <p className="text-2xl font-bold text-blue-600">94%</p>
                        <p className="text-xs text-blue-600 mt-1">Utilization rate</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Schema Validity</h4>
                        <p className="text-2xl font-bold text-purple-600">98%</p>
                        <p className="text-xs text-purple-600 mt-1">Valid content</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">API Performance</h4>
                        <p className="text-2xl font-bold text-orange-600">145ms</p>
                        <p className="text-xs text-orange-600 mt-1">Response time</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Top Performing Content Models:</h4>
                        <div className="space-y-3">
                          {[
                            { model: 'Product Pages', usage: 2840, performance: 96, status: 'Excellent' },
                            { model: 'Blog Articles', usage: 1520, performance: 92, status: 'Good' },
                            { model: 'Landing Pages', usage: 890, performance: 89, status: 'Good' },
                            { model: 'Category Pages', usage: 1240, performance: 94, status: 'Excellent' },
                            { model: 'News Updates', usage: 680, performance: 87, status: 'Good' }
                          ].map((item, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium">{item.model}</h5>
                                  <p className="text-sm text-muted-foreground">{item.usage} instances</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-blue-600">{item.performance}%</p>
                                  <Badge variant={item.status === 'Excellent' ? 'default' : 'secondary'}>
                                    {item.status}
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Content Model Health:</h4>
                        <div className="space-y-3">
                          {[
                            { metric: 'Field Utilization', score: 89, trend: '+3%' },
                            { metric: 'Validation Compliance', score: 94, trend: '+1%' },
                            { metric: 'Migration Success', score: 97, trend: '+5%' },
                            { metric: 'Content Completeness', score: 91, trend: '+2%' },
                            { metric: 'Schema Flexibility', score: 86, trend: '+7%' }
                          ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h6 className="font-medium">{item.metric}</h6>
                                <p className="text-sm text-green-600">{item.trend} this month</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">{item.score}%</div>
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      item.score >= 90 ? 'bg-green-500' :
                                      item.score >= 80 ? 'bg-blue-500' : 'bg-yellow-500'
                                    }`}
                                    style={{ width: `${item.score}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Workflow & Template Analytics */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Activity className="h-6 w-6 text-blue-600" />
                      <CardTitle>Workflow & Template Analytics</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Active Workflows</h4>
                        <p className="text-2xl font-bold text-blue-600">12</p>
                        <p className="text-xs text-blue-600 mt-1">Automated processes</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Template Usage</h4>
                        <p className="text-2xl font-bold text-green-600">87%</p>
                        <p className="text-xs text-green-600 mt-1">Content from templates</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Editor Efficiency</h4>
                        <p className="text-2xl font-bold text-purple-600">92%</p>
                        <p className="text-xs text-purple-600 mt-1">Task completion</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Approval Speed</h4>
                        <p className="text-2xl font-bold text-orange-600">2.1</p>
                        <p className="text-xs text-orange-600 mt-1">Days average</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Workflow Performance:</h4>
                        <div className="space-y-3">
                          {[
                            { workflow: 'Content Creation', efficiency: 94, avgTime: '3.2h', status: 'Optimized' },
                            { workflow: 'Review & Approval', efficiency: 89, avgTime: '1.8d', status: 'Good' },
                            { workflow: 'Publishing', efficiency: 96, avgTime: '15min', status: 'Optimized' },
                            { workflow: 'Content Updates', efficiency: 87, avgTime: '2.1h', status: 'Good' },
                            { workflow: 'Asset Management', efficiency: 82, avgTime: '45min', status: 'Needs Work' }
                          ].map((item, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium">{item.workflow}</h5>
                                  <p className="text-sm text-muted-foreground">Avg: {item.avgTime}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-semibold text-blue-600">{item.efficiency}%</p>
                                  <Badge variant={
                                    item.status === 'Optimized' ? 'default' :
                                    item.status === 'Good' ? 'secondary' : 'destructive'
                                  }>
                                    {item.status}
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Template Analytics:</h4>
                        <div className="space-y-3">
                          {[
                            { template: 'Product Description', usage: 340, efficiency: 95, satisfaction: 4.8 },
                            { template: 'Blog Post Layout', usage: 180, efficiency: 92, satisfaction: 4.6 },
                            { template: 'Landing Page Hero', usage: 120, efficiency: 89, satisfaction: 4.4 },
                            { template: 'Category Overview', usage: 85, efficiency: 94, satisfaction: 4.7 },
                            { template: 'News Article', usage: 65, efficiency: 88, satisfaction: 4.3 }
                          ].map((item, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{item.template}</h5>
                                <span className="text-sm font-bold">{item.usage} uses</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="font-semibold text-blue-600">{item.efficiency}%</div>
                                  <div className="text-muted-foreground">Efficiency</div>
                                </div>
                                <div>
                                  <div className="font-semibold text-green-600">{item.satisfaction}/5</div>
                                  <div className="text-muted-foreground">Satisfaction</div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* CMS Strategic Optimization Roadmap */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-purple-600" />
                      <CardTitle>CMS Strategic Optimization Roadmap</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        {
                          phase: "Q4 2024",
                          title: "Workflow Enhancement",
                          status: "in-progress",
                          initiatives: [
                            "Automated content approval workflows",
                            "Enhanced template library expansion",
                            "Real-time collaboration features"
                          ],
                          expectedImpact: "+20% editor productivity"
                        },
                        {
                          phase: "Q1 2025",
                          title: "AI-Powered Content Creation",
                          status: "planned",
                          initiatives: [
                            "AI content suggestion engine",
                            "Automated SEO optimization",
                            "Dynamic template generation"
                          ],
                          expectedImpact: "+35% content creation speed"
                        },
                        {
                          phase: "Q2 2025",
                          title: "Advanced Integration & Analytics",
                          status: "future",
                          initiatives: [
                            "Deep analytics integration",
                            "Omnichannel content distribution",
                            "Advanced personalization tools"
                          ],
                          expectedImpact: "+40% content performance"
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
                                <Target className="h-3 w-3 text-blue-600" />
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

            <TabsContent id="dxptools-odp-content" value="odp">
              <div className="space-y-6">
                {/* Unified Customer Profiles - Wide Row */}
                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-indigo-600" />
                      <CardTitle>Unified Customer Profiles</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-indigo-50">
                        <h4 className="font-semibold text-indigo-800">Total Profiles</h4>
                        <p className="text-2xl font-bold text-indigo-600">124K</p>
                        <p className="text-xs text-indigo-600 mt-1">↑ 8% this month</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Profile Completeness</h4>
                        <p className="text-2xl font-bold text-blue-600">87%</p>
                        <p className="text-xs text-blue-600 mt-1">Average completeness</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Data Sources</h4>
                        <p className="text-2xl font-bold text-green-600">12</p>
                        <p className="text-xs text-green-600 mt-1">Integrated systems</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Real-time Sync</h4>
                        <p className="text-2xl font-bold text-purple-600">98.7%</p>
                        <p className="text-xs text-purple-600 mt-1">Sync success rate</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Profile Attributes:</h4>
                        <div className="space-y-3">
                          {[
                            { attribute: 'Behavioral Data', coverage: 94, quality: 'High' },
                            { attribute: 'Demographic Info', coverage: 89, quality: 'Good' },
                            { attribute: 'Purchase History', coverage: 96, quality: 'High' },
                            { attribute: 'Engagement Metrics', coverage: 91, quality: 'Good' },
                            { attribute: 'Preference Data', coverage: 82, quality: 'Medium' }
                          ].map((item, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <h6 className="font-medium">{item.attribute}</h6>
                                <p className="text-sm text-muted-foreground">Quality: {item.quality}</p>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-blue-600">{item.coverage}%</div>
                                <div className="w-16 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-blue-600 h-1.5 rounded-full"
                                    style={{ width: `${item.coverage}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Identity Resolution:</h4>
                        <div className="space-y-3">
                          {[
                            { method: 'Email Matching', matches: 89240, accuracy: 96 },
                            { method: 'Device Linking', matches: 67580, accuracy: 89 },
                            { method: 'Behavioral Patterns', matches: 52340, accuracy: 84 },
                            { method: 'Customer ID Cross-ref', matches: 78920, accuracy: 98 }
                          ].map((item, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h6 className="font-medium">{item.method}</h6>
                                <span className="text-sm font-bold">{item.matches.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Accuracy</span>
                                <span className="font-semibold text-green-600">{item.accuracy}%</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Profile Enrichment:</h4>
                        <div className="space-y-3">
                          {[
                            { source: 'First-party Data', contribution: 45, freshness: '< 1 hour' },
                            { source: 'Third-party Enrichment', contribution: 28, freshness: '< 24 hours' },
                            { source: 'Behavioral Inference', contribution: 19, freshness: 'Real-time' },
                            { source: 'ML Predictions', contribution: 8, freshness: 'Daily batch' }
                          ].map((item, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <h6 className="font-medium text-sm">{item.source}</h6>
                                <span className="text-lg font-bold text-blue-600">{item.contribution}%</span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Freshness: {item.freshness}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Predictive Analytics Engine - Wide Row */}
                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Brain className="h-6 w-6 text-purple-600" />
                      <CardTitle>Predictive Analytics Engine</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Model Accuracy</h4>
                        <p className="text-2xl font-bold text-purple-600">94.2%</p>
                        <p className="text-xs text-purple-600 mt-1">Prediction accuracy</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Active Models</h4>
                        <p className="text-2xl font-bold text-blue-600">18</p>
                        <p className="text-xs text-blue-600 mt-1">ML models deployed</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Predictions/Day</h4>
                        <p className="text-2xl font-bold text-green-600">2.4M</p>
                        <p className="text-xs text-green-600 mt-1">Real-time predictions</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Model Confidence</h4>
                        <p className="text-2xl font-bold text-orange-600">89%</p>
                        <p className="text-xs text-orange-600 mt-1">Average confidence</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Prediction Models:</h4>
                        <div className="space-y-3">
                          {[
                            { model: 'Purchase Propensity', accuracy: 96, usage: 'High', impact: 'Revenue +18%' },
                            { model: 'Churn Risk', accuracy: 92, usage: 'High', impact: 'Retention +24%' },
                            { model: 'Lifetime Value', accuracy: 89, usage: 'Medium', impact: 'Targeting +31%' },
                            { model: 'Next Best Action', accuracy: 94, usage: 'High', impact: 'Conversion +22%' },
                            { model: 'Seasonal Preferences', accuracy: 87, usage: 'Medium', impact: 'Personalization +15%' }
                          ].map((item, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h5 className="font-medium">{item.model}</h5>
                                  <p className="text-sm text-green-600">{item.impact}</p>
                                </div>
                                <Badge variant={item.usage === 'High' ? 'default' : 'secondary'}>
                                  {item.usage}
                                </Badge>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Accuracy</span>
                                <span className="font-semibold text-purple-600">{item.accuracy}%</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Model Performance Trends:</h4>
                        <div className="space-y-4">
                          {[
                            {
                              category: 'Purchase Predictions',
                              currentWeek: 94.2,
                              lastWeek: 93.8,
                              trend: '+0.4%',
                              predictions: '847K'
                            },
                            {
                              category: 'Behavioral Modeling',
                              currentWeek: 89.7,
                              lastWeek: 89.1,
                              trend: '+0.6%',
                              predictions: '1.2M'
                            },
                            {
                              category: 'Engagement Scoring',
                              currentWeek: 91.3,
                              lastWeek: 91.8,
                              trend: '-0.5%',
                              predictions: '340K'
                            }
                          ].map((item, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{item.category}</h5>
                                <span className="text-sm font-bold">{item.predictions}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <div className="text-sm text-muted-foreground">Current</div>
                                  <div className="font-semibold text-blue-600">{item.currentWeek}%</div>
                                </div>
                                <div>
                                  <div className="text-sm text-muted-foreground">Trend</div>
                                  <div className={`font-semibold ${
                                    item.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                                  }`}>{item.trend}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Audience Segmentation Analytics */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-green-600" />
                      <CardTitle>Advanced Audience Segmentation Analytics</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Active Segments</h4>
                        <p className="text-2xl font-bold text-green-600">47</p>
                        <p className="text-xs text-green-600 mt-1">Dynamic segments</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Segment Precision</h4>
                        <p className="text-2xl font-bold text-blue-600">92%</p>
                        <p className="text-xs text-blue-600 mt-1">Targeting accuracy</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Overlap Analysis</h4>
                        <p className="text-2xl font-bold text-purple-600">18%</p>
                        <p className="text-xs text-purple-600 mt-1">Avg overlap rate</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Performance Lift</h4>
                        <p className="text-2xl font-bold text-orange-600">+34%</p>
                        <p className="text-xs text-orange-600 mt-1">vs. broad targeting</p>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Top Performing Segments:</h4>
                      {[
                        { name: 'High-Value Fresh Produce Buyers', size: 8470, conversion: 8.2, growth: '+12%', value: '$142' },
                        { name: 'Mobile-First Convenience Shoppers', size: 12340, conversion: 6.1, growth: '+18%', value: '$89' },
                        { name: 'Organic Premium Customers', size: 5620, conversion: 9.1, growth: '+5%', value: '$238' },
                        { name: 'Bulk Purchase Commercial Buyers', size: 3890, conversion: 11.3, growth: '+22%', value: '$420' }
                      ].map((segment, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">{segment.name}</h5>
                              <p className="text-sm text-muted-foreground">{segment.size.toLocaleString()} profiles</p>
                            </div>
                            <div className="grid grid-cols-3 gap-6 text-right">
                              <div>
                                <p className="font-semibold text-green-600">{segment.conversion}%</p>
                                <p className="text-xs text-muted-foreground">Conversion</p>
                              </div>
                              <div>
                                <p className="font-semibold text-blue-600">{segment.growth}</p>
                                <p className="text-xs text-muted-foreground">Growth</p>
                              </div>
                              <div>
                                <p className="font-semibold text-purple-600">{segment.value}</p>
                                <p className="text-xs text-muted-foreground">Avg Value</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Data Quality & Integration Health */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Database className="h-6 w-6 text-orange-600" />
                      <CardTitle>Data Quality & Integration Health</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Data Quality Score</h4>
                        <p className="text-2xl font-bold text-orange-600">92%</p>
                        <p className="text-xs text-orange-600 mt-1">Overall quality</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Integration Health</h4>
                        <p className="text-2xl font-bold text-green-600">96%</p>
                        <p className="text-xs text-green-600 mt-1">System uptime</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Data Freshness</h4>
                        <p className="text-2xl font-bold text-blue-600">{'< 2min'}</p>
                        <p className="text-xs text-blue-600 mt-1">Avg latency</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Error Rate</h4>
                        <p className="text-2xl font-bold text-purple-600">0.3%</p>
                        <p className="text-xs text-purple-600 mt-1">Data errors</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Data Source Health:</h4>
                        <div className="space-y-3">
                          {[
                            { source: 'Website Analytics', health: 98, latency: '30s', errors: '0.1%' },
                            { source: 'CRM System', health: 96, latency: '2min', errors: '0.2%' },
                            { source: 'Email Platform', health: 94, latency: '5min', errors: '0.4%' },
                            { source: 'E-commerce Platform', health: 99, latency: '15s', errors: '0.1%' },
                            { source: 'Social Media APIs', health: 87, latency: '10min', errors: '1.2%' }
                          ].map((item, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{item.source}</h5>
                                <Badge variant={item.health >= 95 ? 'default' : item.health >= 90 ? 'secondary' : 'destructive'}>
                                  {item.health}%
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Latency: </span>
                                  <span className="font-medium">{item.latency}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Errors: </span>
                                  <span className="font-medium">{item.errors}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Data Quality Metrics:</h4>
                        <div className="space-y-3">
                          {[
                            { metric: 'Completeness', score: 94, description: 'Required fields populated' },
                            { metric: 'Accuracy', score: 89, description: 'Data validation passed' },
                            { metric: 'Consistency', score: 97, description: 'Cross-system alignment' },
                            { metric: 'Timeliness', score: 91, description: 'Data freshness standards' },
                            { metric: 'Uniqueness', score: 88, description: 'Duplicate record rate' }
                          ].map((item, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <h6 className="font-medium">{item.metric}</h6>
                                <span className="font-bold text-blue-600">{item.score}%</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    item.score >= 90 ? 'bg-green-500' :
                                    item.score >= 80 ? 'bg-blue-500' : 'bg-yellow-500'
                                  }`}
                                  style={{ width: `${item.score}%` }}
                                ></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ODP Strategic Enhancement Roadmap */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-indigo-600" />
                      <CardTitle>ODP Strategic Enhancement Roadmap</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        {
                          phase: "Q4 2024",
                          title: "Data Foundation Strengthening",
                          status: "in-progress",
                          initiatives: [
                            "Enhanced data quality monitoring",
                            "Advanced identity resolution improvements",
                            "Real-time data validation framework"
                          ],
                          expectedImpact: "+15% data quality improvement"
                        },
                        {
                          phase: "Q1 2025",
                          title: "AI-Powered Insights Engine",
                          status: "planned",
                          initiatives: [
                            "Advanced predictive modeling expansion",
                            "Automated segment discovery",
                            "Real-time propensity scoring"
                          ],
                          expectedImpact: "+30% prediction accuracy"
                        },
                        {
                          phase: "Q2 2025",
                          title: "Cross-Platform Integration",
                          status: "future",
                          initiatives: [
                            "Omnichannel customer journey mapping",
                            "Third-party data enrichment APIs",
                            "Advanced privacy compliance tools"
                          ],
                          expectedImpact: "+40% profile completeness"
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
                                <Target className="h-3 w-3 text-blue-600" />
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

            <TabsContent id="dxptools-webx-content" value="webx">
              <div className="space-y-6">
                {/* WEBX Strategic Enhancement Roadmap */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Zap className="h-6 w-6 text-yellow-600" />
                      <CardTitle>WEBX Strategic Enhancement Roadmap</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        {
                          phase: "Q4 2024",
                          title: "Advanced Testing Framework",
                          status: "in-progress",
                          initiatives: [
                            "Multi-variate testing capabilities expansion",
                            "Statistical significance automation",
                            "Cross-device experiment tracking"
                          ],
                          expectedImpact: "+25% testing velocity"
                        },
                        {
                          phase: "Q1 2025",
                          title: "AI-Powered Experimentation",
                          status: "planned",
                          initiatives: [
                            "Automated experiment hypothesis generation",
                            "Machine learning test optimization",
                            "Predictive winner identification"
                          ],
                          expectedImpact: "+40% experiment success rate"
                        },
                        {
                          phase: "Q2 2025",
                          title: "Omnichannel Testing Platform",
                          status: "future",
                          initiatives: [
                            "Cross-channel experiment orchestration",
                            "Unified testing analytics dashboard",
                            "Real-time personalization testing"
                          ],
                          expectedImpact: "+50% cross-channel optimization"
                        },
                        {
                          phase: "Q3 2025",
                          title: "Advanced Analytics & Insights",
                          status: "future",
                          initiatives: [
                            "Deep behavioral analytics integration",
                            "Causal impact analysis tools",
                            "Long-term effect measurement"
                          ],
                          expectedImpact: "+35% insight depth"
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
                                <Target className="h-3 w-3 text-blue-600" />
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

            <TabsContent id="dxptools-cmp-content" value="cmp">
              <div className="space-y-6">
                {/* Content Performance Analytics - Wide Row */}
                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-blue-600" />
                      <CardTitle>Content Performance Analytics</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Content Engagement</h4>
                        <p className="text-2xl font-bold text-blue-600">84.2%</p>
                        <p className="text-xs text-blue-600 mt-1">↑ 12% improvement</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Email Open Rate</h4>
                        <p className="text-2xl font-bold text-green-600">28.4%</p>
                        <p className="text-xs text-green-600 mt-1">Above industry avg</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Content CTR</h4>
                        <p className="text-2xl font-bold text-purple-600">6.8%</p>
                        <p className="text-xs text-purple-600 mt-1">↑ 2.1% vs baseline</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Social Shares</h4>
                        <p className="text-2xl font-bold text-orange-600">12.4K</p>
                        <p className="text-xs text-orange-600 mt-1">Monthly total</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Content Type Performance:</h4>
                        <div className="space-y-3">
                          {[
                            { type: 'Educational Articles', performance: 92, engagement: '5m 24s', shares: 2840 },
                            { type: 'Product Spotlights', performance: 89, engagement: '3m 18s', shares: 1920 },
                            { type: 'Recipe Collections', performance: 94, engagement: '6m 12s', shares: 3420 },
                            { type: 'Industry News', performance: 78, engagement: '2m 45s', shares: 890 },
                            { type: 'Event Announcements', performance: 85, engagement: '3m 52s', shares: 1540 }
                          ].map((item, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{item.type}</h5>
                                <span className="font-bold text-blue-600">{item.performance}%</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Avg Time: </span>
                                  <span className="font-medium">{item.engagement}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Shares: </span>
                                  <span className="font-medium">{item.shares.toLocaleString()}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Content Channel Performance:</h4>
                        <div className="space-y-3">
                          {[
                            { channel: 'Email Newsletter', reach: 45200, engagement: 28.4, conversion: 4.2 },
                            { channel: 'Website Blog', reach: 89400, engagement: 15.7, conversion: 2.8 },
                            { channel: 'Social Media', reach: 124800, engagement: 12.3, conversion: 1.9 },
                            { channel: 'Mobile App', reach: 34700, engagement: 32.1, conversion: 6.1 },
                            { channel: 'Print Materials', reach: 12400, engagement: 8.9, conversion: 3.4 }
                          ].map((item, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{item.channel}</h5>
                                <span className="text-sm font-bold">{item.reach.toLocaleString()}</span>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <div className="font-semibold text-blue-600">{item.engagement}%</div>
                                  <div className="text-muted-foreground">Engagement</div>
                                </div>
                                <div>
                                  <div className="font-semibold text-green-600">{item.conversion}%</div>
                                  <div className="text-muted-foreground">Conversion</div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Campaign Orchestration Insights - Wide Row */}
                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Activity className="h-6 w-6 text-red-600" />
                      <CardTitle>Campaign Orchestration Insights</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-red-50">
                        <h4 className="font-semibold text-red-800">Active Campaigns</h4>
                        <p className="text-2xl font-bold text-red-600">24</p>
                        <p className="text-xs text-red-600 mt-1">Multi-channel campaigns</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Orchestration Rate</h4>
                        <p className="text-2xl font-bold text-orange-600">89%</p>
                        <p className="text-xs text-orange-600 mt-1">Automated coordination</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Cross-Channel Lift</h4>
                        <p className="text-2xl font-bold text-green-600">+34%</p>
                        <p className="text-xs text-green-600 mt-1">vs. single channel</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Campaign Velocity</h4>
                        <p className="text-2xl font-bold text-purple-600">5.2d</p>
                        <p className="text-xs text-purple-600 mt-1">Avg launch time</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Campaign Orchestration Workflows:</h4>
                        <div className="space-y-3">
                          {[
                            { workflow: 'Email + Social Sync', campaigns: 18, success: 94, avgLift: '+28%' },
                            { workflow: 'Web + Mobile Push', campaigns: 12, success: 91, avgLift: '+22%' },
                            { workflow: 'Cross-Device Journey', campaigns: 8, success: 87, avgLift: '+35%' },
                            { workflow: 'Omnichannel Nurture', campaigns: 6, success: 96, avgLift: '+41%' },
                            { workflow: 'Event-Triggered Multi', campaigns: 14, success: 89, avgLift: '+18%' }
                          ].map((item, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{item.workflow}</h5>
                                <Badge variant={item.success >= 90 ? 'default' : 'secondary'}>
                                  {item.success}% Success
                                </Badge>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Campaigns: </span>
                                  <span className="font-medium">{item.campaigns}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Avg Lift: </span>
                                  <span className="font-medium text-green-600">{item.avgLift}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Channel Coordination Metrics:</h4>
                        <div className="space-y-3">
                          {[
                            { metric: 'Message Consistency', score: 96, trend: '+2%' },
                            { metric: 'Timing Optimization', score: 89, trend: '+5%' },
                            { metric: 'Audience Overlap Management', score: 92, trend: '+1%' },
                            { metric: 'Creative Alignment', score: 94, trend: '+3%' },
                            { metric: 'Attribution Accuracy', score: 88, trend: '+7%' }
                          ].map((item, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-1">
                                <h6 className="font-medium">{item.metric}</h6>
                                <span className="font-bold text-blue-600">{item.score}%</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${
                                      item.score >= 90 ? 'bg-green-500' :
                                      item.score >= 85 ? 'bg-blue-500' : 'bg-yellow-500'
                                    }`}
                                    style={{ width: `${item.score}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm text-green-600">{item.trend}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Advanced Campaign Analytics & Attribution */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                      <CardTitle>Advanced Campaign Analytics & Attribution</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Attribution Models</h4>
                        <p className="text-2xl font-bold text-purple-600">7</p>
                        <p className="text-xs text-purple-600 mt-1">Active models</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Attribution Accuracy</h4>
                        <p className="text-2xl font-bold text-blue-600">92%</p>
                        <p className="text-xs text-blue-600 mt-1">Model precision</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Revenue Attribution</h4>
                        <p className="text-2xl font-bold text-green-600">$847K</p>
                        <p className="text-xs text-green-600 mt-1">Attributed revenue</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Cross-Channel ROI</h4>
                        <p className="text-2xl font-bold text-orange-600">4.2x</p>
                        <p className="text-xs text-orange-600 mt-1">Multi-touch ROI</p>
                      </Card>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-semibold">Campaign Performance Analysis:</h4>
                      {[
                        { campaign: 'Fresh Produce Weekly Newsletter', type: 'Email', reach: 45200, engagement: '32.1%', revenue: '$67K', roi: '4.8x' },
                        { campaign: 'Seasonal Recipe Recommendations', type: 'Multi-channel', reach: 89400, engagement: '28.7%', revenue: '$94K', roi: '3.9x' },
                        { campaign: 'Member Exclusive Offers', type: 'Email + SMS', reach: 34700, engagement: '41.2%', revenue: '$128K', roi: '5.2x' },
                        { campaign: 'Event Promotion Series', type: 'Omnichannel', reach: 67800, engagement: '25.4%', revenue: '$78K', roi: '3.1x' }
                      ].map((campaign, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium">{campaign.campaign}</h5>
                              <p className="text-sm text-muted-foreground">{campaign.type} • {campaign.reach.toLocaleString()} reach</p>
                            </div>
                            <div className="grid grid-cols-3 gap-6 text-right">
                              <div>
                                <p className="font-semibold text-blue-600">{campaign.engagement}</p>
                                <p className="text-xs text-muted-foreground">Engagement</p>
                              </div>
                              <div>
                                <p className="font-semibold text-green-600">{campaign.revenue}</p>
                                <p className="text-xs text-muted-foreground">Revenue</p>
                              </div>
                              <div>
                                <p className="font-semibold text-purple-600">{campaign.roi}</p>
                                <p className="text-xs text-muted-foreground">ROI</p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* CMP Strategic Enhancement Roadmap */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-red-600" />
                      <CardTitle>CMP Strategic Enhancement Roadmap</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {[
                        {
                          phase: "Q4 2024",
                          title: "Advanced Orchestration Engine",
                          status: "in-progress",
                          initiatives: [
                            "AI-powered campaign timing optimization",
                            "Cross-channel message sequencing",
                            "Real-time audience rebalancing"
                          ],
                          expectedImpact: "+20% campaign efficiency"
                        },
                        {
                          phase: "Q1 2025",
                          title: "Predictive Campaign Intelligence",
                          status: "planned",
                          initiatives: [
                            "Campaign performance forecasting",
                            "Automated A/B test recommendations",
                            "Dynamic content optimization"
                          ],
                          expectedImpact: "+30% campaign performance"
                        },
                        {
                          phase: "Q2 2025",
                          title: "Omnichannel Attribution Platform",
                          status: "future",
                          initiatives: [
                            "Advanced multi-touch attribution",
                            "Cross-device customer journey mapping",
                            "Real-time ROI optimization"
                          ],
                          expectedImpact: "+25% attribution accuracy"
                        },
                        {
                          phase: "Q3 2025",
                          title: "Autonomous Campaign Management",
                          status: "future",
                          initiatives: [
                            "Self-optimizing campaign algorithms",
                            "Automated creative generation",
                            "Predictive audience expansion"
                          ],
                          expectedImpact: "+40% operational efficiency"
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
                                <Target className="h-3 w-3 text-blue-600" />
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
          <EngineActionsSummary areaId="dxp-tools" subSectionId="content-recommendations" />
        </div>
        </main>
      </div>
    </div>
  );
}