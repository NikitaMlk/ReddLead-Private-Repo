'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit, Play, Pause } from 'lucide-react';
import { TimerCircle } from '@/components/dashboard/timer-circle';

export const dynamic = 'force-dynamic';

export default function MonitorsPage() {
  const supabase = createClient();
  const [monitors, setMonitors] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMonitor, setEditingMonitor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    subreddits: '',
    keywords: '',
    frequency_minutes: 60,
    active: true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const LIMITS = {
    free: { monitors: 3, leads: 100, minFrequency: 60, maxFrequency: 120 },
    paid: { monitors: 10, leads: 10000, minFrequency: 2, maxFrequency: 120 },
    pro: { monitors: 10, leads: 10000, minFrequency: 2, maxFrequency: 120 },
    enterprise: { monitors: 999999, leads: 999999, minFrequency: 2, maxFrequency: 120 },
  };

  const getTierLimits = () => {
    const tier = profile?.subscription_tier || 'free';
    return LIMITS[tier] || LIMITS.free;
  };

  useEffect(() => {
    fetchData();
  }, [supabase]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [monitorsRes, profileRes] = await Promise.all([
      supabase
        .from('monitors')
        .select('*, leads(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('subscription_tier')
        .eq('id', user.id)
        .single(),
    ]);

    setMonitors(monitorsRes.data || []);
    setProfile(profileRes.data);
    setLoading(false);
  };

  const getLimits = () => {
    const tier = profile?.subscription_tier || 'free';
    return LIMITS[tier] || LIMITS.free;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const subArray = formData.subreddits.split(',').map(s => s.trim()).filter(s => s);
    const keyArray = formData.keywords.split(',').map(k => k.trim()).filter(k => k);

    if (editingMonitor) {
      await supabase
        .from('monitors')
        .update({
          name: formData.name,
          subreddits: subArray,
          keywords: keyArray,
          frequency_minutes: formData.frequency_minutes,
          active: formData.active,
        })
        .eq('id', editingMonitor.id);
    } else {
      await supabase
        .from('monitors')
        .insert({
          user_id: user.id,
          name: formData.name,
          subreddits: subArray,
          keywords: keyArray,
          frequency_minutes: formData.frequency_minutes,
          active: formData.active,
        });
    }

    setShowForm(false);
    setEditingMonitor(null);
    setFormData({
      name: '',
      subreddits: '',
      keywords: '',
      frequency_minutes: 60,
      active: true,
    });
    setSaving(false);
    fetchData();
  };

  const handleEdit = (monitor) => {
    setEditingMonitor(monitor);
    setFormData({
      name: monitor.name,
      subreddits: monitor.subreddits.join(', '),
      keywords: monitor.keywords.join(', '),
      frequency_minutes: monitor.frequency_minutes,
      active: monitor.active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this monitor?')) return;
    
    await supabase.from('monitors').delete().eq('id', id);
    fetchData();
  };

  const handleToggleActive = async (monitor) => {
    await supabase
      .from('monitors')
      .update({ active: !monitor.active })
      .eq('id', monitor.id);
    fetchData();
  };

  const handleScanNow = async (monitorId) => {
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitorId }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Scan started! New leads will appear shortly.');
      } else {
        alert(data.message || 'Failed to start scan');
      }
    } catch (err) {
      alert('Failed to start scan');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Monitors</h1>
          <p className="text-sm text-[#a1a1aa]">Manage your subreddit and keyword monitors</p>
        </div>
        <Button 
          onClick={() => { 
            setShowForm(true); 
            setEditingMonitor(null); 
            setFormData({ name: '', subreddits: '', keywords: '', frequency_minutes: 60, active: true }); 
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New Monitor
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {showForm && (
        <Card className="border-[#27272a]">
          <CardHeader>
            <CardTitle className="text-white">{editingMonitor ? 'Edit Monitor' : 'Create New Monitor'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-[#a1a1aa]">Monitor Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="My Product Leads"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequency" className="text-[#a1a1aa]">Scan Frequency (minutes)</Label>
                  <Input
                    id="frequency"
                    type="number"
                    min={getTierLimits().minFrequency}
                    max={getTierLimits().maxFrequency}
                    value={formData.frequency_minutes}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      const limits = getTierLimits();
                      if (val >= limits.minFrequency && val <= limits.maxFrequency) {
                        setFormData({ ...formData, frequency_minutes: val });
                      }
                    }}
                  />
                  <p className="text-xs text-[#71717a]">
                    Min: {getTierLimits().minFrequency}min, Max: {getTierLimits().maxFrequency}min ({getTierLimits().minFrequency === 60 ? 'Free tier' : 'Paid tier'})
                  </p>
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subreddits" className="text-[#a1a1aa]">Subreddits (comma-separated)</Label>
                  <Input
                    id="subreddits"
                    value={formData.subreddits}
                    onChange={(e) => setFormData({ ...formData, subreddits: e.target.value })}
                    placeholder="marketing, startups, saas"
                    required
                  />
                  <p className="text-xs text-[#71717a]">Separate multiple with commas</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords" className="text-[#a1a1aa]">Keywords (comma-separated)</Label>
                  <Input
                    id="keywords"
                    value={formData.keywords}
                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                    placeholder="help, recommendation, tools"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : editingMonitor ? 'Update Monitor' : 'Create Monitor'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setEditingMonitor(null); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="py-8 text-center text-[#a1a1aa]">Loading...</div>
      ) : monitors.length === 0 ? (
        <div className="py-8 text-center text-[#52525b]">
          No monitors yet. Create your first monitor to start finding leads.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {monitors.map((monitor) => (
            <Card key={monitor.id} className="border-[#27272a]">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-3">
                  <TimerCircle 
                    frequencyMinutes={monitor.frequency_minutes} 
                    lastRun={monitor.last_run} 
                    isActive={monitor.active} 
                  />
                  <CardTitle className="text-white text-lg">{monitor.name}</CardTitle>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                  monitor.active 
                    ? 'bg-[#10b981]/20 text-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                    : 'bg-[#18181b] text-[#52525b]'
                }`}>
                  {monitor.active ? 'Active' : 'Paused'}
                </span>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm font-medium text-[#71717a]">Subreddits: </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {monitor.subreddits.map((sub) => (
                        <span key={sub} className="rounded-full bg-[#18181b] border border-[#27272a] px-2 py-0.5 text-xs text-[#a1a1aa]">
                          r/{sub}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[#71717a]">Keywords: </span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {monitor.keywords.map((key) => (
                        <span key={key} className="rounded-md bg-[#f97316]/10 text-[#f97316] px-2 py-0.5 text-xs">
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-[#52525b]">
                    <span>Leads: {monitor.leads?.[0]?.count || 0}</span>
                    <span>Every {monitor.frequency_minutes} min</span>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" onClick={() => handleScanNow(monitor.id)}>
                      <Play className="mr-1 h-3 w-3" />
                      Scan Now
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleToggleActive(monitor)}>
                      {monitor.active ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleEdit(monitor)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(monitor.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}