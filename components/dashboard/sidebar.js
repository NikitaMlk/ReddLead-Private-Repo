'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/supabaseClient';
import { LogOut } from 'lucide-react';
import { cn } from '@/lib/utils/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: 'dashboard' },
  { name: 'Monitors', href: '/dashboard/monitors', icon: 'monitor' },
  { name: 'Leads', href: '/dashboard/leads', icon: 'target' },
  { name: 'Alerts', href: '/dashboard/alerts', icon: 'bell' },
  { name: 'Settings', href: '/dashboard/settings', icon: 'settings' },
];

export function Sidebar({ user, onSignOut }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  return (
    <div className="flex h-screen w-[260px] flex-col border-r border-[#27272a] bg-[#09090b]">
      <div className="flex h-16 items-center border-b border-[#27272a] px-6">
        <Link href="/dashboard" className="text-lg font-semibold text-white">
          RedditSignal
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-br from-[#c2410c] to-[#f97316] text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                  : 'text-[#a1a1aa] hover:bg-[#18181b] hover:text-white'
              )}
            >
              <NavIcon name={item.icon} className={cn('mr-3 h-5 w-5', isActive ? 'text-white' : '')} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#27272a] p-4">
        <div className="mb-2 text-xs text-[#71717a] truncate">
          {user?.email}
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center rounded-md px-3 py-2.5 text-sm font-medium text-[#a1a1aa] hover:bg-[#18181b] hover:text-white transition-all"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Sign out
        </button>
      </div>
    </div>
  );
}

function NavIcon({ name, className }) {
  const icons = {
    dashboard: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
    monitor: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    target: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bell: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4.929-5.944v-.001A6.002 6.002 0 007 5v-.001A2.032 2.032 0 012.405 3.595L3 4.2m12 12.8h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11" />
      </svg>
    ),
    settings: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };
  return icons[name] || null;
}