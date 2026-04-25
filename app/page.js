'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Search, Bell, Zap, Check } from 'lucide-react';

const plans = [
  {
    name: 'Free',
    description: 'Get started with basic monitoring',
    price: '$0',
    period: 'forever',
    href: '/auth/signup',
    features: [
      'Up to 3 monitors',
      '100 leads stored',
      'Manual scan only',
      'Basic keyword matching',
      'Community support',
    ],
  },
  {
    name: 'Paid',
    description: 'For professionals who need more',
    price: '$39',
    period: '/month',
    href: process.env.NEXT_PUBLIC_WHOP_PRO_CHECKOUT_URL || '#',
    features: [
      'Up to 10 monitors',
      '10,000 leads stored',
      'Automated scanning',
      'Advanced keyword matching',
      'Email notifications',
      'Priority support',
    ],
    popular: true,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#09090b]">
      <header className="border-b border-[#27272a]">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-semibold text-white">
            RedditSignal
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="outline" size="sm">Sign in</Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm">Get Started</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="mb-6 text-5xl font-bold text-white">
              Find high-intent Reddit leads effortlessly
            </h1>
            <p className="mb-8 text-xl text-[#a1a1aa] max-w-2xl mx-auto">
              Monitor subreddits and keywords to discover posts with buying signals, pain points, and competitor mentions.
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="lg">Start Free</Button>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#27272a]">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-lg bg-[#18181b] p-3">
                    <Search className="h-6 w-6 text-[#f97316]" />
                  </div>
                  <CardTitle className="text-white text-base">Monitor Subreddits</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#a1a1aa]">
                    Track multiple subreddits and get notified when new posts match your keywords.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[#27272a]">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-lg bg-[#18181b] p-3">
                    <Target className="h-6 w-6 text-[#10b981]" />
                  </div>
                  <CardTitle className="text-white text-base">Keyword Matching</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#a1a1aa]">
                    Set keywords to filter posts by topics that matter to your business.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[#27272a]">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-lg bg-[#18181b] p-3">
                    <Bell className="h-6 w-6 text-[#f97316]" />
                  </div>
                  <CardTitle className="text-white text-base">Real-time Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#a1a1aa]">
                    Get notified immediately when new leads are discovered from your monitors.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-[#27272a]">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="rounded-lg bg-[#18181b] p-3">
                    <Zap className="h-6 w-6 text-[#10b981]" />
                  </div>
                  <CardTitle className="text-white text-base">Manual Engagement</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#a1a1aa]">
                    Review leads and engage manually on Reddit following best practices.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-20" id="pricing">
          <div className="container mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-4xl font-bold text-white">Simple, transparent pricing</h2>
              <p className="text-lg text-[#a1a1aa]">Choose the plan that fits your needs</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
              {plans.map((plan) => (
                <Card key={plan.name} className={plan.popular ? 'border-[#f97316]/50 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'border-[#27272a]'}>
                  <CardHeader>
                    <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                    <p className="text-sm text-[#a1a1aa]">{plan.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-6 flex items-baseline">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="ml-1 text-[#a1a1aa]">{plan.period}</span>
                    </div>
                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center">
                          <Check className="mr-2 h-4 w-4 text-[#10b981]" />
                          <span className="text-sm text-[#a1a1aa]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Link href={plan.href} className="block w-full">
                      <Button className="w-full" variant={plan.popular ? 'default' : 'outline'}>
                        {plan.name === 'Free' ? 'Get Started' : 'Upgrade'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-[#71717a]">
                Need a custom plan? Contact us at support@redditsignal.com
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#27272a] py-8">
        <div className="container mx-auto px-4 text-center text-sm text-[#71717a]">
          <p>© 2026 RedditSignal. All rights reserved.</p>
          <p className="mt-2">
            Always engage manually on Reddit. Follow Reddit rules to avoid bans.
          </p>
        </div>
      </footer>
    </div>
  );
}