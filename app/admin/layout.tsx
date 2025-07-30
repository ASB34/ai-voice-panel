'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Shield, 
  Activity, 
  Menu, 
  BarChart3, 
  Settings,
  UserCog,
  Building2,
  ArrowLeft,
  LogOut,
  User,
  DollarSign
} from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  name: string | null;
  isSuperAdmin: boolean;
}

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Only check auth if we're not on the login page
    if (pathname !== '/admin/login') {
      checkAdminAuth();
    } else {
      setLoading(false);
    }
  }, [pathname]);

  // Remove the problematic useEffect that was causing infinite loop
  // useEffect(() => {
  //   // Re-check auth on pathname change
  //   if (adminUser) {
  //     checkAdminAuth();
  //   }
  // }, [pathname]);

  const checkAdminAuth = async () => {
    try {
      const response = await fetch('/api/admin/auth/me', {
        credentials: 'include',
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        setAdminUser(data.admin);
      } else {
        // Silently handle 401 - it's expected when not logged in
        setAdminUser(null);
        if (pathname !== '/admin/login') {
          router.push('/admin/login');
        }
      }
    } catch (error) {
      // Silently handle network errors to avoid console spam
      setAdminUser(null);
      if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
      router.push('/admin/login');
    }
  };

  if (loading && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  // If we're on login page, just show the children
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!adminUser) {
    return null; // Will redirect to login
  }

  const navigation = [
    { href: `/admin`, icon: BarChart3, label: 'Dashboard' },
    { href: `/admin/users`, icon: Users, label: 'Users' },
    { href: `/admin/teams`, icon: Building2, label: 'Teams' },
    { href: `/admin/pricing`, icon: DollarSign, label: 'Pricing' },
    { href: `/admin/activity`, icon: Activity, label: 'Activity' },
    { href: `/admin/settings`, icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
            <div className="absolute right-0 top-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SidebarContent 
              navigation={navigation} 
              pathname={pathname} 
              adminUser={adminUser}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <SidebarContent 
          navigation={navigation} 
          pathname={pathname} 
          adminUser={adminUser}
          onLogout={handleLogout}
        />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top nav */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 pl-1 pt-1 sm:pl-3 sm:pt-3 lg:hidden">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 inline-flex h-12 w-12 items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>

        {/* Page header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <Shield className="h-8 w-8 text-red-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">Super Admin Panel</h1>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-sm text-gray-700">
                  <User className="h-4 w-4 mr-2" />
                  <span className="font-medium">{adminUser.name || adminUser.email}</span>
                  {adminUser.isSuperAdmin && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Super Admin
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
                <Link href="/dashboard">
                  <Button variant="outline" size="sm" className="flex items-center">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ 
  navigation, 
  pathname,
  adminUser,
  onLogout
}: { 
  navigation: any[], 
  pathname: string,
  adminUser: AdminUser,
  onLogout: () => void
}) {
  return (
    <div className="flex flex-1 flex-col bg-white border-r border-gray-200">
      <div className="flex flex-1 flex-col pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-5">
          <UserCog className="h-8 w-8 text-red-600 mr-3" />
          <span className="text-xl font-bold text-gray-900">Admin</span>
        </div>
        
        {/* Admin user info */}
        <div className="px-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-red-600" />
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {adminUser.name || adminUser.email}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {adminUser.isSuperAdmin ? 'Super Admin' : 'Admin'}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <nav className="mt-2 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-red-100 text-red-700 border-r-2 border-red-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon
                  className={`mr-3 flex-shrink-0 h-5 w-5 ${
                    isActive ? 'text-red-500' : 'text-gray-400 group-hover:text-gray-500'
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        {/* Logout button in sidebar */}
        <div className="px-2 pb-4">
          <button
            onClick={onLogout}
            className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
