'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart, BarChart3, Settings, TrainFront, Ticket, Sparkles } from 'lucide-react';
import { useFavoritesStore } from '@/store/favoritesStore';
import { clsx } from 'clsx';

export default function Navigation() {
  const pathname = usePathname();
  const { selectedTrainNumber } = useFavoritesStore();

  const analyticsHref = selectedTrainNumber ? `/analytics/${selectedTrainNumber}` : '/analytics';

  const navItems = [
    { name: 'Search', href: '/', icon: Search },
    { name: 'AI Assistant', href: '/ai-assistant', icon: Sparkles },
    { name: 'PNR Status', href: '/pnr', icon: Ticket },
    { name: 'Favorites', href: '/favorites', icon: Heart },
    { name: 'Analytics', href: analyticsHref, icon: BarChart3 },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <>
      {/* Desktop Header */}
      <header className="sticky top-0 z-40 hidden w-full border-b border-gray-100 bg-white/80 backdrop-blur-md md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/30 transition-transform group-hover:scale-105">
              <TrainFront className="h-5 w-5" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 tracking-tight text-lg">RailRadar</span>
              <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">LIVE</span>
            </div>
          </Link>

          <nav className="flex items-center gap-1 rounded-full bg-gray-100/80 p-1.5 border border-gray-200/50">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.name === 'Analytics' && pathname.startsWith('/analytics'));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-white text-blue-600 shadow-sm shadow-gray-200/80'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200/80 bg-white/90 px-4 py-2 backdrop-blur-lg md:hidden">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.name === 'Analytics' && pathname.startsWith('/analytics'));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  'flex flex-col items-center gap-1 py-1 px-3 text-xs font-medium transition-colors',
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                )}
              >
                <Icon className={clsx('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

