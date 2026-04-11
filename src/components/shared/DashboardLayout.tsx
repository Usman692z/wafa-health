'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  Heart, Bell, Sun, Moon, Menu, X, LogOut, ChevronRight, Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/Avatar';
import { signOutUser } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { subscribeNotifications, markNotificationRead } from '@/lib/firestore';
import toast from 'react-hot-toast';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title: string;
}

export function DashboardLayout({ children, navItems, title }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { profile, clearAuth } = useAuthStore();
  const { notifications, unreadCount, setNotifications, markRead } = useNotificationStore();

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = subscribeNotifications(profile.uid, setNotifications);
    return () => unsub();
  }, [profile?.uid]);

  async function handleLogout() {
    await signOutUser();
    clearAuth();
    router.push('/login');
    toast.success('Logged out successfully');
  }

  async function handleNotifClick(id: string) {
    markRead(id);
    await markNotificationRead(id);
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 overflow-hidden">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed lg:static inset-y-0 left-0 z-50 w-64 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-100 dark:border-slate-700 transition-transform duration-300',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900 dark:text-white">medi<span className="text-blue-500">GO</span></span>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile */}
        {profile && (
          <div className="p-5 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <Avatar name={profile.name} src={profile.avatar} size="md" online={true} />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-slate-900 dark:text-white truncate">{profile.name}</p>
                <p className="text-xs text-slate-500 capitalize">{profile.role}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  active
                    ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                )}
              >
                <item.icon className={cn('w-5 h-5 shrink-0', active ? 'text-blue-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300')} />
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
                {active && <ChevronRight className="w-4 h-4 text-blue-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-4 px-4 sm:px-6 h-16 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-white hidden sm:block">{title}</h1>

          <div className="flex-1" />

          {/* Theme Toggle */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 dark:hover:text-slate-200 relative transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-white">Notifications</h3>
                  {unreadCount > 0 && <span className="text-xs text-blue-500">{unreadCount} new</span>}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-sm">No notifications yet</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotifClick(n.id)}
                        className={cn('px-4 py-3 border-b border-slate-50 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors', !n.isRead && 'bg-blue-50/50 dark:bg-blue-950/20')}
                      >
                        <p className={cn('text-sm', !n.isRead ? 'font-medium text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300')}>{n.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{n.body}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          {profile && <Avatar name={profile.name} src={profile.avatar} size="sm" />}
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
