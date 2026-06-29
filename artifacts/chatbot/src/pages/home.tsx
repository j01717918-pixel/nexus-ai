import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Code, Zap, Shield, Sparkles } from "lucide-react";
import { useAuth } from "@clerk/react";

export default function Home() {
  const { isSignedIn } = useAuth();
  
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-primary-foreground">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center px-4 md:px-8">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Bot className="h-5 w-5" />
            <span>Nexus AI</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              {isSignedIn ? (
                <Link href="/chat" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                  Go to app
                </Link>
              ) : (
                <>
                  <Link href="/sign-in" className="inline-flex h-9 items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                    Sign in
                  </Link>
                  <Link href="/sign-up" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                    Sign up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-24 md:py-32 lg:py-48 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="/hero-bg.png" 
              alt="Nexus AI Hero" 
              className="w-full h-full object-cover opacity-30 dark:opacity-20 object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background"></div>
          </div>
          
          <div className="container relative z-10 px-4 md:px-6 flex flex-col items-center text-center">
            <div className="inline-flex items-center rounded-full border border-border bg-background/50 px-3 py-1 text-sm font-medium backdrop-blur-sm mb-6">
              <Sparkles className="mr-2 h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Nexus AI 2.0 is now available</span>
            </div>
            
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl mb-6 max-w-4xl text-balance">
              Intelligence that feels <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-200 to-zinc-500 dark:from-zinc-100 dark:to-zinc-400">purposeful</span>
            </h1>
            
            <p className="max-w-[42rem] leading-normal text-muted-foreground sm:text-xl sm:leading-8 mb-8">
              A high-end AI assistant designed for creative professionals and developers. Dense, precise, and fast. Built to amplify your workflow without the clutter.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href={isSignedIn ? "/chat" : "/sign-up"} className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                Start building for free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="#features" className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50">
                Explore features
              </Link>
            </div>
          </div>
        </section>

        {/* Interface Preview */}
        <section className="w-full pb-24 md:pb-32 px-4 md:px-6">
          <div className="container max-w-screen-xl mx-auto">
            <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden flex flex-col md:flex-row">
              <div className="w-full md:w-[280px] border-r border-border bg-sidebar p-4 flex flex-col hidden md:flex">
                <div className="h-8 w-24 bg-muted rounded-md mb-6"></div>
                <div className="space-y-2">
                  <div className="h-8 w-full bg-accent rounded-md"></div>
                  <div className="h-8 w-full bg-muted/50 rounded-md"></div>
                  <div className="h-8 w-full bg-muted/50 rounded-md"></div>
                </div>
              </div>
              <div className="flex-1 bg-background p-6 md:p-8 flex flex-col">
                <div className="flex-1 space-y-6 mb-8">
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-muted shrink-0"></div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/4 bg-muted rounded"></div>
                      <div className="h-4 w-full bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-1/4 bg-muted rounded"></div>
                      <div className="h-4 w-[90%] bg-muted rounded"></div>
                      <div className="h-4 w-[85%] bg-muted rounded"></div>
                      <div className="h-32 w-full bg-muted/50 rounded-md border border-border mt-4"></div>
                    </div>
                  </div>
                </div>
                <div className="mt-auto">
                  <div className="h-12 w-full border border-border rounded-lg bg-muted/30"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="w-full py-24 md:py-32 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">Engineered for focus</h2>
              <p className="mt-4 text-muted-foreground md:text-lg max-w-[42rem]">
                Every element of Nexus AI is optimized for speed and clarity. No unnecessary distractions.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col space-y-4 p-6 bg-card rounded-lg border border-border shadow-sm">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Real-time streaming</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Responses appear instantly with smooth character-by-character streaming. Zero perceived latency.
                </p>
              </div>
              
              <div className="flex flex-col space-y-4 p-6 bg-card rounded-lg border border-border shadow-sm">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Code className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Developer-first</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Impeccable markdown rendering, syntax highlighting for all major languages, and one-click copying.
                </p>
              </div>
              
              <div className="flex flex-col space-y-4 p-6 bg-card rounded-lg border border-border shadow-sm">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Shield className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold">Enterprise privacy</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your data remains yours. SOC2 compliant architecture with strict data retention policies.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Graphic */}
        <section className="w-full py-24 md:py-32 overflow-hidden border-t border-border">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                  Intelligent processing at scale
                </h2>
                <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
                  Nexus AI utilizes advanced context retrieval to understand the nuances of your requests. It doesn't just answer questions; it understands your workflow.
                </p>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <div className="mr-3 p-1 rounded-full bg-primary/20 text-primary"><ArrowRight className="h-4 w-4" /></div>
                    <span>Long-context memory windows</span>
                  </li>
                  <li className="flex items-center">
                    <div className="mr-3 p-1 rounded-full bg-primary/20 text-primary"><ArrowRight className="h-4 w-4" /></div>
                    <span>Customizable system prompts</span>
                  </li>
                  <li className="flex items-center">
                    <div className="mr-3 p-1 rounded-full bg-primary/20 text-primary"><ArrowRight className="h-4 w-4" /></div>
                    <span>Model selection based on task</span>
                  </li>
                </ul>
              </div>
              <div className="relative rounded-xl overflow-hidden border border-border shadow-2xl">
                <img src="/features-graphic.png" alt="Features Graphic" className="w-full h-auto object-cover" />
              </div>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="w-full py-24 md:py-32 bg-muted/50 border-t border-border">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Transparent pricing</h2>
              <p className="mt-4 text-muted-foreground md:text-lg max-w-[42rem]">
                Start for free. Upgrade when you need more power.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="flex flex-col p-8 bg-card rounded-xl border border-border shadow-sm">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">$0</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-muted-foreground" /> Standard models</li>
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-muted-foreground" /> 100 messages / day</li>
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-muted-foreground" /> 30-day history</li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/sign-up">Get started</Link>
                </Button>
              </div>
              
              <div className="flex flex-col p-8 bg-card rounded-xl border border-primary shadow-md relative">
                <div className="absolute top-0 right-8 transform -translate-y-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Popular</span>
                </div>
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">$20</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-primary" /> Advanced reasoning models</li>
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-primary" /> Unlimited messages</li>
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-primary" /> Unlimited history</li>
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-primary" /> Custom system prompts</li>
                </ul>
                <Button className="w-full" asChild>
                  <Link href="/sign-up">Subscribe to Pro</Link>
                </Button>
              </div>
              
              <div className="flex flex-col p-8 bg-card rounded-xl border border-border shadow-sm">
                <h3 className="text-2xl font-bold mb-2">Team</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-extrabold">$50</span>
                  <span className="text-muted-foreground">/user/mo</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-muted-foreground" /> Everything in Pro</li>
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-muted-foreground" /> Shared knowledge base</li>
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-muted-foreground" /> Admin dashboard</li>
                  <li className="flex items-center text-sm"><Sparkles className="mr-2 h-4 w-4 text-muted-foreground" /> Priority support</li>
                </ul>
                <Button className="w-full" variant="outline" asChild>
                  <Link href="/sign-up">Contact sales</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="w-full py-24 md:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center p-12 md:p-16 bg-card rounded-2xl border border-border shadow-lg max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">Ready to upgrade your workflow?</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-[30rem]">
                Join thousands of developers and creatives using Nexus AI daily.
              </p>
              <Button size="lg" className="px-8 h-12" asChild>
                <Link href="/sign-up">Create your account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="w-full border-t border-border py-8 md:py-12 bg-background">
        <div className="container flex flex-col md:flex-row items-center justify-between px-4 md:px-6 gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            <span className="font-semibold text-foreground">Nexus AI</span>
          </div>
          <p>© {new Date().getFullYear()} Nexus AI Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-foreground transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}