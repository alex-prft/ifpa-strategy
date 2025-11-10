'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  ChefHat,
  Database,
  Target,
  BookOpen,
  Palette,
  MessageSquare,
  CheckCircle,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HowItWorksPage() {
  const cookingSteps = [
    {
      step: "01",
      title: "Gather the Data and Objectives",
      subtitle: "",
      icon: <Database className="h-8 w-8" />,
      description: "automatically collect all your Optimzely DXP data in one place",
      ingredients: [
        { name: "Data & Insights", source: "from Optimizely and other sources", service: "Ingestion & Orchestration Service" },
        { name: "Business Context", source: "objectives and constraints", service: "Strategy Intake Service" },
        { name: "Preferences & Policies", source: "budget, risk tolerance, maturity", service: "Preferences & Policy Service" }
      ],
      color: "from-blue-500/10 to-blue-500/5 border-blue-200",
      iconColor: "text-blue-600 bg-blue-100"
    },
    {
      step: "02",
      title: "Use Proven Strategies",
      subtitle: "",
      icon: <BookOpen className="h-8 w-8" />,
      description: "Go Beyond Best Practices To Accelerate Your Success",
      ingredients: [
        { name: "Industry Standards", source: "proven methodologies", service: "Knowledge & Retrieval Service" },
        { name: "Best Practices", source: "tested strategies", service: "Knowledge & Retrieval Service" },
        { name: "Success Patterns", source: "validated approaches", service: "Knowledge & Retrieval Service" }
      ],
      color: "from-green-500/10 to-green-500/5 border-green-200",
      iconColor: "text-green-600 bg-green-100"
    },
    {
      step: "03",
      title: "Customize Your Marketing Strategy",
      subtitle: "",
      icon: <Target className="h-8 w-8" />,
      description: "Tailor your strategy to your business goals and objectives",
      ingredients: [
        { name: "Custom Strategy", source: "tailored to your business", service: "Recommendation Service" },
        { name: "Goal Alignment", source: "fits your objectives perfectly", service: "Recommendation Service" },
        { name: "Smart Recommendations", source: "data-driven insights", service: "Recommendation Service" }
      ],
      color: "from-purple-500/10 to-purple-500/5 border-purple-200",
      iconColor: "text-purple-600 bg-purple-100"
    },
    {
      step: "04",
      title: "Get Smarter",
      subtitle: "",
      icon: <Sparkles className="h-8 w-8" />,
      description: "Your assistant is your second brain and becomes smarter over time",
      ingredients: [
        { name: "Learning Engine", source: "from every interaction", service: "Knowledge & Retrieval Service" },
        { name: "Smart Adaptation", source: "evolving recommendations", service: "Knowledge & Retrieval Service" },
        { name: "Performance Tracking", source: "continuous improvement", service: "Knowledge & Retrieval Service" }
      ],
      color: "from-orange-500/10 to-orange-500/5 border-orange-200",
      iconColor: "text-orange-600 bg-orange-100"
    },
    {
      step: "05",
      title: "Easy To Understand Your Data",
      subtitle: "",
      icon: <Palette className="h-8 w-8" />,
      description: "Inituitive Dashboard that are personalized to your preferences",
      ingredients: [
        { name: "Intuitive Dashboards", source: "clear navigation", service: "UX Design Service (Artist)" },
        { name: "Insightful Charts", source: "visual data stories", service: "UX Design Service (Artist)" },
        { name: "Easy Actions", source: "simple to understand and act on", service: "UX Design Service (Artist)" }
      ],
      color: "from-pink-500/10 to-pink-500/5 border-pink-200",
      iconColor: "text-pink-600 bg-pink-100"
    },
    {
      step: "06",
      title: "Talk To Your Data",
      subtitle: "",
      icon: <MessageSquare className="h-8 w-8" />,
      description: "Leverage the chat features to brainstorm with your assistant for strategy refinement",
      ingredients: [
        { name: "Natural Conversation", source: "chat interface", service: "Conversational Analytics Service (TTYD)" },
        { name: "Idea Brainstorming", source: "collaborative strategy sessions", service: "Conversational Analytics Service (TTYD)" },
        { name: "Real-time Refinement", source: "instant strategy adjustments", service: "Conversational Analytics Service (TTYD)" }
      ],
      color: "from-indigo-500/10 to-indigo-500/5 border-indigo-200",
      iconColor: "text-indigo-600 bg-indigo-100",
      comingSoon: true
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Link href="/" className="rounded-lg p-2 hover:scale-105 transition-transform">
                <Image
                  src="/images/gradient-orb.png"
                  alt="Optimizely Strategy Assistant"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Optimizely Strategy Assistant</h1>
                <p className="text-sm text-muted-foreground">Created by Perficient</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">BETA v1.0</span>
              <Link href="/engine">
                <Button className="gap-2">
                  Start Your Assistant
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="how-it-works-hero" className="container mx-auto px-4 pt-16 pb-8 text-center">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-center mb-8">
            <div className="relative w-full max-w-4xl">
              <Image
                src="/images/strategy-chef-hero.png"
                alt="OSA Strategy Assistant - Customized Strategy Plans Tailored to Your Business Goals"
                width={800}
                height={600}
                className="w-full h-auto rounded-lg shadow-lg"
                priority
              />
            </div>
          </div>
          <div className="space-y-6">
            <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Your Personal Strategy Assistant
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Imagine a world-class strategy team creating customized, actionable strategies with your data and goals. Here's how your assistant works...
            </p>
          </div>
        </div>
      </section>

      {/* Cooking Process Steps */}
      <section id="how-it-works-steps" className="container mx-auto px-4 pb-12">
        <div className="space-y-8">
          {cookingSteps.map((step, index) => (
            <div key={step.step} id={`how-it-works-step-${step.step}`} className="relative">
              <Card className={`bg-gradient-to-br ${step.color} border hover:shadow-lg transition-all duration-300 ${step.comingSoon ? 'opacity-75' : ''}`}>
                <CardContent className="p-6">
                  <div className="text-center space-y-6">
                    {/* Step Number and Icon */}
                    <div className="flex justify-center">
                      <div className="relative inline-block">
                        <div className="text-6xl font-bold text-gray-200 absolute -top-2 -left-2">
                          {step.step}
                        </div>
                        <div className={`relative z-10 p-4 rounded-2xl ${step.iconColor}`}>
                          {step.icon}
                        </div>
                      </div>
                    </div>

                    {/* Coming Soon Badge */}
                    {step.comingSoon && (
                      <div>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                          Coming Soon
                        </span>
                      </div>
                    )}

                    {/* Content */}
                    <div className="max-w-2xl mx-auto space-y-2">
                      <h3 className="text-2xl font-bold">{step.title}</h3>
                      <h4 className="text-lg text-muted-foreground font-medium">{step.subtitle}</h4>
                      <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </div>

                    {/* Ingredients/Services - Centered Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                      {step.ingredients.map((ingredient, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 bg-white/60 rounded-lg backdrop-blur-sm">
                          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div className="space-y-1 text-left">
                            <div className="font-semibold text-sm text-gray-900">{ingredient.name}</div>
                            <div className="text-xs text-gray-600">{ingredient.source}</div>
                            <div className="text-xs text-blue-600 font-medium">{ingredient.service}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </section>

      {/* Result Section */}
      <section id="how-it-works-result" className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 overflow-hidden">
          <CardContent className="p-12 text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex justify-center">
                <div className="p-4 bg-green-100 rounded-full">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                </div>
              </div>

              <h3 className="text-3xl font-bold text-green-900">
                Your Customized Optimizely Strategy
              </h3>

              <p className="text-xl text-green-700 leading-relaxed max-w-3xl mx-auto">
                A tailored, data-driven strategy that's expertly actionable, continuously improved,
                and customized for your
                business and marketing objectives.
              </p>

              <div id="how-it-works-features" className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="space-y-3">
                  <div className="p-3 bg-green-100 rounded-lg inline-block">
                    <Target className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-900">Expertly Prepared</h4>
                  <p className="text-sm text-green-700">Data-driven insights tailored to your business</p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-green-100 rounded-lg inline-block">
                    <Sparkles className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-900">Continuously Improved</h4>
                  <p className="text-sm text-green-700">Learning engine that gets smarter over time</p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 bg-green-100 rounded-lg inline-block">
                    <Palette className="h-6 w-6 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-green-900">Elegantly Presented</h4>
                  <p className="text-sm text-green-700">Beautiful dashboards that are easy to understand</p>
                </div>
              </div>

              <div id="how-it-works-cta" className="pt-8">
                <Link href="/engine">
                  <Button size="lg" className="gap-2 bg-green-600 hover:bg-green-700 text-white px-8">
                    Start Your Strategy Assistant
                    <ChefHat className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              © 2025 OSA Strategy Assistant from Perficient.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}