'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Activity, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  User,
  Shield,
  CreditCard,
  Settings,
  Eye
} from 'lucide-react';

type ActivityLog = {
  id: number;
  userId: number | null;
  action: string;
  description: string;
  createdAt: Date;
  ipAddress: string | null;
  userAgent: string;
  user: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  } | null;
};

type ActivityLogsData = {
  activities: ActivityLog[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'CREATE_USER', label: 'User Created' },
  { value: 'UPDATE_USER_ROLE', label: 'Role Updated' },
  { value: 'DELETE_USER', label: 'User Deleted' },
  { value: 'RESET_USER_PASSWORD', label: 'Password Reset' },
  { value: 'UPDATE_TEAM_SUBSCRIPTION', label: 'Subscription Updated' },
  { value: 'LOGIN', label: 'User Login' },
  { value: 'LOGOUT', label: 'User Logout' }
];

export default function AdminActivityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activityData, setActivityData] = useState<ActivityLogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [actionFilter, setActionFilter] = useState(searchParams.get('action') || 'all');

  useEffect(() => {
    fetchActivity();
  }, [currentPage, actionFilter]);

  const fetchActivity = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (actionFilter !== 'all') {
        params.set('action', actionFilter);
      }
      
      const response = await fetch(`/api/admin/activity?${params}`);
      if (response.ok) {
        const data = await response.json();
        setActivityData(data);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    if (actionFilter !== 'all') {
      params.set('action', actionFilter);
    } else {
      params.delete('action');
    }
    router.push(`/admin/activity?${params.toString()}`);
  };

  const handleFilterChange = (value: string) => {
    setActionFilter(value);
    setCurrentPage(1);
    const params = new URLSearchParams();
    params.set('page', '1');
    if (value !== 'all') {
      params.set('action', value);
    }
    router.push(`/admin/activity?${params.toString()}`);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('USER')) return <User className="h-4 w-4" />;
    if (action.includes('ROLE')) return <Shield className="h-4 w-4" />;
    if (action.includes('SUBSCRIPTION')) return <CreditCard className="h-4 w-4" />;
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return <Eye className="h-4 w-4" />;
    return <Settings className="h-4 w-4" />;
  };

  const getActionBadge = (action: string) => {
    const colors = {
      CREATE_USER: 'bg-green-100 text-green-800',
      UPDATE_USER_ROLE: 'bg-blue-100 text-blue-800',
      DELETE_USER: 'bg-red-100 text-red-800',
      RESET_USER_PASSWORD: 'bg-yellow-100 text-yellow-800',
      UPDATE_TEAM_SUBSCRIPTION: 'bg-purple-100 text-purple-800',
      LOGIN: 'bg-gray-100 text-gray-800',
      LOGOUT: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[action as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {action.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const formatUserAgent = (userAgent: string) => {
    if (!userAgent) return 'Unknown';
    
    // Extract browser info from user agent
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    
    return 'Other';
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Activity Logs</h2>
          <p className="text-muted-foreground">
            Monitor system activities and user actions
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Action Type:</span>
              <Select value={actionFilter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activities ({activityData?.totalCount || 0})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activityData?.activities.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No activity logs found
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {activityData.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getActionIcon(activity.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getActionBadge(activity.action)}
                            {activity.user && (
                              <span className="text-sm text-muted-foreground">
                                by {activity.user.name || activity.user.email}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-900 mb-2">
                            {activity.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <span>
                              {new Date(activity.createdAt).toLocaleString()}
                            </span>
                            {activity.ipAddress && (
                              <span>IP: {activity.ipAddress}</span>
                            )}
                            {activity.userAgent && (
                              <span>Browser: {formatUserAgent(activity.userAgent)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {activityData.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Page {currentPage} of {activityData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === activityData.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
