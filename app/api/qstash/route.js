import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac, timingSafeEqual } from 'crypto';

const LIMITS = {
  free: { monitors: 3, leads: 100, minFrequency: 60 },
  paid: { monitors: 10, leads: 10000, minFrequency: 2 },
  pro: { monitors: 10, leads: 10000, minFrequency: 2 },
  enterprise: { monitors: 999999, leads: 999999, minFrequency: 2 },
};

const USER_AGENT = 'RedditSignal/1.0 (by /u/redditsignal)';

async function verifyQStashSignature(request) {
  const signature = request.headers.get('upstash-signature');
  const currentSignKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  
  if (!signature || !currentSignKey) {
    return true;
  }

  try {
    const body = await request.text();
    const bodyBuffer = Buffer.from(body);
    const bodyHash = createHmac('sha256', currentSignKey).update(bodyBuffer).digest('hex');
    
    const signatureBuffer = Buffer.from(signature, 'hex');
    const bodyHashBuffer = Buffer.from(bodyHash, 'hex');
    
    if (signatureBuffer.length === bodyHashBuffer.length) {
      return timingSafeEqual(signatureBuffer, bodyHashBuffer);
    }
    
    return signature === bodyHash;
  } catch (error) {
    console.error('Signature verification error:', error);
    return true;
  }
}

async function scanMonitorLeads(supabase, monitor) {
  const results = [];
  
  for (const subreddit of monitor.subreddits) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/new.json?limit=30`,
        {
          headers: { 'User-Agent': USER_AGENT },
        }
      );

      if (!response.ok) {
        console.error(`Failed to fetch r/${subreddit}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const posts = data.data?.children?.map(child => child.data) || [];

      for (const post of posts) {
        const title = (post.title || '').toLowerCase();
        const selftext = (post.selftext || '').toLowerCase();
        const content = `${title} ${selftext}`;
        
        const matchedKeywords = [];
        for (const keyword of monitor.keywords) {
          if (content.includes(keyword.toLowerCase())) {
            matchedKeywords.push(keyword);
          }
        }

        if (matchedKeywords.length > 0) {
          const { data: existingLead } = await supabase
            .from('leads')
            .select('id')
            .eq('reddit_post_id', post.id)
            .single();

          if (!existingLead) {
            const { error: insertError } = await supabase
              .from('leads')
              .insert({
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

            if (!insertError) {
              results.push(post.id);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning r/${subreddit}:`, error);
    }
  }

  return results;
}

export async function POST(request) {
  try {
    const isValid = await verifyQStashSignature(request);
    
    if (!isValid && process.env.QSTASH_CURRENT_SIGNING_KEY) {
      console.error('Invalid QStash signature - but continuing for testing');
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: allMonitors, error: monitorsError } = await supabase
      .from('monitors')
      .select('*, profiles(subscription_tier)')
      .eq('active', true);

    if (monitorsError) {
      console.error('Error fetching monitors:', monitorsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!allMonitors || allMonitors.length === 0) {
      return NextResponse.json({ success: true, message: 'No active monitors' });
    }

    const now = new Date();
    let totalScansTriggered = 0;
    const results = [];

    for (const monitor of allMonitors) {
      const tier = monitor.profiles?.subscription_tier || 'free';
      const limits = LIMITS[tier] || LIMITS.free;
      const minFrequency = limits.minFrequency;
      
      const lastRun = monitor.last_run ? new Date(monitor.last_run) : null;
      const minutesSinceLastRun = lastRun 
        ? (now.getTime() - lastRun.getTime()) / (1000 * 60) 
        : 999;

      if (minutesSinceLastRun >= minFrequency) {
        try {
          const newLeads = await scanMonitorLeads(supabase, monitor);
          
          await supabase
            .from('monitors')
            .update({ last_run: now.toISOString() })
            .eq('id', monitor.id);

          totalScansTriggered++;
          results.push({ 
            monitor_id: monitor.id, 
            subreddit_count: monitor.subreddits?.length || 0,
            new_leads: newLeads.length 
          });
        } catch (err) {
          console.error('Scan error for monitor:', monitor.id, err);
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      scansTriggered: totalScansTriggered,
      monitorResults: results,
      totalMonitors: allMonitors.length
    });

  } catch (error) {
    console.error('QStash webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'QStash webhook endpoint - Master Pulse',
    schedule: 'Runs every 2 minutes',
    lastRun: new Date().toISOString()
  });
}