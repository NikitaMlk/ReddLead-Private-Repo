import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const LIMITS = {
  free: { monitors: 3, leads: 100 },
  paid: { monitors: 10, leads: 10000 },
  pro: { monitors: 10, leads: 10000 },
  enterprise: { monitors: 999999, leads: 999999 },
};

export async function POST(request) {
  try {
    const { monitorId } = await request.json();

    if (!monitorId) {
      return NextResponse.json({ success: false, message: 'monitorId is required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: monitor, error: monitorError } = await supabase
      .from('monitors')
      .select('*')
      .eq('id', monitorId)
      .single();

    if (monitorError || !monitor) {
      console.error('Monitor not found:', monitorId, monitorError);
      return NextResponse.json({ success: false, message: 'Monitor not found' }, { status: 200 });
    }

    const userResponse = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', monitor.user_id)
      .single();

    const tier = userResponse.data?.subscription_tier || 'free';
    const limits = LIMITS[tier] || LIMITS.free;

    const { count: currentLeads } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('monitor_id', monitor.id);

    if (currentLeads >= limits.leads) {
      return NextResponse.json({ success: false, message: 'Lead limit reached' }, { status: 200 });
    }

    const remainingSlots = limits.leads - currentLeads;
    const results = [];
    const postsToInsert = [];

    for (const subreddit of monitor.subreddits) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/new.json?limit=30`,
        {
          headers: {
            'User-Agent': 'RedditSignal/1.0 (by /u/redditsignal)',
          },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch r/${subreddit}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const posts = data.data.children.map(child => child.data);

      const matchedPosts = posts.filter(post => {
        const content = `${post.title} ${post.selftext || ''}`.toLowerCase();
        return monitor.keywords.some(keyword => 
          content.includes(keyword.toLowerCase())
        );
      });

      for (const post of matchedPosts) {
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('reddit_post_id', post.id)
          .single();

        if (!existingLead && results.length + postsToInsert.length < remainingSlots) {
          postsToInsert.push({
            monitor_id: monitor.id,
            reddit_post_id: post.id,
            title: post.title,
            url: `https://reddit.com${post.permalink}`,
            subreddit: post.subreddit,
            author: post.author,
            content_snippet: post.selftext?.substring(0, 500) || '',
            full_json: post,
            timestamp: new Date(post.created_utc * 1000).toISOString(),
            status: 'new',
          });
        }
      }
    }

    if (postsToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('leads')
        .insert(postsToInsert);

      if (!insertError) {
        results.push(...postsToInsert.map(p => p.reddit_post_id));
      }
    }

    await supabase
      .from('monitors')
      .update({ last_run: new Date().toISOString() })
      .eq('id', monitorId);

    return NextResponse.json({ 
      success: true, 
      newLeads: results.length,
      message: results.length > 0 
        ? `Found ${results.length} new leads` 
        : 'No new leads found'
    });

  } catch (error) {
    console.error('Ingest error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}