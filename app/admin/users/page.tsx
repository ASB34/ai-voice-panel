'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { 
  Users, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  DollarSign,
  Activity,
  Phone,
  MessageSquare,
  Clock,
  Save
} from 'lucide-react';

type User = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
  subscription?: {
    planName: string;
    status: string;
    amount: number;
    billingPeriod: string;
    currentPeriodEnd: Date;
    planId?: number;
  };
  usage?: {
    conversations: number;
    phoneNumbers: number;
    minutes: number;
    elevenlabsCost: number;
  };
};

type UsersData = {
  users: User[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [usersData, setUsersData] = useState<UsersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState({ 
    name: '', 
    email: '', 
    role: '', 
    planId: '',
    newPassword: ''
  });
  const [saving, setSaving] = useState(false);
  const [availablePlans, setAvailablePlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(false);

  useEffect(() => {
    fetchUsers();
    loadAvailablePlans();
  }, [currentPage, searchTerm]);

  const loadAvailablePlans = async () => {
    setLoadingPlans(true);
    try {
      const response = await fetch('/api/billing/plans');
      if (response.ok) {
        const data = await response.json();
        setAvailablePlans(data.plans || []);
      }
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        search: searchTerm
      });
      
      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsersData(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    console.log('Edit user:', user.id);
    setEditingUser(user);
    setEditFormData({
      name: user.name || '',
      email: user.email,
      role: user.role,
      planId: user.subscription?.planId?.toString() || 'no-change',
      newPassword: ''
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;
    
    setSaving(true);
    try {
      const requestData = {
        name: editFormData.name,
        email: editFormData.email,
        role: editFormData.role,
        planId: editFormData.planId && editFormData.planId !== 'no-change' ? editFormData.planId : null,
        newPassword: editFormData.newPassword || null
      };
      
      console.log('Updating user with data:', requestData);
      
      const response = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });
      
      if (response.ok) {
        console.log('User updated successfully');
        setEditingUser(null);
        fetchUsers(); // Refresh the list
      } else {
        const error = await response.json();
        alert(`Failed to update user: ${error.error}`);
      }
    } catch (error) {
      console.error('Update user error:', error);
      alert('Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser) return;
    
    if (confirm(`Are you sure you want to reset password for ${editingUser.email}? A new temporary password will be generated and sent to the user.`)) {
      try {
        const response = await fetch(`/api/admin/users/${editingUser.id}/reset-password`, {
          method: 'POST'
        });
        
        if (response.ok) {
          const data = await response.json();
          alert(`Password reset successfully. Temporary password: ${data.temporaryPassword}\nPlease share this with the user securely.`);
        } else {
          const error = await response.json();
          alert(`Failed to reset password: ${error.error}`);
        }
      } catch (error) {
        console.error('Reset password error:', error);
        alert('Failed to reset password');
      }
    }
  };

  const handleManagePermissions = (userId: number) => {
    console.log('Manage permissions for user:', userId);
    // TODO: Permission management modal'ını aç
    alert(`Permission management for user ${userId} will be implemented`);
  };

  const handleAddUser = () => {
    console.log('Add new user');
    // TODO: Add user modal'ını aç veya add sayfasına yönlendir
    router.push('/admin/users/add');
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (confirm(`Are you sure you want to delete user: ${userEmail}?`)) {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          console.log('User deleted successfully');
          fetchUsers(); // Refresh the list
        } else {
          const error = await response.json();
          alert(`Failed to delete user: ${error.message}`);
        }
      } catch (error) {
        console.error('Delete user error:', error);
        alert('Failed to delete user');
      }
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    if (searchTerm) {
      params.set('search', searchTerm);
    } else {
      params.delete('search');
    }
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    const params = new URLSearchParams();
    params.set('page', '1');
    if (searchTerm) {
      params.set('search', searchTerm);
    }
    router.push(`/admin/users?${params.toString()}`);
  };

  const getRoleBadge = (role: string) => {
    const colors = {
      owner: 'bg-red-100 text-red-800',
      admin: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded animate-pulse" />
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
          <h2 className="text-3xl font-bold tracking-tight">Users Management</h2>
          <p className="text-muted-foreground">
            Manage user accounts and permissions
          </p>
        </div>
        <Button onClick={handleAddUser}>
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleSearch} className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Users ({usersData?.totalCount || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!usersData?.users.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {usersData.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="font-medium">{user.name || 'No name'}</div>
                      {getRoleBadge(user.role)}
                    </div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                    
                    {/* Subscription info */}
                    {user.subscription && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-3 w-3 text-green-600" />
                          <span className="text-xs font-medium text-green-700">
                            {user.subscription.planName} - ${(user.subscription.amount / 100).toFixed(0)}/month
                          </span>
                          <Badge variant={user.subscription.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                            {user.subscription.status}
                          </Badge>
                        </div>
                        
                        {/* Usage stats */}
                        {user.usage && (
                          <div className="grid grid-cols-4 gap-2 mt-2">
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3 text-blue-500" />
                              <span className="text-xs text-gray-600">{user.usage.conversations}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 text-green-500" />
                              <span className="text-xs text-gray-600">{user.usage.phoneNumbers}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3 text-orange-500" />
                              <span className="text-xs text-gray-600">{user.usage.minutes}min</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Activity className="h-3 w-3 text-red-500" />
                              <span className="text-xs text-gray-600">${(user.usage.elevenlabsCost / 100).toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          title="Edit User"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleManagePermissions(user.id)}
                          title="Manage Permissions"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteUser(user.id, user.email)}
                          title="Delete User"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {usersData.totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {usersData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === usersData.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User: {editingUser?.name || editingUser?.email}</DialogTitle>
            <DialogDescription>
              Update user information, change subscription plan, or reset password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm text-gray-700">Basic Information</h4>
              
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({...editFormData, name: e.target.value})}
                  placeholder="User name"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-role">Role</Label>
                <Select value={editFormData.role} onValueChange={(value) => setEditFormData({...editFormData, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subscription */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm text-gray-700">Subscription Plan</h4>
              
              <div>
                <Label htmlFor="edit-plan">Current Plan</Label>
                {editingUser?.subscription && (
                  <div className="text-sm text-gray-600 mb-2">
                    Current: {editingUser.subscription.planName} - ${(editingUser.subscription.amount / 100).toFixed(0)}/month
                    <Badge variant={editingUser.subscription.status === 'active' ? 'default' : 'secondary'} className="ml-2">
                      {editingUser.subscription.status}
                    </Badge>
                  </div>
                )}
                
                <Select value={editFormData.planId} onValueChange={(value) => setEditFormData({...editFormData, planId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select new plan (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-change">No change</SelectItem>
                    {availablePlans.map((plan) => (
                      <SelectItem key={plan.id} value={plan.id.toString()}>
                        {plan.displayName} - ${(plan.monthlyPrice / 100).toFixed(0)}/month
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Changing the plan will update the user's subscription immediately
                </p>
              </div>
            </div>

            {/* Password */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="font-medium text-sm text-gray-700">Password Management</h4>
              
              <div>
                <Label htmlFor="edit-password">New Password (Optional)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editFormData.newPassword}
                  onChange={(e) => setEditFormData({...editFormData, newPassword: e.target.value})}
                  placeholder="Leave empty to keep current password"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If provided, this will become the user's new password
                </p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-sm">Reset Password</div>
                  <div className="text-xs text-gray-600">Generate a temporary password for the user</div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={saving}
                >
                  Reset Password
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 border-t pt-4">
              <Button 
                variant="outline" 
                onClick={() => setEditingUser(null)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveUser}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
