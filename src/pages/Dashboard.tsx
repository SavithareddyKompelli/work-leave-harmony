import React from 'react';
import StatsCard from '@/components/Dashboard/StatsCard';
import LeaveBalanceCard from '@/components/Dashboard/LeaveBalanceCard';
import RecentActivity from '@/components/Dashboard/RecentActivity';
import { Calendar, Clock, CheckCircle, AlertCircle, Users, TrendingUp } from 'lucide-react';

interface DashboardProps {
  userRole: 'employee' | 'manager' | 'admin';
}

const Dashboard = ({ userRole }: DashboardProps) => {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back! Here's your leave management overview.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Leave Days"
          value="35"
          subtitle="this year"
          icon={Calendar}
          variant="default"
        />
        <StatsCard
          title="Days Used"
          value="12"
          subtitle="out of 35"
          icon={Clock}
          variant="warning"
          trend={{ value: 2, label: "from last month" }}
        />
        <StatsCard
          title="Pending Requests"
          value="2"
          subtitle="awaiting approval"
          icon={AlertCircle}
          variant="warning"
        />
        <StatsCard
          title="Approved Leaves"
          value="8"
          subtitle="this year"
          icon={CheckCircle}
          variant="success"
        />
      </div>

      {/* Manager/Admin Additional Stats */}
      {(userRole === 'manager' || userRole === 'admin') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatsCard
            title="Team Members"
            value="15"
            subtitle="reporting to you"
            icon={Users}
            variant="default"
          />
          <StatsCard
            title="Team Requests"
            value="5"
            subtitle="pending approval"
            icon={AlertCircle}
            variant="warning"
          />
          <StatsCard
            title="Approval Rate"
            value="94%"
            subtitle="last 30 days"
            icon={TrendingUp}
            variant="success"
          />
        </div>
      )}

      {/* Leave Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <LeaveBalanceCard
          title="Sick Leave"
          used={3}
          total={12}
          pending={1}
          color="warning"
        />
        <LeaveBalanceCard
          title="Casual Leave"
          used={5}
          total={12}
          pending={1}
          color="primary"
        />
        <LeaveBalanceCard
          title="Vacation Leave"
          used={4}
          total={15}
          pending={0}
          color="success"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        
        {/* Quick Actions */}
        <div className="bg-card rounded-xl p-6 shadow-md border border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full p-4 text-left bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20 transition-colors">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Apply for Leave</p>
                  <p className="text-sm text-muted-foreground">Submit a new leave request</p>
                </div>
              </div>
            </button>
            
            <button className="w-full p-4 text-left bg-success/5 hover:bg-success/10 rounded-lg border border-success/20 transition-colors">
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-success" />
                <div>
                  <p className="font-medium text-foreground">Mark Comp Off</p>
                  <p className="text-sm text-muted-foreground">Add compensatory leave</p>
                </div>
              </div>
            </button>
            
            {(userRole === 'manager' || userRole === 'admin') && (
              <button className="w-full p-4 text-left bg-warning/5 hover:bg-warning/10 rounded-lg border border-warning/20 transition-colors">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-warning" />
                  <div>
                    <p className="font-medium text-foreground">Review Team Requests</p>
                    <p className="text-sm text-muted-foreground">Approve or reject leave applications</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;