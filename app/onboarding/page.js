'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export const dynamic = 'force-dynamic';

const LIMITS = {
  free: { monitors: 3, leads: 100 },
  paid: { monitors: 10, leads: 10000 },
  pro: { monitors: 10, leads: 10000 },
  enterprise: { monitors: 999999, leads: 999999 },
};

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState('');
  const [monitorName, setMonitorName] = useState('');
  const [subreddits, setSubreddits] = useState('');
  const [keywords, setKeywords] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/login');
        return;
      }
      setUser(user);
      
      const [profileRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('monitors').select('id').eq('user_id', user.id),
      ]);
      
      setProfile(profileRes.data);
      
      if (profileRes.data?.full_name) {
        setFullName(profileRes.data.full_name);
        setStep(2);
      }
    };
    getUser();
  }, [router, supabase]);

  const getLimits = () => {
    const tier = profile?.subscription_tier || 'free';
    return LIMITS[tier] || LIMITS.free;
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setStep(2);
    }
  };

  const handleCreateMonitor = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: existingMonitors } = await supabase
      .from('monitors')
      .select('id')
      .eq('user_id', user.id);

    const limits = getLimits();
    if (existingMonitors && existingMonitors.length >= limits.monitors) {
      setError(`Monitor limit reached. Your plan allows up to ${limits.monitors} monitors.`);
      setLoading(false);
      return;
    }

    const subArray = subreddits.split(',').map(s => s.trim()).filter(s => s);
    const keyArray = keywords.split(',').map(k => k.trim()).filter(k => k);

    const { error } = await supabase
      .from('monitors')
      .insert({
        user_id: user.id,
        name: monitorName,
        subreddits: subArray,
        keywords: keyArray,
        frequency_minutes: 60,
        active: true,
      });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#262626] border-t-white" />
          <p className="text-[#a3a3a3]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center gap-2 text-sm text-[#a3a3a3]">
            <span className={step >= 1 ? 'font-semibold text-white' : ''}>1. Profile</span>
            <span>→</span>
            <span className={step >= 2 ? 'font-semibold text-white' : ''}>2. First Monitor</span>
          </div>
          <CardTitle className="text-2xl text-white">
            {step === 1 ? 'Tell us about yourself' : 'Create your first monitor'}
          </CardTitle>
          <CardDescription className="text-[#a3a3a3]">
            {step === 1 
              ? 'We need your name to personalize your experience' 
              : 'Set up a monitor to start finding leads'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[#a3a3a3]">Full name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Saving...' : 'Continue'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleCreateMonitor} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="monitorName" className="text-[#a3a3a3]">Monitor name</Label>
                <Input
                  id="monitorName"
                  type="text"
                  placeholder="My Product Leads"
                  value={monitorName}
                  onChange={(e) => setMonitorName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subreddits" className="text-[#a3a3a3]">Subreddits (comma-separated)</Label>
                <Input
                  id="subreddits"
                  type="text"
                  placeholder="marketing, startups, saas"
                  value={subreddits}
                  onChange={(e) => setSubreddits(e.target.value)}
                  required
                />
                <p className="text-xs text-[#a3a3a3]">
                  Example: marketing, startups, saas
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords" className="text-[#a3a3a3]">Keywords (comma-separated)</Label>
                <Input
                  id="keywords"
                  type="text"
                  placeholder="help, recommendation, tools"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  required
                />
                <p className="text-xs text-[#a3a3a3]">
                  Example: help, recommendation, tools
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating...' : 'Create Monitor'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}