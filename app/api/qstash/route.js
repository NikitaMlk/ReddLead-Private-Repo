import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHmac } from 'crypto';

const LIMITS = {
  free: { monitors: 3, leads: 100, minFrequency: 60 },
  paid: { monitors: 10, leads: 10000, minFrequency: 2 },
  pro: { monitors: 10, leads: 10000, minFrequency: 2 },
  enterprise: { monitors: 999999, leads: 999999, minFrequency: 2 },
};

async function verifyQStashSignature(request) {
  const signature = request.headers.get('upstash-signature');
  const currentSignKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSignKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  
  if (!signature || !currentSignKey) {
    return false;
  }

  const body = await request.text();
  const bodyHash = createHmac('sha256', currentSignKey).update(body).digest('hex');
  
  if (signature === bodyHash) {
    return true;
  }

  if (nextSignKey) {
    const nextBodyHash = createHmac('sha256', nextSignKey).update(body).digest('hex');
    if (signature === nextBodyHash) {
      return true;
    }
  }

  return false;
}

export async function POST(request) {
  try {
    const isValid = await verifyQStashSignature(request);
    
    if (!isValid) {
      console.error('Invalid QStash signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: allMonitors, error: monitorsError } = await supabase
      .from('monitors')
      .select('*, profiles(subscription_tier)')
      .eq('active', true)
      .order('last_run', { ascending: true });

    if (monitorsError) {
      console.error('Error fetching monitors:', monitorsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!allMonitors || allMonitors.length === 0) {
      return NextResponse.json({ success: true, message: 'No active monitors' });
    }

    const now = new Date();
    let scansTriggered = 0;
    const errors = [];

    for (const monitor of allMonitors) {
      const tier = monitor.profiles?.subscription_tier || 'free';
      const limits = LIMITS[tier] || LIMITS.free;
      const minFrequency = limits.minFrequency;
      
      const lastRun = monitor.last_run ? new Date(monitor.last_run) : null;
      const minutesSinceLastRun = lastRun 
        ? (now.getTime() - lastRun.getTime()) / (1000 * 60) 
        : Infinity;

      if (minutesSinceLastRun >= minFrequency) {
        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/gather_leads`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              },
              body: JSON.stringify({ monitor_id: monitor.id }),
            }
          );

          if (response.ok) {
            await supabase
              .from('monitors')
              .update({ last_run: now.toISOString() })
              .eq('id', monitor.id);
            
            scansTriggered++;
          }
        } catch (err) {
          errors.push({ monitor_id: monitor.id, error: err.message });
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      scansTriggered,
      totalMonitors: allMonitors.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('QStash webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'QStash webhook endpoint',
    schedule: 'Every 2 minutes for paid tier, every 60 minutes for free tier'
  });
}