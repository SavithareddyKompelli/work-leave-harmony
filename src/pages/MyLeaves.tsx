import React from 'react';
import LeaveHistoryTable from '@/components/Tables/LeaveHistoryTable';

const MyLeaves = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">My Leaves</h1>
        <p className="text-muted-foreground mt-2">
          View and manage your leave applications and history.
        </p>
      </div>
      
      <LeaveHistoryTable />
    </div>
  );
};

export default MyLeaves;