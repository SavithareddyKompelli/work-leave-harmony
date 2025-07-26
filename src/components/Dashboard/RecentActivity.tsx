import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';

interface Activity {
  id: string;
  type: 'applied' | 'approved' | 'rejected' | 'cancelled';
  leaveType: string;
  dates: string;
  status: string;
  timestamp: string;
  approver?: string;
}

const RecentActivity = () => {
  const activities: Activity[] = [
    {
      id: '1',
      type: 'approved',
      leaveType: 'Sick Leave',
      dates: 'Dec 20-22, 2024',
      status: 'Approved',
      timestamp: '2 hours ago',
      approver: 'Sarah Wilson'
    },
    {
      id: '2',
      type: 'applied',
      leaveType: 'Casual Leave',
      dates: 'Jan 5, 2025',
      status: 'Pending',
      timestamp: '1 day ago'
    },
    {
      id: '3',
      type: 'rejected',
      leaveType: 'Vacation Leave',
      dates: 'Dec 25-31, 2024',
      status: 'Rejected',
      timestamp: '3 days ago',
      approver: 'Mike Johnson'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-md border border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start space-x-4 p-4 bg-muted/30 rounded-lg">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.leaveType} - {activity.dates}
                </p>
                <Badge className={getStatusColor(activity.status)}>
                  {activity.status}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>{activity.timestamp}</span>
                </div>
                {activity.approver && (
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>by {activity.approver}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="w-full mt-4 text-center text-sm text-primary hover:text-primary-hover font-medium">
        View All Activities
      </button>
    </div>
  );
};

export default RecentActivity;