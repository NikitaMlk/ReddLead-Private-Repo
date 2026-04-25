'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, CreditCard, Bell, Webhook } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PLAN_LIMITS = {
  free: { monitors: 3, leads: 100, minFrequency: 60, maxFrequency: 120 },
  paid: { monitors: 10, leads: 10000, minFrequency: 2, maxFrequency: 120 },
  pro: { monitors: 10, leads: 10000, minFrequency: 2, maxFrequency: 120 },
  enterprise: { monitors: 999999, leads: 999999, minFrequency: 2, maxFrequency: 120 },
};

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [usage, setUsage] = useState({ monitors: 0, leads: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [emailFrequency, setEmailFrequency] = useState('daily');

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const fetchData = async () => {
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      router.push('/auth/login');
      return;
    }
    setUser(currentUser);

    const [profileData, monitorsData] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', currentUser.id).single(),
      supabase.from('monitors').select('id', { count: 'exact', head: true }).eq('user_id', currentUser.id),
    ]);

    if (profileData.data) {
      setProfile(profileData.data);
      setFormData({
        full_name: profileData.data.full_name || '',
        email: currentUser.email,
      });
    }

    const userMonitorIds = await supabase
      .from('monitors')
      .select('id')
      .eq('user_id', currentUser.id);

    let leadsCount = 0;
    if (userMonitorIds.data && userMonitorIds.data.length > 0) {
      const monitorIds = userMonitorIds.data.map(m => m.id);
      const leadsData = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .in('monitor_id', monitorIds);
      leadsCount = leadsData.count || 0;
    }

    setUsage({
      monitors: monitorsData.count || 0,
      leads: leadsCount,
    });
    setLoading(false);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);

    await supabase
      .from('profiles')
      .update({ full_name: formData.full_name })
      .eq('id', user.id);

    setSaving(false);
    fetchData();
  };

  const getTier = () => profile?.subscription_tier || 'free';
  const getLimits = () => PLAN_LIMITS[getTier()] || PLAN_LIMITS.free;

  const tierColors = {
    free: 'bg-[#18181b] text-[#52525b]',
    paid: 'bg-[#f97316]/20 text-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.3)]',
    pro: 'bg-[#f97316]/20 text-[#f97316] shadow-[0_0_8px_rgba(249,115,22,0.3)]',
    enterprise: 'bg-purple-500/20 text-purple-400',
  };

  const planNames = {
    free: 'Free',
    paid: 'Paid',
    pro: 'Paid',
    enterprise: 'Enterprise',
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-2 border-[#27272a] border-t-[#f97316]" />
          <p className="text-[#a1a1aa]">Loading...</p>
        </div>
      </div>
    );
  }

  const limits = getLimits();
  const monitorsPercent = limits.monitors > 0 ? Math.round((usage.monitors / limits.monitors) * 100) : 0;
  const leadsPercent = limits.leads > 0 ? Math.round((usage.leads / limits.leads) * 100) : 0;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-white">Settings</h1>
        <p className="text-sm text-[#a1a1aa]">Manage your account and preferences</p>
      </div>

      <Card className="border-[#27272a]">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-[#18181b] p-3">
            <User className="h-5 w-5 text-[#a1a1aa]" />
          </div>
          <div>
            <CardTitle className="text-white">Profile</CardTitle>
            <CardDescription className="text-[#a1a1aa]">Update your personal information</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-[#a1a1aa]">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#a1a1aa]">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-[#09090b] opacity-50"
                />
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-[#27272a]">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-[#18181b] p-3">
            <CreditCard className="h-5 w-5 text-[#a1a1aa]" />
          </div>
          <div>
            <CardTitle className="text-white">Subscription</CardTitle>
            <CardDescription className="text-[#a1a1aa]">Your current plan and usage</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-white">Current Plan</p>
              <p className="text-sm text-[#a1a1aa]">{planNames[getTier()]} plan</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-medium ${tierColors[getTier()]}`}>
              {planNames[getTier()].toUpperCase()}
            </span>
          </div>

          <div className="rounded-lg bg-[#09090b] p-4 border border-[#27272a]">
            <p className="text-sm text-[#a1a1aa] mb-2">Minimum scan frequency</p>
            <p className="text-lg font-bold text-white">
              {limits.minFrequency === 60 
                ? '1 hour (hourly)' 
                : `${limits.minFrequency} minutes`}
            </p>
            <p className="text-xs text-[#71717a] mt-1">
              {limits.minFrequency === 60 
                ? 'Free tier limit - upgrade to scan faster'
                : 'Paid tier - fast automated scanning'}
            </p>
          </div>

          <div className="rounded-lg bg-[#09090b] p-4 space-y-4 border border-[#27272a]">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#a1a1aa]">Monitors</span>
                <span className="font-medium text-white">{usage.monitors} / {limits.monitors}</span>
              </div>
              <div className="h-2 bg-[#18181b] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#f97316] rounded-full shadow-[0_0_8px_rgba(249,115,22,0.4)]" 
                  style={{ width: `${Math.min(monitorsPercent, 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#a1a1aa]">Leads stored</span>
                <span className="font-medium text-white">{usage.leads.toLocaleString()} / {limits.leads.toLocaleString()}</span>
              </div>
              <div className="h-2 bg-[#18181b] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#10b981] rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                  style={{ width: `${Math.min(leadsPercent, 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              {getTier() === 'free' ? 'Upgrade Plan' : 'Change Plan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#27272a]">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-[#18181b] p-3">
            <Bell className="h-5 w-5 text-[#a1a1aa]" />
          </div>
          <div>
            <CardTitle className="text-white">Notifications</CardTitle>
            <CardDescription className="text-[#a1a1aa]">Configure how you receive alerts</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="emailFrequency" className="text-[#a1a1aa]">Email Frequency</Label>
            <select
              id="emailFrequency"
              className="h-10 w-full rounded-md border border-[#27272a] bg-[#18181b] px-3 text-sm text-white"
              value={emailFrequency}
              onChange={(e) => setEmailFrequency(e.target.value)}
            >
              <option value="realtime">Real-time</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
              <option value="none">None</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-[#27272a]">
        <CardHeader className="flex flex-row items-center gap-4">
          <div className="rounded-lg bg-[#18181b] p-3">
            <Webhook className="h-5 w-5 text-[#a1a1aa]" />
          </div>
          <div>
            <CardTitle className="text-white">Webhooks</CardTitle>
            <CardDescription className="text-[#a1a1aa]">Send lead data to external services</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhookUrl" className="text-[#a1a1aa]">Webhook URL</Label>
            <Input
              id="webhookUrl"
              type="url"
              placeholder="https://your-webhook-endpoint.com/webhook"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
            />
            <p className="text-xs text-[#71717a]">
              When new leads are found, a POST request will be sent to this URL with lead data.
            </p>
          </div>
          <Button variant="outline">Save Webhook</Button>
        </CardContent>
      </Card>
    </div>
  );
}