import React from 'react';
import LeaveApplicationForm from '@/components/Forms/LeaveApplicationForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Clock, Calendar, FileText } from 'lucide-react';

const ApplyLeave = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Apply for Leave</h1>
        <p className="text-muted-foreground mt-2">
          Submit your leave application with all required details.
        </p>
      </div>

      {/* Leave Policy Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-blue-600" />
              Sick Leave Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Can be applied on the same day</p>
            <p className="text-sm text-muted-foreground">Accrual: 1 day/month (Full-time)</p>
            <p className="text-sm text-muted-foreground">Accrual: 0.5 days/month (Interns/Trainees)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="w-5 h-5 text-green-600" />
              Casual/Vacation Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Casual: 1+ working days advance</p>
            <p className="text-sm text-muted-foreground">Vacation: 7+ working days advance</p>
            <p className="text-sm text-muted-foreground">Accrual: 1-1.5 days/month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="w-5 h-5 text-purple-600" />
              Academic Leave
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm text-muted-foreground">Requires supporting documents</p>
            <p className="text-sm text-muted-foreground">Available for interns/trainees</p>
            <p className="text-sm text-muted-foreground">7+ days advance notice</p>
          </CardContent>
        </Card>
      </div>

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> Leave beyond available balance will be treated as Loss of Pay (LOP). 
          Maximum 10 LOP days allowed per year. Unused leaves carry forward monthly with a cap of 5 days per leave type.
        </AlertDescription>
      </Alert>

      {/* Leave Application Form */}
      <LeaveApplicationForm />
    </div>
  );
};

export default ApplyLeave;