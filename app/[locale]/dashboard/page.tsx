import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Bot, Mic, Headphones } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Call Crafter AI</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Welcome to Call Crafter AI</CardTitle>
            <CardDescription>
              Your all-in-one solution for AI-powered voice communication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Call Crafter AI helps you create and manage AI voice agents for seamless communication.
              Get started by creating your first voice agent or exploring our features.
            </p>
            <div className="mt-4 flex space-x-4">
              <Link href="/voice-agents">
                <Button>
                  Voice Agents
                </Button>
              </Link>
              <Link href="/pricing">
                <Button variant="outline">
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">AI-Powered Agents</h3>
                  <p className="text-sm text-muted-foreground">Create intelligent voice agents that understand context</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Multiple Languages</h3>
                  <p className="text-sm text-muted-foreground">Support for various languages and accents</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary/10 text-primary">
                  <Headphones className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">Real-time Processing</h3>
                  <p className="text-sm text-muted-foreground">Natural voice interactions with minimal latency</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Create an Agent</h3>
                <p className="text-sm text-muted-foreground">Define your voice agent's personality and capabilities</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">2. Configure Settings</h3>
                <p className="text-sm text-muted-foreground">Choose voice, language, and behavior settings</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">3. Test and Deploy</h3>
                <p className="text-sm text-muted-foreground">Test your agent and deploy it to production</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">4. Monitor Performance</h3>
                <p className="text-sm text-muted-foreground">Track usage and improve your agent over time</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
