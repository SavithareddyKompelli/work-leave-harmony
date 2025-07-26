import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Home, Clock, CheckCircle, XCircle, AlertCircle, Hourglass, Info } from 'lucide-react';
import { format, parseISO, isWeekend, isSameDay, isToday, isFuture } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface WFHRequest {
  id: string;
  wfh_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  created_at: string;
}

const WorkFromHome = () => {
  const [wfhDate, setWfhDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<WFHRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<Date[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadWFHRequests();
    loadHolidays();
  }, []);

  const loadWFHRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('wfh_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('wfh_date', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading WFH requests:', error);
      toast({
        title: "Error",
        description: "Failed to load Work From Home requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHolidays = async () => {
    try {
      const { data: holidayData } = await supabase
        .from('public_holidays')
        .select('date')
        .eq('year', new Date().getFullYear());
      
      if (holidayData) {
        setHolidays(holidayData.map(h => new Date(h.date)));
      }
    } catch (error) {
      console.error('Error loading holidays:', error);
    }
  };

  const isValidWFHDate = (date: Date) => {
    // WFH should be on working days only (not weekends or holidays)
    const isHoliday = holidays.some(holiday => isSameDay(holiday, date));
    return !isWeekend(date) && !isHoliday;
  };

  const isDateAlreadyRequested = (date: Date) => {
    return requests.some(request => isSameDay(parseISO(request.wfh_date), date));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wfhDate) {
      toast({
        title: "Missing Information",
        description: "Please select a work from home date.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidWFHDate(wfhDate)) {
      toast({
        title: "Invalid Date",
        description: "Work from home can only be requested for working days (not weekends or holidays).",
        variant: "destructive",
      });
      return;
    }

    if (isDateAlreadyRequested(wfhDate)) {
      toast({
        title: "Duplicate Request",
        description: "You have already requested work from home for this date.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('wfh_requests')
        .insert({
          user_id: user.id,
          wfh_date: format(wfhDate, 'yyyy-MM-dd'),
          reason: reason.trim() || null,
          status: isToday(wfhDate) ? 'approved' : 'pending' // Auto-approve for today, pending for future dates
        });

      if (error) throw error;

      toast({
        title: "WFH Request Submitted",
        description: isToday(wfhDate) 
          ? "Your work from home for today has been marked."
          : "Your work from home request has been submitted for approval.",
      });

      // Reset form
      setWfhDate(undefined);
      setReason('');
      
      // Reload requests
      loadWFHRequests();

    } catch (error) {
      console.error('Error submitting WFH request:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your work from home request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get calendar events for WFH days
  const getCalendarEvents = () => {
    return requests
      .filter(request => request.status === 'approved')
      .map(request => parseISO(request.wfh_date));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Work From Home</h1>
        <p className="text-muted-foreground mt-2">
          Mark your work from home days and track your remote work schedule
        </p>
      </div>

      <Tabs defaultValue="mark-wfh" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="mark-wfh">Mark WFH</TabsTrigger>
          <TabsTrigger value="my-wfh">
            My WFH Days ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        <TabsContent value="mark-wfh" className="space-y-6">
          {/* Policy Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>WFH Policy:</strong> You can mark work from home for today immediately or request for future working days. 
              Future WFH requests require manager approval. WFH is only allowed on working days.
            </AlertDescription>
          </Alert>

          {/* WFH Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="w-5 h-5" />
                Mark Work From Home
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* WFH Date */}
                <div className="space-y-2">
                  <Label>Work From Home Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !wfhDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {wfhDate ? format(wfhDate, "PPP") : "Pick your work from home date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={wfhDate}
                        onSelect={setWfhDate}
                        initialFocus
                        disabled={(date) => {
                          const yesterday = new Date();
                          yesterday.setDate(yesterday.getDate() - 1);
                          return date < yesterday;
                        }}
                        modifiers={{
                          wfh: getCalendarEvents(),
                          weekend: (date) => isWeekend(date),
                          holiday: (date) => holidays.some(holiday => isSameDay(holiday, date))
                        }}
                        modifiersStyles={{
                          wfh: { backgroundColor: '#dcfce7', color: '#166534' },
                          weekend: { backgroundColor: '#fee2e2', color: '#991b1b' },
                          holiday: { backgroundColor: '#fef3c7', color: '#92400e' }
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {wfhDate && !isValidWFHDate(wfhDate) && (
                    <p className="text-sm text-red-600">
                      ⚠️ Work from home can only be requested for working days (not weekends or holidays)
                    </p>
                  )}
                  {wfhDate && isDateAlreadyRequested(wfhDate) && (
                    <p className="text-sm text-red-600">
                      ⚠️ You have already requested work from home for this date
                    </p>
                  )}
                  {wfhDate && isToday(wfhDate) && (
                    <p className="text-sm text-green-600">
                      ✓ This will be marked immediately as work from home for today
                    </p>
                  )}
                  {wfhDate && isFuture(wfhDate) && (
                    <p className="text-sm text-blue-600">
                      ℹ️ This will be sent for manager approval as it's a future date
                    </p>
                  )}
                </div>

                {/* Reason (Optional) */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason (Optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Briefly describe why you're working from home (optional)..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Date Summary */}
                {wfhDate && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Home className="w-4 h-4" />
                      <span className="font-medium">
                        WFH Date: {format(wfhDate, 'EEEE, MMM dd, yyyy')}
                        {isToday(wfhDate) && ' (Today)'}
                        {isFuture(wfhDate) && ' (Future - Requires Approval)'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={
                    isSubmitting || 
                    !wfhDate || 
                    !isValidWFHDate(wfhDate) || 
                    isDateAlreadyRequested(wfhDate)
                  }
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : isToday(wfhDate) ? (
                    'Mark WFH for Today'
                  ) : (
                    'Request Work From Home'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-wfh" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your WFH requests...</p>
              </CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Home className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No WFH Days</h3>
                <p className="text-muted-foreground">
                  You haven't marked any work from home days yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(request.status)}
                              {request.status.toUpperCase()}
                            </div>
                          </Badge>
                          {isToday(parseISO(request.wfh_date)) && (
                            <Badge variant="secondary">TODAY</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {format(parseISO(request.wfh_date), 'EEEE, MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {request.reason && (
                      <div>
                        <h4 className="font-medium text-foreground mb-1">Reason</h4>
                        <p className="text-sm text-muted-foreground">{request.reason}</p>
                      </div>
                    )}
                    
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Requested on:</span>
                      <span className="text-muted-foreground ml-1">
                        {format(parseISO(request.created_at), 'MMM dd, yyyy at hh:mm a')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                WFH Calendar View
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Green dates are approved WFH days, red dates are weekends, yellow dates are holidays
              </p>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="multiple"
                selected={getCalendarEvents()}
                className="rounded-md border w-full"
                modifiers={{
                  wfh: getCalendarEvents(),
                  weekend: (date) => isWeekend(date),
                  holiday: (date) => holidays.some(holiday => isSameDay(holiday, date))
                }}
                modifiersStyles={{
                  wfh: { 
                    backgroundColor: '#dcfce7', 
                    color: '#166534',
                    fontWeight: 'bold'
                  },
                  weekend: { 
                    backgroundColor: '#fee2e2', 
                    color: '#991b1b' 
                  },
                  holiday: { 
                    backgroundColor: '#fef3c7', 
                    color: '#92400e' 
                  }
                }}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(23, 59, 59, 999);
                  return date > today;
                }}
              />
              
              {/* Legend */}
              <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-200 border border-green-300"></div>
                  <span>Work From Home</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-200 border border-red-300"></div>
                  <span>Weekend</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-yellow-200 border border-yellow-300"></div>
                  <span>Holiday</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total WFH Days</p>
                    <p className="text-2xl font-bold text-foreground">
                      {requests.filter(r => r.status === 'approved').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-foreground">
                      {requests.filter(r => {
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        const requestDate = parseISO(r.wfh_date);
                        return r.status === 'approved' && 
                               requestDate.getMonth() === currentMonth && 
                               requestDate.getFullYear() === currentYear;
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-2">
                  <Hourglass className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Pending</p>
                    <p className="text-2xl font-bold text-foreground">
                      {requests.filter(r => r.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorkFromHome;