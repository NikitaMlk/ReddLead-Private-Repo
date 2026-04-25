'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Download, ExternalLink, X } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LeadsPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [subredditFilter, setSubredditFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const pageSize = 20;

  useEffect(() => {
    fetchLeads();
  }, [supabase, page, searchTerm, subredditFilter, statusFilter]);

  const fetchLeads = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userMonitorIds = await supabase
      .from('monitors')
      .select('id')
      .eq('user_id', user.id);

    if (!userMonitorIds.data || userMonitorIds.data.length === 0) {
      setLeads([]);
      setLoading(false);
      return;
    }

    const monitorIds = userMonitorIds.data.map(m => m.id);

    let query = supabase
      .from('leads')
      .select('*, monitors(name)', { count: 'exact' })
      .in('monitor_id', monitorIds);

    if (searchTerm) {
      query = query.ilike('title', `%${searchTerm}%`);
    }
    if (subredditFilter) {
      query = query.eq('subreddit', subredditFilter);
    }
    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error) {
      setLeads(data);
      setTotalCount(count);
    }
    setLoading(false);
  };

  const handleStatusChange = async (leadId, newStatus) => {
    await supabase.from('leads').update({ status: newStatus }).eq('id', leadId);
    fetchLeads();
  };

  const handleBulkStatusChange = async (newStatus) => {
    if (selectedLeads.length === 0) return;
    await supabase.from('leads').update({ status: newStatus }).in('id', selectedLeads);
    setSelectedLeads([]);
    fetchLeads();
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Subreddit', 'Author', 'URL', 'Status', 'Created At'];
    const rows = leads.map(lead => [
      `"${lead.title.replace(/"/g, '""')}"`,
      lead.subreddit,
      lead.author,
      lead.url,
      lead.status,
      lead.created_at,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map(l => l.id));
    }
  };

  const toggleSelectLead = (leadId) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    } else {
      setSelectedLeads([...selectedLeads, leadId]);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Leads</h1>
          <p className="text-sm text-[#a1a1aa]">View and manage your discovered leads</p>
        </div>
        <Button variant="outline" onClick={handleExportCSV}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <Card className="border-[#27272a]">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by title..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            <div className="w-[200px]">
              <Input
                placeholder="Filter by subreddit..."
                value={subredditFilter}
                onChange={(e) => { setSubredditFilter(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="h-10 rounded-md border border-[#27272a] bg-[#18181b] px-3 text-sm text-white"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="new">New</option>
              <option value="viewed">Viewed</option>
              <option value="ignored">Ignored</option>
            </select>
          </div>

          {selectedLeads.length > 0 && (
            <div className="mt-4 flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('viewed')}>
                <Eye className="mr-1 h-4 w-4" />
                Mark Viewed
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkStatusChange('ignored')}>
                <EyeOff className="mr-1 h-4 w-4" />
                Mark Ignored
              </Button>
              <span className="flex items-center text-sm text-[#a1a1aa]">
                {selectedLeads.length} selected
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#27272a]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-[#27272a]">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === leads.length && leads.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 rounded border-[#27272a]"
                    />
                  </th>
                  <th className="p-4 text-left text-sm font-medium text-[#a1a1aa]">Title</th>
                  <th className="p-4 text-left text-sm font-medium text-[#a1a1aa]">Subreddit</th>
                  <th className="p-4 text-left text-sm font-medium text-[#a1a1aa]">Monitor</th>
                  <th className="p-4 text-left text-sm font-medium text-[#a1a1aa]">Date</th>
                  <th className="p-4 text-left text-sm font-medium text-[#a1a1aa]">Status</th>
                  <th className="p-4 text-left text-sm font-medium text-[#a1a1aa]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#a1a1aa]">Loading...</td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#52525b]">No leads found</td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-[#27272a] hover:bg-[#18181b]/50 transition-colors">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => toggleSelectLead(lead.id)}
                          className="h-4 w-4 rounded border-[#27272a]"
                        />
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="text-left font-medium text-white hover:text-[#f97316]"
                        >
                          {lead.title?.length > 60 ? lead.title.substring(0, 60) + '...' : lead.title}
                        </button>
                      </td>
                      <td className="p-4 text-sm text-[#f97316]">r/{lead.subreddit}</td>
                      <td className="p-4 text-sm text-[#a1a1aa]">{lead.monitors?.name || '-'}</td>
                      <td className="p-4 text-sm text-[#52525b]">{new Date(lead.created_at).toLocaleDateString()}</td>
                      <td className="p-4">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                          lead.status === 'new' ? 'bg-[#f97316]/20 text-[#f97316]' :
                          lead.status === 'viewed' ? 'bg-[#10b981]/20 text-[#10b981]' :
                          'bg-[#18181b] text-[#52525b]'
                        }`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedLead(lead)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-[#27272a] p-4">
              <span className="text-sm text-[#52525b]">
                Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} leads
              </span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto border-[#27272a]">
            <CardHeader className="flex flex-row items-start justify-between">
              <CardTitle className="text-lg text-white pr-4">{selectedLead.title}</CardTitle>
              <button onClick={() => setSelectedLead(null)} className="text-[#71717a] hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-[#a1a1aa]">
                <span className="text-[#f97316]">r/{selectedLead.subreddit}</span>
                <span>by u/{selectedLead.author}</span>
                <span>{new Date(selectedLead.timestamp).toLocaleString()}</span>
              </div>
              <div className="rounded-lg bg-[#09090b] p-4">
                <p className="text-sm text-[#a1a1aa] whitespace-pre-wrap">
                  {selectedLead.content_snippet || 'No content available'}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={selectedLead.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-md bg-[#f97316] px-4 py-2 text-sm font-medium text-black shadow-[0_0_12px_rgba(249,115,22,0.3)] hover:bg-[#ea580c]"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Reddit
                </a>
                <Button variant="outline" onClick={() => { handleStatusChange(selectedLead.id, 'viewed'); setSelectedLead(null); }}>
                  Mark as Viewed
                </Button>
                <Button variant="outline" onClick={() => { handleStatusChange(selectedLead.id, 'ignored'); setSelectedLead(null); }}>
                  Mark as Ignored
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}