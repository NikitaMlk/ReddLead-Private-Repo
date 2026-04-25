'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function AlertsPage() {
  const supabase = createClient();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, [supabase]);

  const fetchAlerts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userMonitorIds = await supabase
      .from('monitors')
      .select('id')
      .eq('user_id', user.id);

    if (!userMonitorIds.data || userMonitorIds.data.length === 0) {
      setAlerts([]);
      setLoading(false);
      return;
    }

    const monitorIds = userMonitorIds.data.map(m => m.id);

    const { data, error } = await supabase
      .from('leads')
      .select('*, monitors(name)')
      .in('monitor_id', monitorIds)
      .eq('status', 'new')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error) {
      setAlerts(data);
    }
    setLoading(false);
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Alerts</h1>
        <p className="text-sm text-[#a1a1aa]">Recent lead notifications</p>
      </div>

      {loading ? (
        <div className="py-8 text-center text-[#a1a1aa]">Loading...</div>
      ) : alerts.length === 0 ? (
        <div className="py-8 text-center text-[#52525b]">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-[#27272a]" />
          <p>No new leads to alert about</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((lead) => (
            <Card key={lead.id} className="border-[#27272a] hover:border-[#f97316]/50 transition-all">
              <CardContent className="py-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-sm text-[#71717a] mb-1">
                      <Target className="h-4 w-4 text-[#f97316]" />
                      <span className="font-medium text-white">{lead.monitors?.name}</span>
                      <span>•</span>
                      <span className="text-[#f97316]">r/{lead.subreddit}</span>
                      <span>•</span>
                      <span>{formatTimeAgo(lead.created_at)}</span>
                    </div>
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white hover:text-[#f97316] transition-colors"
                    >
                      {lead.title}
                    </a>
                  </div>
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 shrink-0 text-sm text-[#a1a1aa] hover:text-[#f97316] transition-colors"
                  >
                    View
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}