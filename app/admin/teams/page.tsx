'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Users, 
  Edit, 
  ChevronLeft, 
  ChevronRight,
  CreditCard
} from 'lucide-react';
import { updateTeamSubscription } from '@/app/admin/actions';

type TeamMember = {
  user: {
    id: number;
    name: string | null;
    email: string;
    role: string;
  };
  role: string;
};

type Team = {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeProductId: string | null;
  planName: string | null;
  subscriptionStatus: string | null;
  teamMembers: TeamMember[];
};

type TeamsData = {
  teams: Team[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
};

export default function AdminTeamsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [teamsData, setTeamsData] = useState<TeamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get('page')) || 1);
  
  // Dialog states
  const [editSubscriptionOpen, setEditSubscriptionOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  
  // Form states
  const [subscriptionForm, setSubscriptionForm] = useState({
    planName: '',
    subscriptionStatus: 'active'
  });

  useEffect(() => {
    fetchTeams();
  }, [currentPage]);

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10'
      });
      
      const response = await fetch(`/api/admin/teams?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTeamsData(data);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/admin/teams?${params.toString()}`);
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;
    
    const formData = new FormData();
    formData.append('teamId', selectedTeam.id.toString());
    formData.append('planName', subscriptionForm.planName);
    formData.append('subscriptionStatus', subscriptionForm.subscriptionStatus);

    const result = await updateTeamSubscription({}, formData);
    if (result.success) {
      console.log(result.success);
      setEditSubscriptionOpen(false);
      fetchTeams();
    } else {
      console.error(result.error || 'Failed to update subscription');
    }
  };

  const getSubscriptionBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">No Subscription</Badge>;
    
    const variants = {
      active: 'bg-green-100 text-green-800',
      trialing: 'bg-blue-100 text-blue-800',
      canceled: 'bg-red-100 text-red-800',
      unpaid: 'bg-yellow-100 text-yellow-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status}
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
          <h2 className="text-3xl font-bold tracking-tight">Teams Management</h2>
          <p className="text-muted-foreground">
            Manage team subscriptions and memberships
          </p>
        </div>
      </div>

      {/* Teams table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Teams ({teamsData?.totalCount || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!teamsData?.teams.length ? (
            <div className="text-center py-8 text-muted-foreground">
              No teams found
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teamsData.teams.map((team) => (
                    <TableRow key={team.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{team.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {team.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{team.teamMembers.length}</span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {team.teamMembers.map(member => member.user.email).join(', ')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getSubscriptionBadge(team.subscriptionStatus)}
                          {team.planName && (
                            <div className="text-sm text-muted-foreground">
                              {team.planName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(team.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTeam(team);
                              setSubscriptionForm({
                                planName: team.planName || '',
                                subscriptionStatus: team.subscriptionStatus || 'active'
                              });
                              setEditSubscriptionOpen(true);
                            }}
                          >
                            <CreditCard className="h-4 w-4 mr-2" />
                            Subscription
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {teamsData.totalPages > 1 && (
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
                    Page {currentPage} of {teamsData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === teamsData.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Subscription Dialog */}
      <Dialog open={editSubscriptionOpen} onOpenChange={setEditSubscriptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team Subscription</DialogTitle>
            <DialogDescription>
              Update subscription details for {selectedTeam?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSubscription} className="space-y-4">
            <div>
              <Label htmlFor="planName">Plan Name</Label>
              <input
                id="planName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={subscriptionForm.planName}
                onChange={(e) => setSubscriptionForm(prev => ({ ...prev, planName: e.target.value }))}
                placeholder="e.g. Pro Plan, Basic Plan"
              />
            </div>
            <div>
              <Label htmlFor="subscriptionStatus">Status</Label>
              <Select 
                value={subscriptionForm.subscriptionStatus} 
                onValueChange={(value) => setSubscriptionForm(prev => ({ ...prev, subscriptionStatus: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="trialing">Trialing</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditSubscriptionOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Update Subscription</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
