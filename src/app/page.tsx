'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle, Users, Zap, Shield, ArrowRight, Menu, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, name }),
      })

      if (response.ok) {
        // Auto-login after registration
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        })

        if (loginResponse.ok) {
          router.push('/dashboard')
        }
      } else {
        const data = await response.json()
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded bg-primary"></div>
            <span className="text-xl font-bold">TeamFlow</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">
              How it Works
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Button variant="ghost" className="hidden md:inline-flex" onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Sign In
            </Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-background p-4">
            <div className="flex flex-col space-y-2">
              <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Features
              </Link>
              <Link href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                How it Works
              </Link>
              <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors py-2">
                Pricing
              </Link>
              <Button variant="ghost" className="justify-start" onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}>
                Sign In
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="container px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            🚀 New: Real-time collaboration now available
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Task Management for
            <span className="text-primary"> Modern Teams</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Streamline your workflow with visual Kanban boards, real-time updates, and 
            seamless team collaboration. Built for remote teams across Europe.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8" onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}>
              Start Free Trial <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container px-4 py-20 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Stay Productive
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed for modern remote teams
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Real-time Collaboration</CardTitle>
                <CardDescription>
                  See updates instantly as your team moves tasks around. No more refreshing pages.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Visual Kanban Boards</CardTitle>
                <CardDescription>
                  Drag-and-drop interface that makes task management intuitive and fast.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Your data is protected with enterprise-grade security and privacy controls.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Authentication Section */}
      <section id="auth-section" className="container px-4 py-20">
        <div className="max-w-md mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome to TeamFlow</CardTitle>
              <CardDescription>
                Get started with your free account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                    {error && (
                      <div className="text-sm text-destructive">{error}</div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                      <Label htmlFor="register-name">Name</Label>
                      <Input
                        id="register-name"
                        name="name"
                        type="text"
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="register-password">Password</Label>
                      <Input
                        id="register-password"
                        name="password"
                        type="password"
                        placeholder="Create a password"
                        required
                        minLength={6}
                      />
                    </div>
                    {error && (
                      <div className="text-sm text-destructive">{error}</div>
                    )}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-muted-foreground">
              No complex setup, no training required
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Workspace</h3>
              <p className="text-muted-foreground">
                Set up your team workspace in seconds with a name and invite your team members.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Boards</h3>
              <p className="text-muted-foreground">
                Organize your projects with unlimited Kanban boards and custom columns.
              </p>
            </div>

            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Collaborating</h3>
              <p className="text-muted-foreground">
                Add tasks, assign team members, and watch progress happen in real-time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="border-0 bg-primary text-primary-foreground">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Team's Productivity?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of teams already using TeamFlow to ship faster and collaborate better.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" className="text-lg px-8" onClick={() => document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' })}>
                  Start Free 14-Day Trial
                </Button>
                <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary text-lg px-8">
                  Schedule Demo
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center space-x-6 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Setup in 2 minutes
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Cancel anytime
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="h-8 w-8 rounded bg-primary"></div>
                <span className="text-xl font-bold">TeamFlow</span>
              </div>
              <p className="text-muted-foreground">
                Modern task management for remote teams across Europe.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Features</Link></li>
                <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
                <li><Link href="#" className="hover:text-foreground">API</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">About</Link></li>
                <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
                <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#" className="hover:text-foreground">Help Center</Link></li>
                <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
                <li><Link href="#" className="hover:text-foreground">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 TeamFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}