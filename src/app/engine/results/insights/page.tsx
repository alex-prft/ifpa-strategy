'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import { ArrowLeft, BarChart3, Users, TrendingUp, Eye, Target, Heart, Brain, Zap, MessageSquare, Activity, Award, Calendar, PieChart, Settings } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ResultsSidebar from '@/components/ResultsSidebar';
import EngineActionsSummary from '@/components/EngineActionsSummary';

export default function AnalyticsInsightsPage() {
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
            <h3 className="text-lg font-semibold mb-2">Loading analytics insights...</h3>
            <p className="text-muted-foreground text-center">Retrieving your performance data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="insights-page-container" className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div id="insights-page-layout" className="flex">
        {/* Sidebar Navigation */}
        <ResultsSidebar currentPage="insights" />

        {/* Main Content */}
        <main id="insights-main-content" className="flex-1 bg-gradient-to-br from-slate-50 via-white to-slate-100 p-8">
        <div id="insights-content-wrapper" className="space-y-6">
          {/* Section Header */}
          <div id="insights-header" className="flex items-center gap-3 mb-6">
            <BarChart3 className="h-8 w-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold">Analytics Insights</h2>
              <p className="text-muted-foreground">Comprehensive performance analytics and data-driven insights</p>
            </div>
          </div>

          {/* Analytics Tabs */}
          <Tabs id="insights-tabs-container" defaultValue="osa" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="osa">OSA</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="audiences">Audiences</TabsTrigger>
              <TabsTrigger value="cx">CX</TabsTrigger>
              <TabsTrigger value="other">Other</TabsTrigger>
            </TabsList>

            <TabsContent id="insights-osa-content" value="osa">
              {/* Sub-navigation for OSA */}
              <Tabs defaultValue="engagement" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="ai-visibility">AI Visibility</TabsTrigger>
                  <TabsTrigger value="semantic">Semantic</TabsTrigger>
                  <TabsTrigger value="geographic">Geographic</TabsTrigger>
                  <TabsTrigger value="freshness">Freshness</TabsTrigger>
                </TabsList>

                <TabsContent value="engagement">
              <div className="space-y-6">
                {/* OSA Performance Overview */}
                <Card id="insights-osa-performance-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                      <CardTitle>OSA Performance Overview</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent id="insights-osa-performance-content">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Website Traffic</h4>
                        <p className="text-2xl font-bold text-blue-600">87.3K</p>
                        <p className="text-xs text-blue-600 mt-1">↑ 12% vs last month</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Conversion Rate</h4>
                        <p className="text-2xl font-bold text-green-600">2.4%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 0.3% improvement</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Engagement Score</h4>
                        <p className="text-2xl font-bold text-purple-600">78/100</p>
                        <p className="text-xs text-purple-600 mt-1">Above benchmark</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Revenue</h4>
                        <p className="text-2xl font-bold text-orange-600">$124K</p>
                        <p className="text-xs text-orange-600 mt-1">Monthly total</p>
                      </Card>
                    </div>

                    {/* Traffic Sources */}
                    <div className="mt-6">
                      <h4 className="font-semibold mb-3">Top Traffic Sources:</h4>
                      <div className="space-y-3">
                        {[
                          { source: 'Organic Search', visitors: '34.2K', percentage: 39.2, growth: '+8%' },
                          { source: 'Direct Traffic', visitors: '21.8K', percentage: 25.0, growth: '+15%' },
                          { source: 'Email Marketing', visitors: '15.3K', percentage: 17.5, growth: '+22%' },
                          { source: 'Social Media', visitors: '10.1K', percentage: 11.6, growth: '+5%' },
                          { source: 'Paid Search', visitors: '5.9K', percentage: 6.7, growth: '-3%' }
                        ].map((source, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                              <div>
                                <p className="font-medium">{source.source}</p>
                                <p className="text-sm text-muted-foreground">{source.visitors} visitors</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{source.percentage}%</p>
                              <p className={`text-sm ${source.growth.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                {source.growth}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* User Behavior Analytics */}
                <Card id="insights-user-behavior-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-green-600" />
                      <CardTitle>User Behavior Analytics</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent id="insights-user-behavior-content">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Session Insights */}
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">Session Insights</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Avg Session Duration</span>
                            <span className="font-medium">4m 32s</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Pages per Session</span>
                            <span className="font-medium">3.7</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Bounce Rate</span>
                            <span className="font-medium">32.1%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Return Visitors</span>
                            <span className="font-medium">68%</span>
                          </div>
                        </div>
                      </Card>

                      {/* Device Analytics */}
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">Device Breakdown</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>Desktop</span>
                            <span className="font-medium">45.2%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Mobile</span>
                            <span className="font-medium">42.8%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Tablet</span>
                            <span className="font-medium">12.0%</span>
                          </div>
                        </div>
                      </Card>

                      {/* Geographic Distribution */}
                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">Top Regions</h4>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span>United States</span>
                            <span className="font-medium">78.3%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Canada</span>
                            <span className="font-medium">12.1%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>United Kingdom</span>
                            <span className="font-medium">4.2%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Australia</span>
                            <span className="font-medium">3.1%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Other</span>
                            <span className="font-medium">2.3%</span>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Conversion Funnel */}
                <Card id="insights-conversion-funnel-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                      <CardTitle>Conversion Funnel Analysis</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent id="insights-conversion-funnel-content">
                    <div className="space-y-4">
                      {[
                        { stage: 'Website Visitors', count: 87340, percentage: 100, dropoff: 0 },
                        { stage: 'Product Views', count: 52404, percentage: 60.0, dropoff: 40.0 },
                        { stage: 'Add to Cart', count: 18568, percentage: 21.3, dropoff: 64.6 },
                        { stage: 'Checkout Started', count: 8954, percentage: 10.3, dropoff: 51.8 },
                        { stage: 'Payment Completed', count: 2096, percentage: 2.4, dropoff: 76.6 }
                      ].map((stage, index) => (
                        <div key={index} className="relative">
                          <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                              <h5 className="font-medium">{stage.stage}</h5>
                              <p className="text-sm text-muted-foreground">{stage.count.toLocaleString()} users</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">{stage.percentage}%</p>
                              {stage.dropoff > 0 && (
                                <p className="text-sm text-red-600">-{stage.dropoff}% drop-off</p>
                              )}
                            </div>
                          </div>
                          {index < 4 && (
                            <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 text-center">
                              <div className="w-0.5 h-4 bg-gray-300 mx-auto"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
                </TabsContent>

                <TabsContent value="topics">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Topics Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[
                            { topic: 'Fresh Produce', mentions: 2450, sentiment: 92, growth: '+15%' },
                            { topic: 'Organic Foods', mentions: 1820, sentiment: 89, growth: '+22%' },
                            { topic: 'Seasonal Items', mentions: 1340, sentiment: 85, growth: '+8%' },
                            { topic: 'Local Sourcing', mentions: 980, sentiment: 94, growth: '+31%' },
                            { topic: 'Nutrition Facts', mentions: 750, sentiment: 87, growth: '+12%' },
                            { topic: 'Recipe Ideas', mentions: 620, sentiment: 91, growth: '+18%' }
                          ].map((item, index) => (
                            <Card key={index} className="p-4">
                              <h3 className="font-semibold">{item.topic}</h3>
                              <p className="text-sm text-muted-foreground">{item.mentions.toLocaleString()} mentions</p>
                              <div className="mt-2 space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Sentiment</span>
                                  <span className="font-medium text-green-600">{item.sentiment}%</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Growth</span>
                                  <span className="font-medium text-blue-600">{item.growth}</span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="popular">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Popular Content Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {[
                            { title: 'Top 10 Fresh Produce Tips', views: 45200, engagement: '4.2m', shares: 1840 },
                            { title: 'Seasonal Recipe Collection', views: 38900, engagement: '3.8m', shares: 2240 },
                            { title: 'Organic vs Conventional Guide', views: 32100, engagement: '3.1m', shares: 1650 },
                            { title: 'Storage & Preservation Hacks', views: 28700, engagement: '2.9m', shares: 1420 },
                            { title: 'Nutritional Benefits Deep Dive', views: 24300, engagement: '2.6m', shares: 980 }
                          ].map((item, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h3 className="font-semibold">{item.title}</h3>
                                  <p className="text-sm text-muted-foreground">{item.views.toLocaleString()} views</p>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-blue-600">{item.engagement}</div>
                                  <div className="text-sm text-muted-foreground">{item.shares} shares</div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="ai-visibility">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>AI & Search Visibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3">AI Platform Visibility:</h4>
                            <div className="space-y-3">
                              {[
                                { platform: 'ChatGPT', visibility: 87, mentions: 340, growth: '+24%' },
                                { platform: 'Google Bard', visibility: 72, mentions: 180, growth: '+18%' },
                                { platform: 'Claude', visibility: 65, mentions: 120, growth: '+31%' },
                                { platform: 'Bing Chat', visibility: 58, mentions: 95, growth: '+12%' }
                              ].map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div>
                                    <h5 className="font-medium">{item.platform}</h5>
                                    <p className="text-sm text-muted-foreground">{item.mentions} mentions</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-blue-600">{item.visibility}%</div>
                                    <div className="text-sm text-green-600">{item.growth}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-3">Search Engine Performance:</h4>
                            <div className="space-y-3">
                              {[
                                { metric: 'Featured Snippets', score: 42, change: '+8' },
                                { metric: 'Knowledge Panels', score: 18, change: '+3' },
                                { metric: 'People Also Ask', score: 67, change: '+12' },
                                { metric: 'Image Results', score: 89, change: '+15' }
                              ].map((item, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium">{item.metric}</span>
                                    <span className="text-lg font-bold text-blue-600">{item.score}</span>
                                  </div>
                                  <div className="text-sm text-green-600">+{item.change} this month</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="semantic">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Semantic Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3">Semantic Keywords:</h4>
                            <div className="space-y-2">
                              {[
                                { keyword: 'fresh vegetables', relevance: 94, volume: 'High' },
                                { keyword: 'organic produce', relevance: 89, volume: 'High' },
                                { keyword: 'local farmers market', relevance: 82, volume: 'Medium' },
                                { keyword: 'seasonal fruits', relevance: 87, volume: 'Medium' },
                                { keyword: 'healthy eating', relevance: 91, volume: 'High' }
                              ].map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-2 border rounded">
                                  <span className="font-medium">{item.keyword}</span>
                                  <div className="text-right">
                                    <div className="text-sm font-bold text-blue-600">{item.relevance}%</div>
                                    <div className="text-xs text-muted-foreground">{item.volume}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-3">Entity Recognition:</h4>
                            <div className="grid grid-cols-2 gap-2">
                              {[
                                'Organic Certification',
                                'USDA Standards',
                                'Farm Fresh',
                                'Local Produce',
                                'Seasonal Availability',
                                'Nutritional Value'
                              ].map((entity, index) => (
                                <Badge key={index} variant="outline" className="justify-center p-2">
                                  {entity}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="geographic">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Geographic Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold mb-3">Top Regions:</h4>
                            <div className="space-y-3">
                              {[
                                { region: 'California', traffic: 28400, conversion: 4.2, growth: '+18%' },
                                { region: 'Texas', traffic: 21200, conversion: 3.8, growth: '+12%' },
                                { region: 'Florida', traffic: 18900, conversion: 4.1, growth: '+15%' },
                                { region: 'New York', traffic: 16800, conversion: 3.9, growth: '+8%' },
                                { region: 'Illinois', traffic: 12400, conversion: 3.6, growth: '+22%' }
                              ].map((item, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div>
                                    <h5 className="font-medium">{item.region}</h5>
                                    <p className="text-sm text-muted-foreground">{item.traffic.toLocaleString()} visits</p>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold text-green-600">{item.conversion}%</div>
                                    <div className="text-sm text-blue-600">{item.growth}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-semibold mb-3">Regional Preferences:</h4>
                            <div className="space-y-3">
                              {[
                                { preference: 'Organic Products', regions: ['CA', 'WA', 'OR'], percentage: 67 },
                                { preference: 'Local Sourcing', regions: ['VT', 'NH', 'ME'], percentage: 78 },
                                { preference: 'Seasonal Items', regions: ['MI', 'WI', 'MN'], percentage: 72 },
                                { preference: 'Bulk Purchasing', regions: ['TX', 'OK', 'NM'], percentage: 64 }
                              ].map((item, index) => (
                                <div key={index} className="p-3 border rounded-lg">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium">{item.preference}</span>
                                    <span className="font-bold text-blue-600">{item.percentage}%</span>
                                  </div>
                                  <div className="flex gap-1">
                                    {item.regions.map((region, regionIndex) => (
                                      <Badge key={regionIndex} variant="secondary" className="text-xs">
                                        {region}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="freshness">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Freshness Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                          <Card className="p-4 bg-green-50">
                            <h4 className="font-semibold text-green-800">Fresh Content</h4>
                            <p className="text-2xl font-bold text-green-600">78%</p>
                            <p className="text-xs text-green-600 mt-1">{'< 30 days old'}</p>
                          </Card>
                          <Card className="p-4 bg-yellow-50">
                            <h4 className="font-semibold text-yellow-800">Aging Content</h4>
                            <p className="text-2xl font-bold text-yellow-600">18%</p>
                            <p className="text-xs text-yellow-600 mt-1">30-90 days old</p>
                          </Card>
                          <Card className="p-4 bg-red-50">
                            <h4 className="font-semibold text-red-800">Stale Content</h4>
                            <p className="text-2xl font-bold text-red-600">4%</p>
                            <p className="text-xs text-red-600 mt-1">&gt; 90 days old</p>
                          </Card>
                        </div>
                        <div className="space-y-4">
                          <h4 className="font-semibold">Content Refresh Recommendations:</h4>
                          {[
                            { content: 'Seasonal Produce Guide 2023', age: '120 days', priority: 'High', action: 'Update with 2024 data' },
                            { content: 'Organic Certification Process', age: '85 days', priority: 'Medium', action: 'Verify current requirements' },
                            { content: 'Local Farmer Profiles', age: '95 days', priority: 'High', action: 'Add new farmer spotlights' },
                            { content: 'Recipe Collection - Summer', age: '200 days', priority: 'Low', action: 'Archive or refresh for next season' }
                          ].map((item, index) => (
                            <Card key={index} className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium">{item.content}</h5>
                                  <p className="text-sm text-muted-foreground">Last updated: {item.age} ago</p>
                                </div>
                                <div className="text-right">
                                  <Badge variant={item.priority === 'High' ? 'destructive' : item.priority === 'Medium' ? 'default' : 'secondary'}>
                                    {item.priority}
                                  </Badge>
                                  <p className="text-sm text-blue-600 mt-1">{item.action}</p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent id="insights-content-content" value="content">
              {/* Sub-navigation for Content */}
              <Tabs defaultValue="engagement" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="ai-visibility">AI Visibility</TabsTrigger>
                  <TabsTrigger value="semantic">Semantic</TabsTrigger>
                  <TabsTrigger value="geographic">Geographic</TabsTrigger>
                  <TabsTrigger value="freshness">Freshness</TabsTrigger>
                </TabsList>

                <TabsContent value="engagement">
              <div className="space-y-6">
                {/* Content Performance Overview */}
                <Card id="insights-content-performance-card">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Eye className="h-6 w-6 text-indigo-600" />
                      <CardTitle>Content Performance Analytics</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent id="insights-content-performance-content">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-indigo-50">
                        <h4 className="font-semibold text-indigo-800">Page Views</h4>
                        <p className="text-2xl font-bold text-indigo-600">324K</p>
                        <p className="text-xs text-indigo-600 mt-1">↑ 18% vs last month</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Avg Time on Page</h4>
                        <p className="text-2xl font-bold text-green-600">3m 24s</p>
                        <p className="text-xs text-green-600 mt-1">↑ 15% improvement</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Content Engagement</h4>
                        <p className="text-2xl font-bold text-blue-600">82%</p>
                        <p className="text-xs text-blue-600 mt-1">High engagement</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Social Shares</h4>
                        <p className="text-2xl font-bold text-purple-600">12.4K</p>
                        <p className="text-xs text-purple-600 mt-1">↑ 25% increase</p>
                      </Card>
                    </div>

                    {/* Top Performing Content */}
                    <div>
                      <h4 className="font-semibold mb-3">Top Performing Content:</h4>
                      <div className="space-y-3">
                        {[
                          { title: 'Fresh Produce Seasonal Guide', views: 45620, engagement: '4m 12s', shares: 2840, ctr: '8.4%' },
                          { title: 'Organic Farming Best Practices', views: 38140, engagement: '5m 38s', shares: 1920, ctr: '6.8%' },
                          { title: 'Nutrition Facts & Health Benefits', views: 32580, engagement: '3m 45s', shares: 1540, ctr: '7.2%' },
                          { title: 'Recipe Collection: Farm to Table', views: 28730, engagement: '4m 56s', shares: 2180, ctr: '9.1%' },
                          { title: 'Sustainable Agriculture Practices', views: 24100, engagement: '3m 22s', shares: 1380, ctr: '5.9%' }
                        ].map((content, index) => (
                          <Card key={index} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="font-medium">{content.title}</h5>
                                <p className="text-sm text-muted-foreground">{content.views.toLocaleString()} views</p>
                              </div>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="text-center">
                                  <p className="font-semibold">{content.engagement}</p>
                                  <p className="text-muted-foreground">Avg Time</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-semibold">{content.shares.toLocaleString()}</p>
                                  <p className="text-muted-foreground">Shares</p>
                                </div>
                                <div className="text-center">
                                  <p className="font-semibold text-green-600">{content.ctr}</p>
                                  <p className="text-muted-foreground">CTR</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Content Categories Performance */}
                <Card id="insights-content-categories-card">
                  <CardHeader>
                    <CardTitle>Content Categories Performance</CardTitle>
                  </CardHeader>
                  <CardContent id="insights-content-categories-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {[
                        { category: 'Educational Articles', performance: 92, engagement: 'High', growth: '+22%' },
                        { category: 'Product Guides', performance: 88, engagement: 'High', growth: '+18%' },
                        { category: 'Recipe Collections', performance: 85, engagement: 'Medium', growth: '+15%' },
                        { category: 'Industry News', performance: 78, engagement: 'Medium', growth: '+8%' },
                        { category: 'Event Updates', performance: 72, engagement: 'Medium', growth: '+5%' },
                        { category: 'Member Spotlights', performance: 69, engagement: 'Low', growth: '+12%' }
                      ].map((cat, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium">{cat.category}</h5>
                            <span className="text-lg font-bold">{cat.performance}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className={`h-2 rounded-full ${
                                cat.performance >= 90 ? 'bg-green-500' :
                                cat.performance >= 80 ? 'bg-blue-500' :
                                cat.performance >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${cat.performance}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className={`${
                              cat.engagement === 'High' ? 'text-green-600' :
                              cat.engagement === 'Medium' ? 'text-yellow-600' : 'text-red-600'
                            }`}>{cat.engagement} Engagement</span>
                            <span className="text-blue-600">{cat.growth}</span>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* SEO Performance */}
                <Card id="insights-seo-performance-card">
                  <CardHeader>
                    <CardTitle>SEO Performance Metrics</CardTitle>
                  </CardHeader>
                  <CardContent id="insights-seo-performance-content">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Keyword Rankings</h4>
                        <div className="space-y-3">
                          {[
                            { keyword: 'fresh produce', position: 3, change: '+2', volume: 'High' },
                            { keyword: 'organic vegetables', position: 7, change: '+1', volume: 'Medium' },
                            { keyword: 'local farmers market', position: 12, change: '-1', volume: 'Medium' },
                            { keyword: 'sustainable agriculture', position: 8, change: '+3', volume: 'Low' },
                            { keyword: 'nutrition facts', position: 15, change: '+5', volume: 'High' }
                          ].map((kw, index) => (
                            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                              <div>
                                <p className="font-medium">{kw.keyword}</p>
                                <p className="text-sm text-muted-foreground">{kw.volume} volume</p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold">#{kw.position}</p>
                                <p className={`text-sm ${kw.change.startsWith('+') ? 'text-green-600' : kw.change.startsWith('-') ? 'text-red-600' : 'text-gray-600'}`}>
                                  {kw.change}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Technical SEO Health</h4>
                        <div className="space-y-4">
                          {[
                            { metric: 'Page Load Speed', score: 92, status: 'Excellent' },
                            { metric: 'Mobile Friendliness', score: 89, status: 'Good' },
                            { metric: 'Core Web Vitals', score: 85, status: 'Good' },
                            { metric: 'Internal Linking', score: 78, status: 'Needs Work' },
                            { metric: 'Meta Descriptions', score: 94, status: 'Excellent' }
                          ].map((metric, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm">{metric.metric}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{metric.score}%</span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  metric.status === 'Excellent' ? 'bg-green-100 text-green-800' :
                                  metric.status === 'Good' ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {metric.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
                </TabsContent>

                {/* Copy all the other sub-tabs from OSA but with content-specific data */}
                <TabsContent value="topics">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Topics Deep Dive</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Content-specific topic analysis would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="popular">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Popular Content Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Popular content analysis would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="ai-visibility">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Content Visibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">AI visibility analysis would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="semantic">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Semantic Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Content semantic analysis would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="geographic">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Geographic Performance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Geographic content performance would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="freshness">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Content Freshness Metrics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Content freshness metrics would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent id="insights-audiences-content" value="audiences">
              {/* Sub-navigation for Audiences */}
              <Tabs defaultValue="engagement" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="ai-visibility">AI Visibility</TabsTrigger>
                  <TabsTrigger value="semantic">Semantic</TabsTrigger>
                  <TabsTrigger value="geographic">Geographic</TabsTrigger>
                  <TabsTrigger value="freshness">Freshness</TabsTrigger>
                </TabsList>

                <TabsContent value="engagement">
              <div className="space-y-6">
                {/* Audience Segmentation Overview - Wide Row */}
                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Users className="h-6 w-6 text-blue-600" />
                      <CardTitle>Audience Segmentation Overview</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Total Audiences</h4>
                        <p className="text-2xl font-bold text-blue-600">47</p>
                        <p className="text-xs text-blue-600 mt-1">Active segments</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Engagement Rate</h4>
                        <p className="text-2xl font-bold text-green-600">68.4%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 12% vs baseline</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Conversion Rate</h4>
                        <p className="text-2xl font-bold text-purple-600">4.2%</p>
                        <p className="text-xs text-purple-600 mt-1">↑ 0.8% improvement</p>
                      </Card>
                      <Card className="p-4 bg-orange-50">
                        <h4 className="font-semibold text-orange-800">Revenue per User</h4>
                        <p className="text-2xl font-bold text-orange-600">$142</p>
                        <p className="text-xs text-orange-600 mt-1">Average LTV</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {[
                        {
                          name: 'Health-Conscious Shoppers',
                          size: 8420,
                          engagement: 78,
                          conversion: 5.2,
                          characteristics: ['Organic preference', 'Nutrition focused', 'Premium willing']
                        },
                        {
                          name: 'Budget-Conscious Families',
                          size: 12150,
                          engagement: 65,
                          conversion: 3.8,
                          characteristics: ['Bulk buying', 'Price sensitive', 'Seasonal shoppers']
                        },
                        {
                          name: 'Gourmet Enthusiasts',
                          size: 3890,
                          engagement: 84,
                          conversion: 7.1,
                          characteristics: ['Premium products', 'Recipe interest', 'Brand loyal']
                        }
                      ].map((audience, index) => (
                        <Card key={index} className="p-4">
                          <h5 className="font-semibold mb-2">{audience.name}</h5>
                          <p className="text-sm text-muted-foreground mb-3">{audience.size.toLocaleString()} members</p>

                          <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-sm">
                              <span>Engagement</span>
                              <span className="font-medium">{audience.engagement}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${audience.engagement}%` }}></div>
                            </div>

                            <div className="flex justify-between text-sm">
                              <span>Conversion</span>
                              <span className="font-medium">{audience.conversion}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${audience.conversion * 10}%` }}></div>
                            </div>
                          </div>

                          <div>
                            <h6 className="text-xs font-medium text-muted-foreground mb-2">Key Characteristics:</h6>
                            <div className="space-y-1">
                              {audience.characteristics.map((char, charIndex) => (
                                <div key={charIndex} className="text-xs bg-gray-100 px-2 py-1 rounded">{char}</div>
                              ))}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Behavioral Insights */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Brain className="h-6 w-6 text-purple-600" />
                      <CardTitle>Behavioral Insights</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Shopping Patterns:</h4>
                        <div className="space-y-3">
                          {[
                            { pattern: 'Peak Shopping Times', insight: 'Tuesday-Thursday 10AM-2PM show highest engagement' },
                            { pattern: 'Seasonal Trends', insight: 'Q2 shows 35% uplift in organic produce interest' },
                            { pattern: 'Device Preferences', insight: '68% mobile browsing, 45% mobile purchasing' },
                            { pattern: 'Content Interaction', insight: 'Educational content drives 3x more engagement' }
                          ].map((item, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <h5 className="font-medium text-sm">{item.pattern}</h5>
                              <p className="text-xs text-muted-foreground mt-1">{item.insight}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Engagement Metrics:</h4>
                        <div className="space-y-4">
                          {[
                            { metric: 'Email Open Rate', value: 28.4, benchmark: 22.1 },
                            { metric: 'Social Media CTR', value: 3.7, benchmark: 2.9 },
                            { metric: 'Newsletter Engagement', value: 45.2, benchmark: 38.7 },
                            { metric: 'Event Attendance', value: 67.8, benchmark: 52.3 }
                          ].map((item, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">{item.metric}</span>
                                <div className="text-right">
                                  <span className="font-medium">{item.value}%</span>
                                  <span className="text-xs text-muted-foreground ml-2">(vs {item.benchmark}%)</span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(item.value / 100) * 100}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audience Journey Analytics */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Target className="h-6 w-6 text-green-600" />
                      <CardTitle>Audience Journey Analytics</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-semibold mb-4">Customer Journey Stages</h4>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          {[
                            { stage: 'Awareness', count: 45200, conversion: 100, dropoff: 0 },
                            { stage: 'Interest', count: 28640, conversion: 63.4, dropoff: 36.6 },
                            { stage: 'Consideration', count: 12890, conversion: 28.5, dropoff: 55.0 },
                            { stage: 'Purchase', count: 3870, conversion: 8.6, dropoff: 70.0 },
                            { stage: 'Loyalty', count: 1940, conversion: 4.3, dropoff: 50.1 }
                          ].map((stage, index) => (
                            <Card key={index} className="p-4 text-center">
                              <h5 className="font-semibold">{stage.stage}</h5>
                              <p className="text-lg font-bold text-blue-600">{stage.count.toLocaleString()}</p>
                              <p className="text-sm text-muted-foreground">{stage.conversion}% of total</p>
                              {stage.dropoff > 0 && (
                                <p className="text-xs text-red-600 mt-1">-{stage.dropoff}% drop</p>
                              )}
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
                </TabsContent>

                {/* Other audience sub-tabs */}
                <TabsContent value="topics">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Audience Topics Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Audience-specific topic analysis would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="popular">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Popular Audience Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Popular audience content would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="ai-visibility">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>AI Audience Visibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">AI audience visibility would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="semantic">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Audience Semantic Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Audience semantic analysis would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="geographic">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Audience Geographic Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Audience geographic data would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="freshness">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Audience Data Freshness</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Audience data freshness would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent id="insights-cx-content" value="cx">
              {/* Sub-navigation for CX */}
              <Tabs defaultValue="engagement" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="ai-visibility">AI Visibility</TabsTrigger>
                  <TabsTrigger value="semantic">Semantic</TabsTrigger>
                  <TabsTrigger value="geographic">Geographic</TabsTrigger>
                  <TabsTrigger value="freshness">Freshness</TabsTrigger>
                </TabsList>

                <TabsContent value="engagement">
              <div className="space-y-6">
                {/* Customer Experience Overview - Wide Row */}
                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Heart className="h-6 w-6 text-red-600" />
                      <CardTitle>Customer Experience Overview</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-red-50">
                        <h4 className="font-semibold text-red-800">CX Score</h4>
                        <p className="text-2xl font-bold text-red-600">8.2</p>
                        <p className="text-xs text-red-600 mt-1">↑ 0.5 vs last quarter</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">Satisfaction Rate</h4>
                        <p className="text-2xl font-bold text-green-600">87.3%</p>
                        <p className="text-xs text-green-600 mt-1">↑ 4% improvement</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Support Response</h4>
                        <p className="text-2xl font-bold text-blue-600">2.1h</p>
                        <p className="text-xs text-blue-600 mt-1">Average response time</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">Retention Rate</h4>
                        <p className="text-2xl font-bold text-purple-600">74.2%</p>
                        <p className="text-xs text-purple-600 mt-1">↑ 8% vs last year</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Experience Touchpoints:</h4>
                        <div className="space-y-3">
                          {[
                            { touchpoint: 'Website Navigation', rating: 8.7, feedback: '92% find navigation intuitive' },
                            { touchpoint: 'Product Information', rating: 8.2, feedback: '89% rate product details helpful' },
                            { touchpoint: 'Checkout Process', rating: 7.9, feedback: '85% complete checkout smoothly' },
                            { touchpoint: 'Customer Support', rating: 9.1, feedback: '94% satisfied with support quality' },
                            { touchpoint: 'Delivery Experience', rating: 8.4, feedback: '91% satisfied with delivery' }
                          ].map((item, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium">{item.touchpoint}</h5>
                                <span className="text-lg font-bold text-blue-600">{item.rating}/10</span>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.feedback}</p>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${item.rating * 10}%` }}></div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Customer Feedback Analysis:</h4>
                        <div className="space-y-4">
                          {[
                            { category: 'Positive Feedback', percentage: 78.3, trend: '+12%', color: 'green' },
                            { category: 'Neutral Feedback', percentage: 16.2, trend: '-5%', color: 'gray' },
                            { category: 'Negative Feedback', percentage: 5.5, trend: '-7%', color: 'red' }
                          ].map((feedback, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{feedback.category}</span>
                                <div className="text-right">
                                  <span className="font-bold">{feedback.percentage}%</span>
                                  <span className={`text-sm ml-2 ${feedback.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                                    {feedback.trend}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div className={`h-2 rounded-full ${
                                  feedback.color === 'green' ? 'bg-green-500' :
                                  feedback.color === 'gray' ? 'bg-gray-500' : 'bg-red-500'
                                }`} style={{ width: `${feedback.percentage}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6">
                          <h5 className="font-semibold mb-3">Top Issues to Address:</h5>
                          <div className="space-y-2">
                            {[
                              'Mobile checkout optimization needed',
                              'Product search could be more intuitive',
                              'Delivery tracking improvements',
                              'Email response time enhancement'
                            ].map((issue, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                                <span>{issue}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Net Promoter Score (NPS) Analytics */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Award className="h-6 w-6 text-yellow-600" />
                      <CardTitle>Net Promoter Score (NPS) Analytics</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="p-4 text-center">
                        <h4 className="font-semibold mb-2">Current NPS</h4>
                        <div className="text-4xl font-bold text-green-600 mb-2">+47</div>
                        <p className="text-sm text-muted-foreground">↑ 8 points vs last quarter</p>
                        <div className="text-xs text-green-600 mt-1">Excellent score</div>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">Score Distribution</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Promoters (9-10)</span>
                            <span className="font-medium text-green-600">62%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Passives (7-8)</span>
                            <span className="font-medium text-yellow-600">23%</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Detractors (0-6)</span>
                            <span className="font-medium text-red-600">15%</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">Industry Comparison</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Your Score</span>
                            <span className="font-medium">+47</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Industry Average</span>
                            <span className="font-medium">+31</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Top Quartile</span>
                            <span className="font-medium">+52</span>
                          </div>
                        </div>
                        <div className="text-xs text-green-600 mt-2">Above industry average</div>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                {/* Customer Journey Pain Points */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Activity className="h-6 w-6 text-orange-600" />
                      <CardTitle>Customer Journey Pain Points</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          stage: 'Discovery',
                          painPoints: ['Product search could be more intuitive', 'Category navigation needs simplification'],
                          impact: 'Medium',
                          priority: 'P1'
                        },
                        {
                          stage: 'Consideration',
                          painPoints: ['Product comparison feature missing', 'Limited customer reviews available'],
                          impact: 'High',
                          priority: 'P0'
                        },
                        {
                          stage: 'Purchase',
                          painPoints: ['Mobile checkout flow too complex', 'Payment options could be expanded'],
                          impact: 'High',
                          priority: 'P0'
                        },
                        {
                          stage: 'Post-Purchase',
                          painPoints: ['Order tracking could be more detailed', 'Return process needs clarification'],
                          impact: 'Medium',
                          priority: 'P1'
                        }
                      ].map((stage, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-semibold">{stage.stage} Stage</h5>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                stage.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {stage.impact} Impact
                              </span>
                              <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                                stage.priority === 'P0' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'
                              }`}>
                                {stage.priority}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {stage.painPoints.map((point, pointIndex) => (
                              <div key={pointIndex} className="flex items-start gap-2 text-sm">
                                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></div>
                                <span>{point}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Wins & Low-Effort Improvements */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Zap className="h-6 w-6 text-yellow-600" />
                      <CardTitle>Quick Wins & Low-Effort Improvements</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Immediate Implementation (0-2 weeks):</h4>
                        <div className="space-y-3">
                          {[
                            {
                              improvement: 'Add progress indicators to checkout',
                              effort: 'Low',
                              impact: 'High',
                              description: 'Visual progress bar to reduce abandonment anxiety'
                            },
                            {
                              improvement: 'Optimize page load times',
                              effort: 'Medium',
                              impact: 'High',
                              description: 'Compress images and enable browser caching'
                            },
                            {
                              improvement: 'Improve error messages',
                              effort: 'Low',
                              impact: 'Medium',
                              description: 'Clear, actionable feedback for form errors'
                            },
                            {
                              improvement: 'Add search suggestions',
                              effort: 'Medium',
                              impact: 'Medium',
                              description: 'Auto-complete functionality for product search'
                            }
                          ].map((item, index) => (
                            <Card key={index} className="p-3 border-l-4 border-l-yellow-500">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium">{item.improvement}</h5>
                                <div className="flex gap-2">
                                  <Badge variant={item.effort === 'Low' ? 'secondary' : 'default'} className="text-xs">
                                    {item.effort} Effort
                                  </Badge>
                                  <Badge variant={item.impact === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                                    {item.impact} Impact
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </Card>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Short-term Wins (2-4 weeks):</h4>
                        <div className="space-y-3">
                          {[
                            {
                              improvement: 'Mobile checkout optimization',
                              effort: 'Medium',
                              impact: 'High',
                              description: 'Streamline mobile payment flow'
                            },
                            {
                              improvement: 'Customer feedback widget',
                              effort: 'Low',
                              impact: 'Medium',
                              description: 'Easy-access feedback collection'
                            },
                            {
                              improvement: 'Live chat integration',
                              effort: 'Medium',
                              impact: 'High',
                              description: 'Real-time customer support during shopping'
                            },
                            {
                              improvement: 'Product comparison feature',
                              effort: 'High',
                              impact: 'Medium',
                              description: 'Side-by-side product comparison tool'
                            }
                          ].map((item, index) => (
                            <Card key={index} className="p-3 border-l-4 border-l-blue-500">
                              <div className="flex items-start justify-between mb-2">
                                <h5 className="font-medium">{item.improvement}</h5>
                                <div className="flex gap-2">
                                  <Badge variant={item.effort === 'Low' ? 'secondary' : item.effort === 'Medium' ? 'default' : 'destructive'} className="text-xs">
                                    {item.effort} Effort
                                  </Badge>
                                  <Badge variant={item.impact === 'High' ? 'destructive' : 'secondary'} className="text-xs">
                                    {item.impact} Impact
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">{item.description}</p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Priority UX Recommendations */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Target className="h-6 w-6 text-blue-600" />
                      <CardTitle>Priority UX Recommendations</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <Card className="p-4 bg-red-50">
                          <h4 className="font-semibold text-red-800">Critical Issues</h4>
                          <p className="text-2xl font-bold text-red-600">3</p>
                          <p className="text-xs text-red-600 mt-1">Blocking conversion</p>
                        </Card>
                        <Card className="p-4 bg-orange-50">
                          <h4 className="font-semibold text-orange-800">High Priority</h4>
                          <p className="text-2xl font-bold text-orange-600">7</p>
                          <p className="text-xs text-orange-600 mt-1">Impacting experience</p>
                        </Card>
                        <Card className="p-4 bg-yellow-50">
                          <h4 className="font-semibold text-yellow-800">Medium Priority</h4>
                          <p className="text-2xl font-bold text-yellow-600">12</p>
                          <p className="text-xs text-yellow-600 mt-1">Enhancement opportunities</p>
                        </Card>
                        <Card className="p-4 bg-green-50">
                          <h4 className="font-semibold text-green-800">Potential ROI</h4>
                          <p className="text-2xl font-bold text-green-600">+28%</p>
                          <p className="text-xs text-green-600 mt-1">Conversion improvement</p>
                        </Card>
                      </div>

                      <div className="space-y-4">
                        <h4 className="font-semibold">Prioritized UX Improvements by Impact:</h4>
                        {[
                          {
                            priority: 'P0 - Critical',
                            title: 'Mobile Checkout Flow Redesign',
                            description: 'Current mobile checkout has 67% abandonment rate - requires immediate attention',
                            impact: 'High',
                            effort: '3-4 weeks',
                            roi: '+18% conversion',
                            status: 'critical'
                          },
                          {
                            priority: 'P0 - Critical',
                            title: 'Search Function Enhancement',
                            description: 'Users struggle to find products - 45% exit after failed search attempts',
                            impact: 'High',
                            effort: '2-3 weeks',
                            roi: '+12% engagement',
                            status: 'critical'
                          },
                          {
                            priority: 'P1 - High',
                            title: 'Navigation Menu Simplification',
                            description: 'Complex category structure confuses users - flatten hierarchy',
                            impact: 'Medium',
                            effort: '1-2 weeks',
                            roi: '+8% task completion',
                            status: 'high'
                          },
                          {
                            priority: 'P1 - High',
                            title: 'Product Information Architecture',
                            description: 'Key product details buried below fold - restructure layout',
                            impact: 'Medium',
                            effort: '2-3 weeks',
                            roi: '+15% product views',
                            status: 'high'
                          },
                          {
                            priority: 'P2 - Medium',
                            title: 'Personalized Recommendations Engine',
                            description: 'Implement AI-driven product suggestions based on behavior',
                            impact: 'High',
                            effort: '4-6 weeks',
                            roi: '+22% cross-sell',
                            status: 'medium'
                          }
                        ].map((rec, index) => (
                          <Card key={index} className={`p-4 border-l-4 ${
                            rec.status === 'critical' ? 'border-l-red-600' :
                            rec.status === 'high' ? 'border-l-orange-600' : 'border-l-yellow-600'
                          }`}>
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge variant={
                                    rec.status === 'critical' ? 'destructive' :
                                    rec.status === 'high' ? 'default' : 'secondary'
                                  }>
                                    {rec.priority}
                                  </Badge>
                                  <h5 className="font-semibold">{rec.title}</h5>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="font-medium text-blue-600">Effort:</span>
                                    <span className="ml-1">{rec.effort}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-green-600">ROI:</span>
                                    <span className="ml-1">{rec.roi}</span>
                                  </div>
                                  <div>
                                    <span className="font-medium text-purple-600">Impact:</span>
                                    <span className="ml-1">{rec.impact}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
                </TabsContent>

                {/* Other CX sub-tabs */}
                <TabsContent value="topics">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>CX Topics Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">CX-specific topic analysis would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="popular">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Popular CX Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Popular CX content would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="ai-visibility">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>CX AI Visibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">CX AI visibility would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="semantic">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>CX Semantic Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">CX semantic analysis would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="geographic">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>CX Geographic Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">CX geographic data would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="freshness">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>CX Data Freshness</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">CX data freshness would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent id="insights-other-content" value="other">
              {/* Sub-navigation for Other */}
              <Tabs defaultValue="engagement" className="space-y-6">
                <TabsList className="grid w-full grid-cols-7">
                  <TabsTrigger value="engagement">Engagement</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                  <TabsTrigger value="popular">Popular</TabsTrigger>
                  <TabsTrigger value="ai-visibility">AI Visibility</TabsTrigger>
                  <TabsTrigger value="semantic">Semantic</TabsTrigger>
                  <TabsTrigger value="geographic">Geographic</TabsTrigger>
                  <TabsTrigger value="freshness">Freshness</TabsTrigger>
                </TabsList>

                <TabsContent value="engagement">
              <div className="space-y-6">
                {/* Platform Integration Insights - Wide Row */}
                <Card className="col-span-full">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Settings className="h-6 w-6 text-gray-600" />
                      <CardTitle>Platform Integration Insights</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <Card className="p-4 bg-gray-50">
                        <h4 className="font-semibold text-gray-800">Active Integrations</h4>
                        <p className="text-2xl font-bold text-gray-600">12</p>
                        <p className="text-xs text-gray-600 mt-1">Connected platforms</p>
                      </Card>
                      <Card className="p-4 bg-blue-50">
                        <h4 className="font-semibold text-blue-800">Data Sync Rate</h4>
                        <p className="text-2xl font-bold text-blue-600">98.7%</p>
                        <p className="text-xs text-blue-600 mt-1">↑ 2% improvement</p>
                      </Card>
                      <Card className="p-4 bg-green-50">
                        <h4 className="font-semibold text-green-800">API Response Time</h4>
                        <p className="text-2xl font-bold text-green-600">145ms</p>
                        <p className="text-xs text-green-600 mt-1">Average response</p>
                      </Card>
                      <Card className="p-4 bg-purple-50">
                        <h4 className="font-semibold text-purple-800">System Uptime</h4>
                        <p className="text-2xl font-bold text-purple-600">99.9%</p>
                        <p className="text-xs text-purple-600 mt-1">Last 30 days</p>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Integration Status:</h4>
                        <div className="space-y-3">
                          {[
                            { platform: 'Optimizely Web Experimentation', status: 'Active', health: 98, lastSync: '2 min ago' },
                            { platform: 'Optimizely Data Platform', status: 'Active', health: 96, lastSync: '1 min ago' },
                            { platform: 'Content Management Platform', status: 'Active', health: 94, lastSync: '5 min ago' },
                            { platform: 'Email Marketing Platform', status: 'Active', health: 97, lastSync: '3 min ago' },
                            { platform: 'Analytics Platform', status: 'Active', health: 99, lastSync: '30 sec ago' }
                          ].map((integration, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div>
                                  <h5 className="font-medium text-sm">{integration.platform}</h5>
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

                      <div>
                        <h4 className="font-semibold mb-3">Data Flow Metrics:</h4>
                        <div className="space-y-4">
                          {[
                            { metric: 'Events Processed Today', value: '2.4M', change: '+12%' },
                            { metric: 'Data Points Collected', value: '847K', change: '+8%' },
                            { metric: 'Real-time Triggers', value: '1,240', change: '+15%' },
                            { metric: 'Automated Actions', value: '89', change: '+22%' }
                          ].map((metric, index) => (
                            <div key={index} className="p-3 border rounded-lg">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-sm">{metric.metric}</span>
                                <div className="text-right">
                                  <span className="font-bold">{metric.value}</span>
                                  <span className="text-sm text-green-600 ml-2">{metric.change}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Optimization Insights */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Zap className="h-6 w-6 text-yellow-600" />
                      <CardTitle>Performance Optimization Insights</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-3">Site Performance Metrics:</h4>
                        <div className="space-y-4">
                          {[
                            { metric: 'Page Load Speed', score: 92, benchmark: 85, status: 'Excellent' },
                            { metric: 'First Contentful Paint', score: 89, benchmark: 80, status: 'Good' },
                            { metric: 'Cumulative Layout Shift', score: 95, benchmark: 90, status: 'Excellent' },
                            { metric: 'Time to Interactive', score: 87, benchmark: 82, status: 'Good' }
                          ].map((perf, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm">{perf.metric}</span>
                                <div className="text-right">
                                  <span className="font-medium">{perf.score}%</span>
                                  <span className={`text-xs ml-2 px-2 py-1 rounded-full ${
                                    perf.status === 'Excellent' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {perf.status}
                                  </span>
                                </div>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${perf.score}%` }}></div>
                              </div>
                              <div className="text-xs text-muted-foreground">Benchmark: {perf.benchmark}%</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-3">Optimization Opportunities:</h4>
                        <div className="space-y-3">
                          {[
                            { opportunity: 'Image Compression', impact: 'High', effort: 'Low', saving: '1.2s load time' },
                            { opportunity: 'CDN Implementation', impact: 'Medium', effort: 'Medium', saving: '0.8s load time' },
                            { opportunity: 'Code Minification', impact: 'Medium', effort: 'Low', saving: '0.5s load time' },
                            { opportunity: 'Database Optimization', impact: 'High', effort: 'High', saving: '2.1s response time' }
                          ].map((opp, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-medium text-sm">{opp.opportunity}</h5>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  opp.impact === 'High' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {opp.impact} Impact
                                </span>
                              </div>
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Effort: {opp.effort}</span>
                                <span className="font-medium text-green-600">{opp.saving}</span>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security and Compliance Insights */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <PieChart className="h-6 w-6 text-indigo-600" />
                      <CardTitle>Security & Compliance Insights</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="p-4 text-center">
                        <h4 className="font-semibold mb-2">Security Score</h4>
                        <div className="text-3xl font-bold text-green-600 mb-2">94%</div>
                        <p className="text-sm text-muted-foreground">All critical checks passed</p>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">Compliance Status</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>GDPR</span>
                            <span className="text-green-600">✓ Compliant</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>CCPA</span>
                            <span className="text-green-600">✓ Compliant</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>SOC 2</span>
                            <span className="text-green-600">✓ Compliant</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>ISO 27001</span>
                            <span className="text-yellow-600">⚠ Pending</span>
                          </div>
                        </div>
                      </Card>

                      <Card className="p-4">
                        <h4 className="font-semibold mb-3">Recent Security Actions</h4>
                        <div className="space-y-2 text-sm">
                          <div>SSL certificate renewed</div>
                          <div>Security headers updated</div>
                          <div>Vulnerability scan completed</div>
                          <div>Access logs reviewed</div>
                        </div>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </div>
                </TabsContent>

                {/* Other platform sub-tabs */}
                <TabsContent value="topics">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Platform Topics Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Platform-specific topic analysis would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="popular">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Popular Platform Content</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Popular platform content would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="ai-visibility">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Platform AI Visibility</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Platform AI visibility would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="semantic">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Platform Semantic Analysis</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Platform semantic analysis would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="geographic">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Platform Geographic Data</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Platform geographic data would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="freshness">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Platform Data Freshness</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground">Platform data freshness would go here</p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>

          {/* Engine Actions & Summary */}
          <EngineActionsSummary areaId="analytics-insights" subSectionId="osa" />
        </div>
        </main>
      </div>
    </div>
  );
}