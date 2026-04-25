'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Monitor, Target, Zap } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState({
    activeMonitors: 0,
    newLeadsToday: 0,
    totalLeadsThisMonth: 0,
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [keywordHeatmap, setKeywordHeatmap] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 41);

      const [monitorsResult, leadsResult] = await Promise.all([
        supabase
          .from('monitors')
          .select('*, leads(id, created_at, title)')
          .eq('user_id', user.id),
        supabase
          .from('leads')
          .select('*, monitors(name)')
          .eq('monitors.user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      const activeMonitors = (monitorsResult.data || []).filter(m => m.active).length;
      
      const leadsData = leadsResult.data || [];
      
      const todayStr = today.toISOString().split('T')[0];
      const newLeadsToday = leadsData.filter(l => {
        const leadDate = new Date(l.created_at);
        leadDate.setHours(0, 0, 0, 0);
        return leadDate.getTime() === today.getTime();
      }).length;

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      const totalLeadsThisMonth = leadsData.filter(l => {
        const leadDate = new Date(l.created_at);
        leadDate.setHours(0, 0, 0, 0);
        return leadDate >= startOfMonth;
      }).length;

      const allKeywords = new Set();
      (monitorsResult.data || []).forEach(monitor => {
        (monitor.keywords || []).forEach(k => allKeywords.add(k.toLowerCase()));
      });

      const gridData = [];
      const currentDate = new Date(thirtyDaysAgo);
      
      for (let i = 0; i < 42; i++) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(currentDate);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayLeads = leadsData.filter(l => {
          const leadDate = new Date(l.created_at);
          return leadDate >= dayStart && leadDate <= dayEnd;
        });
        
        const keywordCounts = {};
        dayLeads.forEach(lead => {
          const title = (lead.title || '').toLowerCase();
          allKeywords.forEach(kw => {
            if (title.includes(kw)) {
              keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
            }
          });
        });

        let topKeyword = null;
        let maxCount = 0;
        Object.entries(keywordCounts).forEach(([kw, count]) => {
          if (count > maxCount) {
            maxCount = count;
            topKeyword = kw;
          }
        });

        const todayStr = today.toISOString().split('T')[0];
        const checkDate = currentDate.toISOString().split('T')[0];

        gridData.push({
          date: currentDate.toISOString().split('T')[0],
          label: currentDate.getDate(),
          isToday: checkDate === todayStr,
          keyword: topKeyword,
          count: maxCount,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      const maxCount = Math.max(...gridData.map(d => d.count), 1);

      setStats({ activeMonitors, newLeadsToday, totalLeadsThisMonth });
      setRecentLeads(leadsData.slice(0, 10));
      setKeywordHeatmap(gridData.map(d => ({ ...d, intensity: d.count / maxCount })));
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  const getCellStyle = (day) => {
    if (day.count === 0) {
      return 'bg-[#18181b] text-[#52525b] border border-[#27272a]';
    }
    const intensity = 0.3 + day.intensity * 0.7;
    const bgOpacity = Math.round(intensity * 100);
    return `bg-[#f97316] text-white border border-transparent`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-[#a1a1aa]">Overview of your lead generation</p>
        </div>
        <Link href="/dashboard/monitors">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Monitor
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-[#27272a]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#a1a1aa]">Active Monitors</CardTitle>
            <Monitor className="h-4 w-4 text-[#f97316]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.activeMonitors}</div>
          </CardContent>
        </Card>

        <Card className="border-[#27272a]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#a1a1aa]">New Leads Today</CardTitle>
            <Target className="h-4 w-4 text-[#10b981]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.newLeadsToday}</div>
          </CardContent>
        </Card>

        <Card className="border-[#27272a]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-[#a1a1aa]">Leads This Month</CardTitle>
            <Zap className="h-4 w-4 text-[#f97316]" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalLeadsThisMonth}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#27272a]">
        <CardHeader>
          <CardTitle className="text-white">High-Intent Keywords</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-[#a1a1aa]">Loading...</div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-14 gap-1">
                {keywordHeatmap.map((day, idx) => (
                  <div
                    key={idx}
                    className={`
                      aspect-square rounded flex flex-col items-center justify-center p-1
                      transition-all hover:scale-110 cursor-default text-[10px]
                      ${getCellStyle(day)}
                      ${day.isToday ? 'ring-2 ring-white ring-offset-2 ring-offset-[#09090b]' : ''}
                    `}
                    title={`${day.date}: ${day.keyword || 'No matches'} (${day.count})`}
                  >
                    <span className="font-bold">{day.label}</span>
                    {day.keyword && (
                      <span className={`truncate w-full text-center ${day.count > 0 ? 'text-[10px] mt-0.5' : ''}`}>
                        {day.keyword.substring(0, 4)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-2 mt-2 text-xs text-[#71717a]">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded bg-[#18181b] border border-[#27272a]" />
                  <div className="w-3 h-3 rounded bg-[#f97316]/20" />
                  <div className="w-3 h-3 rounded bg-[#f97316]/40" />
                  <div className="w-3 h-3 rounded bg-[#f97316]/60" />
                  <div className="w-3 h-3 rounded bg-[#f97316]/80" />
                  <div className="w-3 h-3 rounded bg-[#f97316] shadow-[0_0_6px_rgba(249,115,22,0.5)]" />
                </div>
                <span>More</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#27272a]">
        <CardHeader>
          <CardTitle className="text-white">Recent Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-[#a1a1aa]">Loading...</div>
          ) : recentLeads.length === 0 ? (
            <div className="py-8 text-center text-[#52525b]">
              No leads yet. Create a monitor to start finding leads.
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between rounded-lg border border-[#27272a] p-4 hover:border-[#f97316]/50 transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <a
                      href={lead.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-white hover:text-[#f97316]"
                    >
                      {lead.title}
                    </a>
                    <div className="mt-1 flex items-center gap-2 text-sm text-[#a1a1aa]">
                      <span className="text-[#f97316]">r/{lead.subreddit}</span>
                      <span>•</span>
                      <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                      <span className="rounded-full bg-[#18181b] px-2 py-0.5 text-xs">
                        {lead.monitors?.name || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <a
                    href={lead.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-4 shrink-0 text-sm text-[#a1a1aa] hover:text-[#f97316] transition-colors"
                  >
                    View on Reddit
                  </a>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}