import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, FileText, Search, CheckCircle, XCircle, AlertCircle, Hourglass, User, Users, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface TeamLeaveApplication {
  id: string;
  user_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  applied_at: string;
  approved_by: string | null;
  approved_at: string | null;
  rejected_reason: string | null;
  is_emergency: boolean;
  documents: any;
  user: {
    full_name: string;
    employee_id: string;
    department: string;
    employment_type: string;
  };
}

interface TeamLeaveProps {
  userRole: 'employee' | 'manager' | 'admin';
}

const TeamLeaves = ({ userRole }: TeamLeaveProps) => {
  const [applications, setApplications] = useState<TeamLeaveApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<TeamLeaveApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<TeamLeaveApplication | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (userRole === 'manager' || userRole === 'admin') {
      loadTeamApplications();
    }
  }, [userRole]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, departmentFilter]);

  const loadTeamApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('leave_applications')
        .select(`
          *,
          user:users!user_id(
            full_name,
            employee_id,
            department,
            employment_type
          )
        `)
        .order('applied_at', { ascending: false });

      // If manager, only show applications from their team
      if (userRole === 'manager') {
        // Get current user's profile to find their team
        const { data: managerProfile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_id', user.id)
          .single();

        if (managerProfile) {
          query = query.in('user_id', [
            // This would be a subquery to get team members
            // For now, we'll show all applications as a demo
          ]);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading team applications:', error);
      toast({
        title: "Error",
        description: "Failed to load team leave applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
    let filtered = applications;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(app => 
        app.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.leave_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by department
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(app => app.user.department === departmentFilter);
    }

    setFilteredApplications(filtered);
  };

  const handleApproveApplication = async (applicationId: string) => {
    setProcessingId(applicationId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('leave_applications')
        .update({
          status: 'approved',
          approved_by: user.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Add to audit log
      await supabase
        .from('leave_audit_log')
        .insert({
          leave_application_id: applicationId,
          action: 'approved',
          performed_by: user.id,
          old_status: 'pending',
          new_status: 'approved',
          comments: 'Approved by manager'
        });

      // Update leave balance (deduct used days)
      const application = applications.find(app => app.id === applicationId);
      if (application) {
        await supabase
          .from('leave_balances')
          .update({
            used: supabase.raw('used + ?', [application.total_days])
          })
          .eq('user_id', application.user_id)
          .eq('leave_type', application.leave_type)
          .eq('year', new Date().getFullYear());
      }

      toast({
        title: "Application Approved",
        description: "The leave application has been approved successfully.",
      });

      loadTeamApplications();
    } catch (error) {
      console.error('Error approving application:', error);
      toast({
        title: "Approval Failed",
        description: "Failed to approve the leave application.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectApplication = async (applicationId: string, reason: string) => {
    setProcessingId(applicationId);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('leave_applications')
        .update({
          status: 'rejected',
          approved_by: user.id,
          approved_at: new Date().toISOString(),
          rejected_reason: reason
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Add to audit log
      await supabase
        .from('leave_audit_log')
        .insert({
          leave_application_id: applicationId,
          action: 'rejected',
          performed_by: user.id,
          old_status: 'pending',
          new_status: 'rejected',
          comments: reason
        });

      toast({
        title: "Application Rejected",
        description: "The leave application has been rejected.",
      });

      loadTeamApplications();
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting application:', error);
      toast({
        title: "Rejection Failed",
        description: "Failed to reject the leave application.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Hourglass className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type) {
      case 'sick':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'casual':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'vacation':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'academic':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'comp_off':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (userRole === 'employee') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Leaves</h1>
          <p className="text-muted-foreground mt-2">
            Access denied. This section is only available to managers and administrators.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Leaves</h1>
          <p className="text-muted-foreground mt-2">Loading team leave applications...</p>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  const departments = [...new Set(applications.map(app => app.user.department).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Team Leaves</h1>
        <p className="text-muted-foreground mt-2">
          Review and manage team member leave applications
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Hourglass className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-foreground">
                  {applications.filter(app => app.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                <p className="text-2xl font-bold text-foreground">
                  {applications.filter(app => app.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                <p className="text-2xl font-bold text-foreground">
                  {applications.filter(app => app.status === 'rejected').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-foreground">{applications.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filter Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name, ID, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications List */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Applications Found</h3>
              <p className="text-muted-foreground">
                {applications.length === 0 
                  ? "No team leave applications to review."
                  : "No applications match your current filters."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredApplications.map((application) => (
            <Card key={application.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-foreground">
                          {application.user.full_name} ({application.user.employee_id})
                        </span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {application.user.department}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {application.user.employment_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={getLeaveTypeColor(application.leave_type)}>
                        {application.leave_type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(application.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(application.status)}
                          {application.status.toUpperCase()}
                        </div>
                      </Badge>
                      {application.is_emergency && (
                        <Badge variant="destructive">EMERGENCY</Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(parseISO(application.start_date), 'MMM dd, yyyy')} - {format(parseISO(application.end_date), 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {application.total_days} days
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* View Details Button */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Leave Application Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium">Employee</label>
                              <p className="text-sm text-muted-foreground">
                                {application.user.full_name} ({application.user.employee_id})
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Department</label>
                              <p className="text-sm text-muted-foreground">{application.user.department}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Leave Type</label>
                              <p className="text-sm text-muted-foreground">
                                {application.leave_type.replace('_', ' ').toUpperCase()}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Duration</label>
                              <p className="text-sm text-muted-foreground">{application.total_days} days</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Start Date</label>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(application.start_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">End Date</label>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(application.end_date), 'MMM dd, yyyy')}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium">Reason</label>
                            <p className="text-sm text-muted-foreground mt-1">{application.reason}</p>
                          </div>
                          
                          {application.documents && application.documents.files && (
                            <div>
                              <label className="text-sm font-medium">Attached Documents</label>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {application.documents.files.map((file: string, index: number) => (
                                  <Badge key={index} variant="outline" className="cursor-pointer">
                                    <FileText className="w-3 h-3 mr-1" />
                                    Document {index + 1}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Action Buttons for Pending Applications */}
                    {application.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApproveApplication(application.id)}
                          disabled={processingId === application.id}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          {processingId === application.id ? 'Processing...' : 'Approve'}
                        </Button>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={processingId === application.id}
                            >
                              Reject
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Reject Leave Application</AlertDialogTitle>
                              <AlertDialogDescription>
                                Please provide a reason for rejecting this leave application.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <div className="space-y-4">
                              <Textarea
                                placeholder="Enter rejection reason..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                              />
                            </div>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={() => setRejectionReason('')}>
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRejectApplication(application.id, rejectionReason)}
                                disabled={!rejectionReason.trim()}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Reject Application
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Reason</h4>
                    <p className="text-sm text-muted-foreground">{application.reason}</p>
                  </div>
                  
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Applied on:</span>
                    <span className="text-muted-foreground ml-1">
                      {format(parseISO(application.applied_at), 'MMM dd, yyyy at hh:mm a')}
                    </span>
                  </div>
                  
                  {application.rejected_reason && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-1">Rejection Reason</h4>
                      <p className="text-sm text-red-700">{application.rejected_reason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default TeamLeaves;