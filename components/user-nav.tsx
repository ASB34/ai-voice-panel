'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { LogOut, Settings, User, Shield } from 'lucide-react';
import { LanguageSwitcher } from './language-switcher';
import { useEffect, useState } from 'react';

interface UserData {
  user: {
    id: number;
    email: string;
    name?: string;
  };
  subscription?: any;
  team?: any;
  role?: string;
}

export function UserNav() {
  const router = useRouter();
  const t = useTranslations('auth');
  const locale = useLocale();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          console.log('User not authenticated, status:', response.status);
          // Don't redirect immediately, just show not authenticated state
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, locale]);

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      if (response.ok) {
        router.push(`/${locale}/sign-in`);
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <LanguageSwitcher />
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarFallback>...</AvatarFallback>
          </Avatar>
        </Button>
      </div>
    );
  }

  if (!user || !user.user) {
    // Show login button instead of nothing
    return (
      <div className="flex items-center space-x-2">
        <LanguageSwitcher />
        <Button 
          variant="outline" 
          onClick={() => router.push(`/${locale}/sign-in`)}
        >
          Sign In
        </Button>
      </div>
    );
  }

  const userInitials = user?.user?.name 
    ? user.user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : user?.user?.email?.charAt(0).toUpperCase() || '?';

  return (
    <div className="flex items-center space-x-2">
      <LanguageSwitcher />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.user?.name || 'User'}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => router.push(`/${locale}/account`)}>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/${locale}/settings`)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            {(user?.role === 'owner' || user?.role === 'admin') && (
              <DropdownMenuItem onClick={() => router.push('/admin')}>
                <Shield className="mr-2 h-4 w-4" />
                <span>Admin Panel</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>{t('signOut')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
