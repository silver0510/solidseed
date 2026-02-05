"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  Users,
  Mail,
  BarChart3,
  Smartphone,
  Shield,
  Zap,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Target,
  Calendar,
  FileText,
  Bell,
  Sun,
  Moon
} from "lucide-react";

const emptySubscribe = () => () => {};

function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

export default function HomePage() {
  const [activeFeature, setActiveFeature] = useState("clients");
  const { setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {mounted && (
              <Image
                src={resolvedTheme === "dark" ? "/icons/icon-text-light.png" : "/icons/icon-text.png"}
                alt="SolidSeed"
                width={148}
                height={60}
                priority
              />
            )}
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="rounded-full"
              aria-label="Toggle theme"
            >
              {mounted && (resolvedTheme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              ))}
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="group">
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]" />
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[500px] w-[800px] bg-primary/20 rounded-full blur-[120px] opacity-50" />
        </div>

        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 animate-fade-in">
              <Sparkles className="h-3 w-3 mr-1" />
              Now with AI-powered insights
            </Badge>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
              Your{" "}
              <span className="relative">
                <span className="text-primary">Real Estate</span>
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                  <path d="M2 10C50 4 150 4 198 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary/30" />
                </svg>
              </span>
              {" "}Business, Supercharged
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Manage clients, close deals, and grow your business with the most
              intuitive CRM designed for modern real estate professionals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" className="text-lg px-8 group" asChild>
                <Link href="/register">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              {/* <Button size="lg" variant="outline" className="text-lg px-8" asChild>
                <Link href="#demo">See It In Action</Link>
              </Button> */}
            </div>

            {/* Floating Feature Cards */}
            <div className="relative mt-16">
              {/* Main Dashboard Preview */}
              <div className="relative mx-auto max-w-4xl">
                <div className="rounded-xl border bg-card shadow-2xl overflow-hidden">
                  <div className="border-b bg-muted/50 px-4 py-1 flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <div className="h-3 w-3 rounded-full bg-yellow-500" />
                      <div className="h-3 w-3 rounded-full bg-green-500" />
                    </div>
                    <div className="flex-1 flex justify-center">
                      <div className="bg-background rounded px-3 py-1 text-xs text-muted-foreground">
                        solidseed.app/dashboard
                      </div>
                    </div>
                  </div>
                  <div className="aspect-[16/9]">
                    <Image
                      src="/homepage/main-dashboard.png"
                      alt="SolidSeed main dashboard"
                      width={1280}
                      height={720}
                      className="w-full h-full object-cover"
                      priority
                    />
                  </div>
                </div>

                {/* Floating Cards */}
                <div className="absolute -left-8 top-1/4 bg-card rounded-lg border shadow-lg p-4 animate-float hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">New Deal Closed!</p>
                      <p className="text-xs text-muted-foreground">$425,000 - 123 Oak St</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -right-8 top-1/3 bg-card rounded-lg border shadow-lg p-4 animate-float-delayed hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Follow-up Reminder</p>
                      <p className="text-xs text-muted-foreground">Call John Smith at 2:00 PM</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-4 bottom-1/4 bg-card rounded-lg border shadow-lg p-4 animate-float-slow hidden lg:block">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Email Opened</p>
                      <p className="text-xs text-muted-foreground">Market Update - Sarah M.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">100+</p>
              <p className="text-muted-foreground">Active Agents</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">$250M</p>
              <p className="text-muted-foreground">Deals Managed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">10K+</p>
              <p className="text-muted-foreground">Clients Organized</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-primary">98%</p>
              <p className="text-muted-foreground">Satisfaction Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features Section */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful tools designed specifically for real estate workflows.
            </p>
          </div>

          <Tabs value={activeFeature} onValueChange={setActiveFeature} className="max-w-5xl mx-auto">
            <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto gap-2 bg-transparent">
              <TabsTrigger value="clients" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col gap-1 py-3">
                <Users className="h-5 w-5" />
                <span className="text-xs">Clients</span>
              </TabsTrigger>
              <TabsTrigger value="pipeline" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col gap-1 py-3">
                <Target className="h-5 w-5" />
                <span className="text-xs">Pipeline</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col gap-1 py-3">
                <Calendar className="h-5 w-5" />
                <span className="text-xs">Tasks</span>
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col gap-1 py-3">
                <FileText className="h-5 w-5" />
                <span className="text-xs">Documents</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex flex-col gap-1 py-3">
                <BarChart3 className="h-5 w-5" />
                <span className="text-xs">Analytics</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-12">
              <TabsContent value="clients" className="mt-0">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Client Hub</h3>
                    <p className="text-muted-foreground mb-6">
                      Centralized client management with complete profiles, communication history,
                      and smart organization tools.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>360-degree client profiles</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Smart tags and segmentation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Activity timeline</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Quick notes and reminders</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border bg-card shadow-xl overflow-hidden">
                    <div className="border-b bg-muted/50 px-4 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-background rounded px-3 py-1 text-xs text-muted-foreground">
                          solidseed.app/clients
                        </div>
                      </div>
                    </div>
                    <div className="aspect-video">
                      <Image
                        src="/homepage/cliens-page.png"
                        alt="Client list view"
                        width={800}
                        height={450}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pipeline" className="mt-0">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Deal Pipeline</h3>
                    <p className="text-muted-foreground mb-6">
                      Visual kanban board to track every deal from lead to close with
                      customizable stages and automation.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Drag-and-drop kanban</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Custom pipeline stages</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Deal value tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Win probability scoring</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border bg-card shadow-xl overflow-hidden">
                    <div className="border-b bg-muted/50 px-4 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-background rounded px-3 py-1 text-xs text-muted-foreground">
                          solidseed.app/pipeline
                        </div>
                      </div>
                    </div>
                    <div className="aspect-video">
                      <Image
                        src="/homepage/pipeline-kanban.png"
                        alt="Deal pipeline kanban board"
                        width={800}
                        height={450}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="mt-0">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Task Management</h3>
                    <p className="text-muted-foreground mb-6">
                      Never miss a follow-up with smart task management, reminders,
                      and automated scheduling.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Calendar integration</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Automated reminders</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Task templates</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Priority management</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border bg-card shadow-xl overflow-hidden">
                    <div className="border-b bg-muted/50 px-4 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-background rounded px-3 py-1 text-xs text-muted-foreground">
                          solidseed.app/tasks
                        </div>
                      </div>
                    </div>
                    <div className="aspect-video">
                      <Image
                        src="/homepage/tasks-page.png"
                        alt="Task management view"
                        width={800}
                        height={450}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="mt-0">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Document Storage</h3>
                    <p className="text-muted-foreground mb-6">
                      Keep all client documents organized and accessible. Contracts,
                      IDs, and paperwork in one secure place.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Secure file storage</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Quick document access</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Version history</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Easy sharing</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border overflow-hidden aspect-video">
                    <Image
                      src="/homepage/document-manage.png"
                      alt="Document management view"
                      width={800}
                      height={450}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Analytics & Insights</h3>
                    <p className="text-muted-foreground mb-6">
                      Data-driven insights to understand your performance and make
                      smarter business decisions.
                    </p>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Performance dashboards</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Conversion tracking</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Revenue forecasting</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        <span>Custom reports</span>
                      </li>
                    </ul>
                  </div>
                  <div className="rounded-xl border bg-card shadow-xl overflow-hidden">
                    <div className="border-b bg-muted/50 px-4 flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                      </div>
                      <div className="flex-1 flex justify-center">
                        <div className="bg-background rounded px-3 py-1 text-xs text-muted-foreground">
                          solidseed.app/reports
                        </div>
                      </div>
                    </div>
                    <div className="aspect-video">
                      <Image
                        src="/homepage/report-page.png"
                        alt="Analytics and reports dashboard"
                        width={800}
                        height={450}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              No complicated setup. No training required. Just sign up and start closing deals.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Sign Up Free</h3>
                <p className="text-muted-foreground">
                  Create your account in seconds. No credit card required for your 14-day trial.
                </p>
                <ChevronRight className="hidden md:block absolute top-4 -right-4 h-8 w-8 text-muted-foreground/30" />
              </div>

              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Import Your Data</h3>
                <p className="text-muted-foreground">
                  Easily import your existing clients from spreadsheets or other CRMs with one click.
                </p>
                <ChevronRight className="hidden md:block absolute top-4 -right-4 h-8 w-8 text-muted-foreground/30" />
              </div>

              <div>
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Start Closing</h3>
                <p className="text-muted-foreground">
                  Manage your clients, track deals, and grow your business from day one.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge variant="outline" className="mb-4">Why SolidSeed?</Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Built for Real Estate, Not Retrofitted
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Unlike generic CRMs, every feature in SolidSeed was designed with real estate
                workflows in mind. From showing schedules to closing checklists, we speak your language.
              </p>

              <div className="grid sm:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <Smartphone className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Mobile-First</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Full functionality on your phone for showings and open houses.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <Shield className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Your Data, Your Way</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      GDPR compliant with full data export. Take your clients when you move.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <Zap className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Lightning Fast</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      No lag, no loading. Built for speed so you can work efficiently.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <CardTitle className="text-lg">Team Ready</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Collaborate with your team, share clients, and track performance.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="relative">
              <div className="rounded-xl border bg-card shadow-xl overflow-hidden">
                <div className="aspect-square">
                  <Image
                    src="/homepage/mobile-view.png"
                    alt="SolidSeed mobile app view"
                    width={600}
                    height={600}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-12 md:p-20">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:32px_32px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto text-center">
              <h2 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
                Ready to Transform Your Business?
              </h2>
              <p className="text-xl text-primary-foreground/80 mb-8">
                Join hundreds of successful real estate professionals using SolidSeed.
                Start your free 14-day trial today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="text-lg px-8 group" asChild>
                  <Link href="/register">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10" asChild>
                  <Link href="/contact">Schedule a Demo</Link>
                </Button>
              </div>
              <p className="text-primary-foreground/60 text-sm mt-4">
                No credit card required. Cancel anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              {mounted && (
                <Image
                  src={resolvedTheme === "dark" ? "/icons/icon.png" : "/icons/icon-dark.png"}
                  alt="SolidSeed"
                  width={100}
                  height={32}
                  className="h-8 w-auto"
                />
              )}
            </Link>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <Link href="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <Link href="/contact" className="hover:text-foreground transition-colors">
                Contact
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 SolidSeed. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Custom Styles for Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite 0.5s;
        }
        .animate-float-slow {
          animation: float-slow 5s ease-in-out infinite 1s;
        }
      `}</style>
    </div>
  );
}
