import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CalendarIcon, Plus, Clock, CheckCircle, XCircle, AlertCircle, Hourglass, Info } from 'lucide-react';
import { format, parseISO, isBefore, isWeekend, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface CompOffRequest {
  id: string;
  work_date: string;
  comp_off_date: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  created_at: string;
}

const CompOff = () => {
  const [workDate, setWorkDate] = useState<Date>();
  const [compOffDate, setCompOffDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requests, setRequests] = useState<CompOffRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [holidays, setHolidays] = useState<Date[]>([]);
  
  const { toast } = useToast();

  useEffect(() => {
    loadCompOffRequests();
    loadHolidays();
  }, []);

  const loadCompOffRequests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('comp_off_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading comp off requests:', error);
      toast({
        title: "Error",
        description: "Failed to load comp off requests.",
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

  const isValidWorkDate = (date: Date) => {
    // Work date should be a weekend or holiday (when employee worked extra)
    const isHoliday = holidays.some(holiday => isSameDay(holiday, date));
    return isWeekend(date) || isHoliday;
  };

  const isValidCompOffDate = (date: Date) => {
    // Comp off date should be a working day (not weekend or holiday)
    const isHoliday = holidays.some(holiday => isSameDay(holiday, date));
    return !isWeekend(date) && !isHoliday && date > new Date();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!workDate || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidWorkDate(workDate)) {
      toast({
        title: "Invalid Work Date",
        description: "Work date must be a weekend or holiday when you worked extra hours.",
        variant: "destructive",
      });
      return;
    }

    if (compOffDate && !isValidCompOffDate(compOffDate)) {
      toast({
        title: "Invalid Comp Off Date",
        description: "Comp off date must be a future working day.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('comp_off_requests')
        .insert({
          user_id: user.id,
          work_date: format(workDate, 'yyyy-MM-dd'),
          comp_off_date: compOffDate ? format(compOffDate, 'yyyy-MM-dd') : null,
          reason: reason.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Comp Off Request Submitted",
        description: "Your compensatory leave request has been submitted for approval.",
      });

      // Reset form
      setWorkDate(undefined);
      setCompOffDate(undefined);
      setReason('');
      
      // Reload requests
      loadCompOffRequests();

    } catch (error) {
      console.error('Error submitting comp off request:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your comp off request. Please try again.",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Compensatory Leave</h1>
        <p className="text-muted-foreground mt-2">
          Request comp off for extra work done on weekends or holidays
        </p>
      </div>

      <Tabs defaultValue="add-comp-off" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="add-comp-off">Add Comp Off</TabsTrigger>
          <TabsTrigger value="my-requests">
            My Requests ({requests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add-comp-off" className="space-y-6">
          {/* Policy Information */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Comp Off Policy:</strong> You can request compensatory leave for extra work done on weekends or public holidays. 
              The comp off date should be taken within 90 days of the work date. Manager approval is required.
            </AlertDescription>
          </Alert>

          {/* Comp Off Request Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Request Compensatory Leave
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Work Date */}
                <div className="space-y-2">
                  <Label>Date When You Worked Extra *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !workDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {workDate ? format(workDate, "PPP") : "Pick the date you worked extra"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={workDate}
                        onSelect={setWorkDate}
                        initialFocus
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(23, 59, 59, 999);
                          return date > today;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {workDate && !isValidWorkDate(workDate) && (
                    <p className="text-sm text-red-600">
                      ⚠️ Work date should be a weekend or holiday when you worked extra
                    </p>
                  )}
                </div>

                {/* Comp Off Date (Optional) */}
                <div className="space-y-2">
                  <Label>Preferred Comp Off Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !compOffDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {compOffDate ? format(compOffDate, "PPP") : "Pick your preferred comp off date (optional)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={compOffDate}
                        onSelect={setCompOffDate}
                        initialFocus
                        disabled={(date) => {
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          return date <= today;
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  {compOffDate && !isValidCompOffDate(compOffDate) && (
                    <p className="text-sm text-red-600">
                      ⚠️ Comp off date should be a future working day (not weekend or holiday)
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    You can leave this blank and decide the comp off date later when applying for leave.
                  </p>
                </div>

                {/* Reason */}
                <div className="space-y-2">
                  <Label htmlFor="reason">Reason for Working Extra *</Label>
                  <Textarea
                    id="reason"
                    placeholder="Describe the work you did on the weekend/holiday..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Duration Summary */}
                {workDate && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">
                        Work Date: {format(workDate, 'EEEE, MMM dd, yyyy')}
                        {isWeekend(workDate) ? ' (Weekend)' : 
                         holidays.some(h => isSameDay(h, workDate)) ? ' (Holiday)' : ' (Regular Day)'}
                      </span>
                    </div>
                    {compOffDate && (
                      <p className="text-blue-700 text-sm mt-1">
                        Preferred Comp Off: {format(compOffDate, 'EEEE, MMM dd, yyyy')}
                      </p>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || !workDate || !reason.trim() || (workDate && !isValidWorkDate(workDate)) || (compOffDate && !isValidCompOffDate(compOffDate))}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting Request...
                    </>
                  ) : (
                    'Submit Comp Off Request'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="my-requests" className="space-y-6">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your comp off requests...</p>
              </CardContent>
            </Card>
          ) : requests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Comp Off Requests</h3>
                <p className="text-muted-foreground">
                  You haven't submitted any compensatory leave requests yet.
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
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Work Date: {format(parseISO(request.work_date), 'MMM dd, yyyy')}
                          </div>
                          {request.comp_off_date && (
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="w-4 h-4" />
                              Comp Off: {format(parseISO(request.comp_off_date), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground mb-1">Work Description</h4>
                      <p className="text-sm text-muted-foreground">{request.reason}</p>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Requested on:</span>
                      <span className="text-muted-foreground ml-1">
                        {format(parseISO(request.created_at), 'MMM dd, yyyy at hh:mm a')}
                      </span>
                    </div>

                    {!request.comp_off_date && request.status === 'approved' && (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Your comp off request has been approved! You can now apply for leave and select "Comp Off" as the leave type to use this credit.
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompOff;