-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  whop_membership_id TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  usage_limits JSONB DEFAULT '{"monitors": 3, "leads": 100}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monitors table
CREATE TABLE public.monitors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subreddits TEXT[] DEFAULT '{}',
  keywords TEXT[] DEFAULT '{}',
  frequency_minutes INTEGER DEFAULT 60,
  active BOOLEAN DEFAULT true,
  last_run TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID REFERENCES public.monitors(id) ON DELETE CASCADE,
  reddit_post_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  subreddit TEXT NOT NULL,
  author TEXT,
  content_snippet TEXT,
  full_json JSONB,
  timestamp TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'ignored')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage logs table
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_monitors_user_id ON public.monitors(user_id);
CREATE INDEX idx_leads_monitor_id ON public.leads(monitor_id);
CREATE INDEX idx_leads_subreddit ON public.leads(subreddit);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_leads_timestamp ON public.leads(timestamp DESC);
CREATE INDEX idx_usage_logs_user_date ON public.usage_logs(user_id, date);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Monitors
CREATE POLICY "Users can view own monitors" ON public.monitors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create monitors" ON public.monitors
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monitors" ON public.monitors
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monitors" ON public.monitors
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for Leads
CREATE POLICY "Users can view own leads" ON public.leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.monitors m
      WHERE m.id = leads.monitor_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create leads" ON public.leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.monitors m
      WHERE m.id = leads.monitor_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own leads" ON public.leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.monitors m
      WHERE m.id = leads.monitor_id AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own leads" ON public.leads
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.monitors m
      WHERE m.id = leads.monitor_id AND m.user_id = auth.uid()
    )
  );

-- RLS Policies for Usage Logs
CREATE POLICY "Users can view own usage logs" ON public.usage_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create usage logs" ON public.usage_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check and enforce usage limits
CREATE OR REPLACE FUNCTION public.check_usage_limit(user_id UUID, limit_type TEXT, amount INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
  current_usage INTEGER;
  limit_value INTEGER;
  tier TEXT;
BEGIN
  SELECT subscription_tier INTO tier FROM profiles WHERE id = user_id;
  
  IF tier = 'enterprise' THEN
    RETURN TRUE;
  END IF;
  
  CASE limit_type
    WHEN 'monitors' THEN
      SELECT COALESCE(usage_limits->>'monitors', '3')::INTEGER INTO limit_value;
      SELECT COUNT(*) INTO current_usage FROM monitors WHERE user_id = user_id;
    WHEN 'leads' THEN
      SELECT COALESCE(usage_limits->>'leads', '100')::INTEGER INTO limit_value;
      SELECT COUNT(*) INTO current_usage FROM leads l
      JOIN monitors m ON l.monitor_id = m.id
      WHERE m.user_id = user_id;
    ELSE
      RETURN TRUE;
  END CASE;
  
  RETURN current_usage + amount <= limit_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;