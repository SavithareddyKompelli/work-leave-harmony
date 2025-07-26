import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, FileText, Search, X, CheckCircle, XCircle, AlertCircle, Hourglass } from 'lucide-react';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface LeaveApplication {
  id: string;
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
  cancelled_at: string | null;
  is_emergency: boolean;
  documents: any;
}

const MyLeaves = () => {
  const [applications, setApplications] = useState<LeaveApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<LeaveApplication[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadApplications();
  }, []);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter, typeFilter]);

  const loadApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('leave_applications')
        .select(`
          *,
          approved_by:users!approved_by(full_name)
        `)
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        title: "Error",
        description: "Failed to load leave applications.",
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
        app.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.leave_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(app => app.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== 'all') {
      filtered = filtered.filter(app => app.leave_type === typeFilter);
    }

    setFilteredApplications(filtered);
  };

  const canCancelApplication = (application: LeaveApplication) => {
    if (application.status !== 'pending' && application.status !== 'approved') {
      return false;
    }
    
    const startDate = parseISO(application.start_date);
    const today = new Date();
    
    // Can cancel if start date is in the future
    return isAfter(startDate, today);
  };

  const handleCancelApplication = async (applicationId: string) => {
    setCancellingId(applicationId);
    
    try {
      const { error } = await supabase
        .from('leave_applications')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      // Add to audit log
      await supabase
        .from('leave_audit_log')
        .insert({
          leave_application_id: applicationId,
          action: 'cancelled',
          performed_by: (await supabase.auth.getUser()).data.user?.id,
          old_status: applications.find(app => app.id === applicationId)?.status,
          new_status: 'cancelled',
          comments: 'Cancelled by employee'
        });

      toast({
        title: "Application Cancelled",
        description: "Your leave application has been cancelled successfully.",
      });

      loadApplications();
    } catch (error) {
      console.error('Error cancelling application:', error);
      toast({
        title: "Cancellation Failed",
        description: "Failed to cancel the leave application.",
        variant: "destructive",
      });
    } finally {
      setCancellingId(null);
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
        return <X className="w-4 h-4 text-gray-600" />;
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">My Leaves</h1>
          <p className="text-muted-foreground mt-2">Loading your leave applications...</p>
        </div>
        <div className="flex items-center justify-center p-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Leaves</h1>
        <p className="text-muted-foreground mt-2">
          Track and manage your leave applications
        </p>
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
                placeholder="Search by reason or type..."
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

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sick">Sick Leave</SelectItem>
                <SelectItem value="casual">Casual Leave</SelectItem>
                <SelectItem value="vacation">Vacation Leave</SelectItem>
                <SelectItem value="academic">Academic Leave</SelectItem>
                <SelectItem value="comp_off">Comp Off</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications by Status */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({applications.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({applications.filter(app => app.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({applications.filter(app => app.status === 'approved').length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({applications.filter(app => app.status === 'rejected').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({applications.filter(app => app.status === 'cancelled').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Applications Found</h3>
                <p className="text-muted-foreground">
                  {applications.length === 0 
                    ? "You haven't submitted any leave applications yet."
                    : "No applications match your current filters."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application) => (
                <Card key={application.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
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
                      
                      {canCancelApplication(application) && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              disabled={cancellingId === application.id}
                            >
                              {cancellingId === application.id ? 'Cancelling...' : 'Cancel'}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Leave Application</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel this leave application? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelApplication(application.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Yes, Cancel Application
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Reason</h4>
                      <p className="text-sm text-muted-foreground">{application.reason}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-foreground">Applied on:</span>
                        <p className="text-muted-foreground">
                          {format(parseISO(application.applied_at), 'MMM dd, yyyy at hh:mm a')}
                        </p>
                      </div>
                      
                      {application.approved_at && (
                        <div>
                          <span className="font-medium text-foreground">Approved on:</span>
                          <p className="text-muted-foreground">
                            {format(parseISO(application.approved_at), 'MMM dd, yyyy at hh:mm a')}
                          </p>
                        </div>
                      )}
                      
                      {application.cancelled_at && (
                        <div>
                          <span className="font-medium text-foreground">Cancelled on:</span>
                          <p className="text-muted-foreground">
                            {format(parseISO(application.cancelled_at), 'MMM dd, yyyy at hh:mm a')}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {application.rejected_reason && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <h4 className="font-medium text-red-800 mb-1">Rejection Reason</h4>
                        <p className="text-sm text-red-700">{application.rejected_reason}</p>
                      </div>
                    )}
                    
                    {application.documents && application.documents.files && (
                      <div>
                        <h4 className="font-medium text-foreground mb-2">Attached Documents</h4>
                        <div className="flex flex-wrap gap-2">
                          {application.documents.files.map((file: string, index: number) => (
                            <Badge key={index} variant="outline" className="cursor-pointer">
                              <FileText className="w-3 h-3 mr-1" />
                              Document {index + 1}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Individual status tabs */}
        {['pending', 'approved', 'rejected', 'cancelled'].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4">
            {applications.filter(app => app.status === status).length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    No {status} Applications
                  </h3>
                  <p className="text-muted-foreground">
                    You don't have any {status} leave applications.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {applications
                  .filter(app => app.status === status)
                  .map((application) => (
                    <Card key={application.id} className="relative">
                      {/* Same card content as above */}
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
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
                          
                          {canCancelApplication(application) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  disabled={cancellingId === application.id}
                                >
                                  {cancellingId === application.id ? 'Cancelling...' : 'Cancel'}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Cancel Leave Application</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to cancel this leave application? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>No, Keep It</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelApplication(application.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Yes, Cancel Application
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium text-foreground mb-1">Reason</h4>
                          <p className="text-sm text-muted-foreground">{application.reason}</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-foreground">Applied on:</span>
                            <p className="text-muted-foreground">
                              {format(parseISO(application.applied_at), 'MMM dd, yyyy at hh:mm a')}
                            </p>
                          </div>
                          
                          {application.approved_at && (
                            <div>
                              <span className="font-medium text-foreground">Approved on:</span>
                              <p className="text-muted-foreground">
                                {format(parseISO(application.approved_at), 'MMM dd, yyyy at hh:mm a')}
                              </p>
                            </div>
                          )}
                          
                          {application.cancelled_at && (
                            <div>
                              <span className="font-medium text-foreground">Cancelled on:</span>
                              <p className="text-muted-foreground">
                                {format(parseISO(application.cancelled_at), 'MMM dd, yyyy at hh:mm a')}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {application.rejected_reason && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <h4 className="font-medium text-red-800 mb-1">Rejection Reason</h4>
                            <p className="text-sm text-red-700">{application.rejected_reason}</p>
                          </div>
                        )}
                        
                        {application.documents && application.documents.files && (
                          <div>
                            <h4 className="font-medium text-foreground mb-2">Attached Documents</h4>
                            <div className="flex flex-wrap gap-2">
                              {application.documents.files.map((file: string, index: number) => (
                                <Badge key={index} variant="outline" className="cursor-pointer">
                                  <FileText className="w-3 h-3 mr-1" />
                                  Document {index + 1}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default MyLeaves;