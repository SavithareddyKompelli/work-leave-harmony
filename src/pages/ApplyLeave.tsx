import React from 'react';
import LeaveApplicationForm from '@/components/Forms/LeaveApplicationForm';

const ApplyLeave = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Apply for Leave</h1>
        <p className="text-muted-foreground mt-2">
          Submit your leave application with all required details.
        </p>
      </div>
      
      <LeaveApplicationForm />
    </div>
  );
};

export default ApplyLeave;