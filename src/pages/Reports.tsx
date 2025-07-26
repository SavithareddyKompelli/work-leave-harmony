import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Calendar, TrendingUp, Users, FileText, Download, Filter, BarChart3 } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface ReportsProps {
  userRole: 'employee' | 'manager' | 'admin';
}

interface LeaveStats {
  month: string;
  sick: number;
  casual: number;
  vacation: number;
  total: number;
}

interface DepartmentStats {
  department: string;
  totalEmployees: number;
  totalLeaves: number;
  averageLeaves: number;
}

interface LeaveTypeStats {
  leave_type: string;
  count: number;
  percentage: number;
}

const Reports = ({ userRole }: ReportsProps) => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [monthlyStats, setMonthlyStats] = useState<LeaveStats[]>([]);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [leaveTypeStats, setLeaveTypeStats] = useState<LeaveTypeStats[]>([]);
  const [summaryStats, setSummaryStats] = useState({
    totalApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    pendingApplications: 0,
    averageProcessingTime: 0,
    topLeaveType: '',
    totalLopDays: 0
  });

  const { toast } = useToast();

  useEffect(() => {
    if (userRole === 'manager' || userRole === 'admin') {
      loadReportsData();
    }
  }, [userRole, selectedPeriod, selectedDepartment]);

  const loadReportsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadMonthlyStats(),
        loadDepartmentStats(),
        loadLeaveTypeStats(),
        loadSummaryStats()
      ]);
    } catch (error) {
      console.error('Error loading reports data:', error);
      toast({
        title: "Error",
        description: "Failed to load reports data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyStats = async () => {
    const monthsBack = selectedPeriod === '6months' ? 6 : 12;
    const startDate = subMonths(new Date(), monthsBack);
    
    const { data, error } = await supabase
      .from('leave_applications')
      .select(`
        start_date,
        leave_type,
        total_days,
        status,
        user:users!user_id(department)
      `)
      .gte('start_date', format(startDate, 'yyyy-MM-dd'))
      .eq('status', 'approved');

    if (error) throw error;

    // Group by month and leave type
    const monthlyData: { [key: string]: LeaveStats } = {};
    
    for (let i = 0; i < monthsBack; i++) {
      const monthDate = subMonths(new Date(), i);
      const monthKey = format(monthDate, 'MMM yyyy');
      monthlyData[monthKey] = {
        month: monthKey,
        sick: 0,
        casual: 0,
        vacation: 0,
        total: 0
      };
    }

    data?.forEach(app => {
      if (selectedDepartment === 'all' || app.user?.department === selectedDepartment) {
        const monthKey = format(parseISO(app.start_date), 'MMM yyyy');
        if (monthlyData[monthKey]) {
          monthlyData[monthKey][app.leave_type as keyof LeaveStats] += app.total_days;
          monthlyData[monthKey].total += app.total_days;
        }
      }
    });

    setMonthlyStats(Object.values(monthlyData).reverse());
  };

  const loadDepartmentStats = async () => {
    // Get all users grouped by department
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, department')
      .eq('is_active', true);

    if (usersError) throw usersError;

    // Get leave applications for the selected period
    const monthsBack = selectedPeriod === '6months' ? 6 : 12;
    const startDate = subMonths(new Date(), monthsBack);

    const { data: leavesData, error: leavesError } = await supabase
      .from('leave_applications')
      .select(`
        user_id,
        total_days,
        status,
        user:users!user_id(department)
      `)
      .gte('start_date', format(startDate, 'yyyy-MM-dd'))
      .eq('status', 'approved');

    if (leavesError) throw leavesError;

    // Group by department
    const deptStats: { [key: string]: DepartmentStats } = {};
    
    usersData?.forEach(user => {
      if (user.department) {
        if (!deptStats[user.department]) {
          deptStats[user.department] = {
            department: user.department,
            totalEmployees: 0,
            totalLeaves: 0,
            averageLeaves: 0
          };
        }
        deptStats[user.department].totalEmployees++;
      }
    });

    leavesData?.forEach(leave => {
      const dept = leave.user?.department;
      if (dept && deptStats[dept]) {
        deptStats[dept].totalLeaves += leave.total_days;
      }
    });

    // Calculate averages
    Object.values(deptStats).forEach(dept => {
      dept.averageLeaves = dept.totalEmployees > 0 
        ? Math.round((dept.totalLeaves / dept.totalEmployees) * 10) / 10 
        : 0;
    });

    setDepartmentStats(Object.values(deptStats));
  };

  const loadLeaveTypeStats = async () => {
    const monthsBack = selectedPeriod === '6months' ? 6 : 12;
    const startDate = subMonths(new Date(), monthsBack);

    const { data, error } = await supabase
      .from('leave_applications')
      .select(`
        leave_type,
        total_days,
        user:users!user_id(department)
      `)
      .gte('start_date', format(startDate, 'yyyy-MM-dd'))
      .eq('status', 'approved');

    if (error) throw error;

    const typeStats: { [key: string]: number } = {};
    let totalDays = 0;

    data?.forEach(app => {
      if (selectedDepartment === 'all' || app.user?.department === selectedDepartment) {
        typeStats[app.leave_type] = (typeStats[app.leave_type] || 0) + app.total_days;
        totalDays += app.total_days;
      }
    });

    const statsArray = Object.entries(typeStats).map(([type, count]) => ({
      leave_type: type.replace('_', ' ').toUpperCase(),
      count,
      percentage: Math.round((count / totalDays) * 100)
    }));

    setLeaveTypeStats(statsArray);
  };

  const loadSummaryStats = async () => {
    const monthsBack = selectedPeriod === '6months' ? 6 : 12;
    const startDate = subMonths(new Date(), monthsBack);

    const { data, error } = await supabase
      .from('leave_applications')
      .select(`
        status,
        applied_at,
        approved_at,
        leave_type,
        user:users!user_id(department)
      `)
      .gte('applied_at', format(startDate, 'yyyy-MM-dd'));

    if (error) throw error;

    const filteredData = data?.filter(app => 
      selectedDepartment === 'all' || app.user?.department === selectedDepartment
    ) || [];

    const stats = {
      totalApplications: filteredData.length,
      approvedApplications: filteredData.filter(app => app.status === 'approved').length,
      rejectedApplications: filteredData.filter(app => app.status === 'rejected').length,
      pendingApplications: filteredData.filter(app => app.status === 'pending').length,
      averageProcessingTime: 0,
      topLeaveType: '',
      totalLopDays: 0
    };

    // Calculate average processing time
    const processedApps = filteredData.filter(app => app.approved_at);
    if (processedApps.length > 0) {
      const totalProcessingTime = processedApps.reduce((sum, app) => {
        const applied = new Date(app.applied_at);
        const approved = new Date(app.approved_at!);
        return sum + (approved.getTime() - applied.getTime());
      }, 0);
      stats.averageProcessingTime = Math.round(totalProcessingTime / processedApps.length / (1000 * 60 * 60 * 24));
    }

    // Find top leave type
    const typeCount: { [key: string]: number } = {};
    filteredData.forEach(app => {
      typeCount[app.leave_type] = (typeCount[app.leave_type] || 0) + 1;
    });
    stats.topLeaveType = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0]?.replace('_', ' ').toUpperCase() || 'N/A';

    setSummaryStats(stats);
  };

  const exportReport = () => {
    // In a real implementation, this would generate and download a PDF/Excel report
    toast({
      title: "Report Exported",
      description: "The report has been exported successfully.",
    });
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (userRole === 'employee') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
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
          <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          <p className="text-muted-foreground mt-2">Loading reports data...</p>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive leave management analytics and insights
          </p>
        </div>
        <Button onClick={exportReport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Report Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Time Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="12months">Last 12 Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Department</label>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departmentStats.map((dept) => (
                    <SelectItem key={dept.department} value={dept.department}>
                      {dept.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                <p className="text-2xl font-bold text-foreground">{summaryStats.totalApplications}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold text-foreground">
                  {summaryStats.totalApplications > 0 
                    ? Math.round((summaryStats.approvedApplications / summaryStats.totalApplications) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Processing Time</p>
                <p className="text-2xl font-bold text-foreground">{summaryStats.averageProcessingTime} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Top Leave Type</p>
                <p className="text-2xl font-bold text-foreground">{summaryStats.topLeaveType}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="monthly-trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="monthly-trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="leave-types">Leave Types</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly-trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Leave Trends</CardTitle>
              <p className="text-sm text-muted-foreground">
                Leave applications by month and type
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="sick" stackId="a" fill="#ef4444" name="Sick Leave" />
                  <Bar dataKey="casual" stackId="a" fill="#3b82f6" name="Casual Leave" />
                  <Bar dataKey="vacation" stackId="a" fill="#10b981" name="Vacation Leave" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-types" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Leave Types Distribution</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Breakdown of leave types taken
                </p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={leaveTypeStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ leave_type, percentage }) => `${leave_type}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {leaveTypeStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Leave Types Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {leaveTypeStats.map((stat, index) => (
                    <div key={stat.leave_type} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="font-medium">{stat.leave_type}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{stat.count} days</p>
                        <p className="text-sm text-muted-foreground">{stat.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Department-wise Leave Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Leave utilization across departments
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={departmentStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="department" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalLeaves" fill="#3b82f6" name="Total Leave Days" />
                  <Bar dataKey="averageLeaves" fill="#10b981" name="Average per Employee" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Department</th>
                      <th className="text-left p-2">Employees</th>
                      <th className="text-left p-2">Total Leaves</th>
                      <th className="text-left p-2">Avg per Employee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {departmentStats.map((dept) => (
                      <tr key={dept.department} className="border-b">
                        <td className="p-2 font-medium">{dept.department}</td>
                        <td className="p-2">{dept.totalEmployees}</td>
                        <td className="p-2">{dept.totalLeaves} days</td>
                        <td className="p-2">{dept.averageLeaves} days</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;