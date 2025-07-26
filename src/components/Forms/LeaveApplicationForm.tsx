import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CalendarIcon, Upload, Info, AlertTriangle, FileText, Clock } from 'lucide-react';
import { format, addDays, differenceInDays, isWeekend, isSameDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface LeaveBalance {
  leave_type: string;
  current_balance: number;
  used: number;
  accrued: number;
}

const LeaveApplicationForm = () => {
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [isEmergency, setIsEmergency] = useState(false);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const { toast } = useToast();

  // Leave type configurations based on employment type
  const getLeaveTypes = (employmentType: string) => {
    const baseTypes = [
      { 
        value: 'sick', 
        label: 'Sick Leave', 
        description: 'Can be applied same day',
        advanceNoticeRequired: 0,
        sameDay: true,
        color: 'bg-red-100 text-red-800'
      },
      { 
        value: 'casual', 
        label: 'Casual Leave', 
        description: 'Requires 1+ working days advance notice',
        advanceNoticeRequired: 1,
        sameDay: false,
        color: 'bg-blue-100 text-blue-800'
      }
    ];

    if (employmentType === 'full_time') {
      baseTypes.push({
        value: 'vacation', 
        label: 'Vacation Leave', 
        description: 'Requires 7+ working days advance notice',
        advanceNoticeRequired: 7,
        sameDay: false,
        color: 'bg-green-100 text-green-800'
      });
    }

    if (employmentType === 'intern' || employmentType === 'trainee') {
      baseTypes.push({
        value: 'academic', 
        label: 'Academic Leave', 
        description: 'Requires supporting documents and 7+ days advance notice',
        advanceNoticeRequired: 7,
        sameDay: false,
        color: 'bg-purple-100 text-purple-800'
      });
    }

    return baseTypes;
  };

  useEffect(() => {
    loadUserProfile();
    loadLeaveBalances();
    loadHolidays();
  }, []);

  useEffect(() => {
    if (startDate && !endDate) {
      setEndDate(startDate);
    }
    validateApplication();
  }, [leaveType, startDate, endDate, isEmergency, userProfile]);

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single();
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadLeaveBalances = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: balances } = await supabase
          .from('leave_balances')
          .select('*')
          .eq('user_id', user.id)
          .eq('year', new Date().getFullYear());
        
        setLeaveBalances(balances || []);
      }
    } catch (error) {
      console.error('Error loading leave balances:', error);
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

  const validateApplication = () => {
    const errors: string[] = [];
    
    if (!leaveType || !startDate || !endDate) {
      return;
    }

    const selectedType = getLeaveTypes(userProfile?.employment_type || 'full_time')
      .find(type => type.value === leaveType);
    
    if (!selectedType) return;

    // Check advance notice requirement
    if (!isEmergency && !selectedType.sameDay) {
      const workingDaysUntilStart = calculateWorkingDays(new Date(), startDate);
      if (workingDaysUntilStart < selectedType.advanceNoticeRequired) {
        errors.push(`${selectedType.label} requires at least ${selectedType.advanceNoticeRequired} working days advance notice.`);
      }
    }

    // Check for weekend/holiday application
    const isStartWeekend = isWeekend(startDate);
    const isStartHoliday = holidays.some(holiday => isSameDay(holiday, startDate));
    
    if (isStartWeekend || isStartHoliday) {
      errors.push('Cannot apply for leave starting on weekends or public holidays.');
    }

    // Check leave balance
    const balance = leaveBalances.find(b => b.leave_type === leaveType);
    const requestedDays = calculateLeaveDays();
    
    if (balance && requestedDays > balance.current_balance) {
      const lopDays = requestedDays - balance.current_balance;
      errors.push(`This application will result in ${lopDays} Loss of Pay (LOP) days.`);
    }

    // Check for academic leave document requirement
    if (leaveType === 'academic' && documents.length === 0) {
      errors.push('Academic leave requires supporting documents.');
    }

    // Check overlapping leaves (this would require fetching existing applications)
    // TODO: Implement overlap check with existing approved/pending leaves

    setValidationErrors(errors);
  };

  const calculateWorkingDays = (start: Date, end: Date) => {
    let workingDays = 0;
    const current = new Date(start);
    
    while (current < end) {
      if (!isWeekend(current) && !holidays.some(holiday => isSameDay(holiday, current))) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return workingDays;
  };

  const calculateLeaveDays = () => {
    if (!startDate || !endDate) return 0;
    
    let days = 0;
    const current = new Date(startDate);
    
    while (current <= endDate) {
      if (!isWeekend(current) && !holidays.some(holiday => isSameDay(holiday, current))) {
        days++;
      }
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const selectedLeaveType = getLeaveTypes(userProfile?.employment_type || 'full_time')
    .find(type => type.value === leaveType);
  
  const selectedBalance = leaveBalances.find(b => b.leave_type === leaveType);
  const requestedDays = calculateLeaveDays();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setDocuments(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveType || !startDate || !endDate || !reason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (validationErrors.length > 0 && !isEmergency) {
      toast({
        title: "Validation Errors",
        description: "Please fix the validation errors before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Upload documents if any
      let documentUrls = null;
      if (documents.length > 0) {
        const uploadPromises = documents.map(async (file) => {
          const fileName = `${user.id}/${Date.now()}_${file.name}`;
          const { data, error } = await supabase.storage
            .from('leave-documents')
            .upload(fileName, file);
          
          if (error) throw error;
          return data.path;
        });
        
        documentUrls = await Promise.all(uploadPromises);
      }

      // Submit leave application
      const { error } = await supabase
        .from('leave_applications')
        .insert({
          user_id: user.id,
          leave_type: leaveType,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          total_days: requestedDays,
          reason: reason.trim(),
          is_emergency: isEmergency,
          documents: documentUrls ? { files: documentUrls } : null
        });

      if (error) throw error;

      // Send email notification (would be handled by Supabase Edge Function)
      // TODO: Implement email notification to HR

      toast({
        title: "Application Submitted",
        description: "Your leave application has been submitted successfully. You will receive an email confirmation.",
        variant: "default",
      });

      // Reset form
      setLeaveType('');
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
      setIsEmergency(false);
      setDocuments([]);

    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "Failed to submit your leave application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!userProfile) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading user profile...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Leave Application Form
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Leave Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="leaveType">Leave Type *</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger>
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                {getLeaveTypes(userProfile.employment_type).map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={type.color}>
                        {type.label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {type.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedLeaveType && selectedBalance && (
              <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                <div className="text-sm">
                  <span className="font-medium">Available:</span> {selectedBalance.current_balance} days
                </div>
                <div className="text-sm">
                  <span className="font-medium">Used:</span> {selectedBalance.used} days
                </div>
                <div className="text-sm">
                  <span className="font-medium">Accrued:</span> {selectedBalance.accrued} days
                </div>
              </div>
            )}
          </div>

          {/* Date Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick start date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick end date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => {
                      if (!startDate) return true;
                      return date < startDate;
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Leave Duration Display */}
          {startDate && endDate && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-800">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  Total Leave Days: {requestedDays} working days
                </span>
              </div>
              {selectedBalance && requestedDays > selectedBalance.current_balance && (
                <p className="text-red-600 text-sm mt-1">
                  ⚠️ This will result in {requestedDays - selectedBalance.current_balance} LOP days
                </p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for Leave *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for your leave..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>

          {/* Emergency Application */}
          {selectedLeaveType && !selectedLeaveType.sameDay && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="emergency"
                checked={isEmergency}
                onCheckedChange={(checked) => setIsEmergency(checked as boolean)}
              />
              <Label htmlFor="emergency" className="text-sm">
                This is an emergency application (bypasses advance notice requirement)
              </Label>
            </div>
          )}

          {/* Document Upload */}
          {(leaveType === 'academic' || isEmergency) && (
            <div className="space-y-2">
              <Label htmlFor="documents">
                Supporting Documents {leaveType === 'academic' ? '*' : '(Optional)'}
              </Label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <input
                  type="file"
                  id="documents"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Label htmlFor="documents" className="cursor-pointer">
                  <div className="text-center">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, DOC, DOCX, JPG, PNG (max 5MB each)
                    </p>
                  </div>
                </Label>
              </div>
              {documents.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Selected files:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {documents.map((file, index) => (
                      <li key={index}>{file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || (validationErrors.length > 0 && !isEmergency)}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Submitting Application...
              </>
            ) : (
              'Submit Leave Application'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default LeaveApplicationForm;