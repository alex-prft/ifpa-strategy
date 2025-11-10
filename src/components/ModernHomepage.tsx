'use client';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3,
  Target,
  Users,
  Brain,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

export default function ModernHomepage() {

  const features = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI-Powered Strategy",
      description: "AI analyzes capabilities and generates personalized roadmaps"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Data-Driven Insights",
      description: "Analytics and benchmarking against industry standards"
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Precision Targeting",
      description: "Create targeted experiences with audience segmentation"
    },
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
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              AI-Powered Strategy Assistant for Optimizely DXP
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get personalized recommendations, strategy insights, and implementation roadmaps tailored to your Optimizely DXP setup. Built by Perficient.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-wrap lg:flex-nowrap justify-center gap-3 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-sm bg-white/60 backdrop-blur-sm flex-1 min-w-0 max-w-xs">
                  <CardContent className="p-3">
                    <div className="flex flex-col items-center text-center space-y-1.5">
                      <div className="p-1.5 bg-primary/10 rounded-lg text-primary">
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold text-xs leading-tight">{feature.title}</h3>
                      <p className="text-xs text-muted-foreground leading-snug px-1">{feature.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg gap-3 shadow-lg hover:shadow-xl transition-all">
            <Link href="/engine">
              Start Your Assistant
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-16 bg-gradient-to-r from-slate-50 to-gray-50">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h3 className="text-3xl font-bold">How It Works</h3>
            <p className="text-lg text-muted-foreground">
              Our 4-phase maturity framework guides you through progressive stages of personalization excellence
            </p>
          </div>
          <div className="flex justify-center">
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link href="/how-it-works">
                Learn About Our Framework
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">
              © 2025 Opal Personalization Generator from Perficient. Powered by Opal AI.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}