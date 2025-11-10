'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  MessageSquare,
  Sparkles,
  Users,
  Target,
  Zap,
  Lightbulb,
  TrendingUp,
  BarChart3,
  PieChart,
  Award
} from 'lucide-react';
import { OSAWorkflowOutput } from '@/lib/types/maturity';
import Link from 'next/link';
import EngineActionsSummary from '@/components/EngineActionsSummary';

interface TTYDProps {
  workflowResult?: OSAWorkflowOutput;
}

export default function TalkToYourData({ workflowResult }: TTYDProps) {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleTTYDQuestionSubmit = async () => {
    if (!question.trim()) return;

    // Show the "Coming Soon" modal instead of processing
    setShowModal(true);
  };

  const handlePrebuiltPrompt = (prompt: string) => {
    setQuestion(prompt);
  };

  const prebuiltPrompts = [
    {
      category: "Content",
      icon: Target,
      color: "bg-blue-500",
      prompt: "What are the key content optimization opportunities based on my data?"
    },
    {
      category: "Audiences",
      icon: Users,
      color: "bg-green-500",
      prompt: "Which audience segments show the highest engagement and conversion potential?"
    },
    {
      category: "Quick Wins",
      icon: Zap,
      color: "bg-purple-500",
      prompt: "What are the top 3 quick wins I can implement this week to improve performance?"
    }
  ];

  // Sample "Did You Know" insights based on typical OPAL results
  const didYouKnowInsights = [
    {
      icon: TrendingUp,
      title: "Personalization Impact",
      insight: "Companies with advanced personalization see 20% increase in sales on average"
    },
    {
      icon: BarChart3,
      title: "Content Performance",
      insight: "Your top-performing content types drive 3x more engagement than average"
    },
    {
      icon: PieChart,
      title: "Audience Segmentation",
      insight: "Proper audience segmentation can improve conversion rates by up to 40%"
    },
    {
      icon: Award,
      title: "Testing Frequency",
      insight: "Organizations running 50+ tests annually grow 30% faster"
    },
    {
      icon: Sparkles,
      title: "AI Integration",
      insight: "AI-powered marketing tools can reduce manual work by 60%"
    },
    {
      icon: Lightbulb,
      title: "Data Maturity",
      insight: "Companies with mature data practices are 23x more likely to acquire customers"
    }
  ];

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">Talk To Your Data</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Ask questions about your personalization strategy, content performance, and optimization opportunities.
          Get AI-powered insights from your data.
        </p>
      </div>

      {/* Main Question Input */}
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <span>Ask Your Question</span>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800 text-xs font-medium">
              ALPHA
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ask me anything about your data, strategy, or optimization opportunities..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="min-h-[120px] text-lg"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleTTYDQuestionSubmit}
              disabled={!question.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Ask Question
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Prebuilt Prompts */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Popular Questions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {prebuiltPrompts.map((prompt, index) => (
            <Card
              key={index}
              className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-gray-300"
              onClick={() => handlePrebuiltPrompt(prompt.prompt)}
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${prompt.color}`}>
                    <prompt.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <Badge variant="secondary" className="mb-2">
                      {prompt.category}
                    </Badge>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {prompt.prompt}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Did You Know Section */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          <span>Did You Know?</span>
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {didYouKnowInsights.map((insight, index) => (
            <Card key={index} className="bg-gradient-to-br from-slate-50 to-white">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <insight.icon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-1">{insight.title}</h3>
                    <p className="text-sm text-gray-600">{insight.insight}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Engine Actions & Summary */}
        <EngineActionsSummary areaId="analytics-insights" subSectionId="osa" />
      </div>

      {/* Coming Soon Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Coming Soon</DialogTitle>
            <DialogDescription className="text-center py-4">
              The Talk To Your Data feature is currently in development and will be available soon!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col space-y-2 sm:space-y-0 sm:space-x-2">
            <Link href="/engine/results/strategy" className="w-full">
              <Button
                variant="default"
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setShowModal(false)}
              >
                <Target className="mr-2 h-4 w-4" />
                View Strategy Plans
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => setShowModal(false)}
              className="w-full"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}