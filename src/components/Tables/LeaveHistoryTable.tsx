import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, Calendar, FileText, X } from 'lucide-react';
import { format } from 'date-fns';

interface LeaveRecord {
  id: string;
  type: string;
  startDate: Date;
  endDate: Date;
  days: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  reason: string;
  appliedOn: Date;
  approver?: string;
  comments?: string;
}

const LeaveHistoryTable = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const leaveRecords: LeaveRecord[] = [
    {
      id: 'LV-001',
      type: 'Sick Leave',
      startDate: new Date('2024-12-20'),
      endDate: new Date('2024-12-22'),
      days: 3,
      status: 'approved',
      reason: 'Flu symptoms',
      appliedOn: new Date('2024-12-18'),
      approver: 'Sarah Wilson',
      comments: 'Approved. Take care!'
    },
    {
      id: 'LV-002',
      type: 'Casual Leave',
      startDate: new Date('2025-01-05'),
      endDate: new Date('2025-01-05'),
      days: 1,
      status: 'pending',
      reason: 'Personal work',
      appliedOn: new Date('2024-12-15')
    },
    {
      id: 'LV-003',
      type: 'Vacation Leave',
      startDate: new Date('2024-12-25'),
      endDate: new Date('2024-12-31'),
      days: 7,
      status: 'rejected',
      reason: 'Christmas holidays',
      appliedOn: new Date('2024-12-01'),
      approver: 'Mike Johnson',
      comments: 'Peak season, please plan for later dates'
    },
    {
      id: 'LV-004',
      type: 'Casual Leave',
      startDate: new Date('2024-11-15'),
      endDate: new Date('2024-11-15'),
      days: 1,
      status: 'cancelled',
      reason: 'Doctor appointment',
      appliedOn: new Date('2024-11-10')
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success text-success-foreground';
      case 'pending': return 'bg-warning text-warning-foreground';
      case 'rejected': return 'bg-destructive text-destructive-foreground';
      case 'cancelled': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filteredRecords = leaveRecords.filter(record => {
    const matchesSearch = record.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesType = typeFilter === 'all' || record.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const canCancelLeave = (record: LeaveRecord) => {
    const today = new Date();
    return record.status === 'pending' && record.startDate > today;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Leave History</span>
        </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by reason, type, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Sick Leave">Sick Leave</SelectItem>
              <SelectItem value="Casual Leave">Casual Leave</SelectItem>
              <SelectItem value="Vacation Leave">Vacation Leave</SelectItem>
              <SelectItem value="Academic Leave">Academic Leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Approver</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.id}</TableCell>
                  <TableCell>{record.type}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{format(record.startDate, 'MMM dd, yyyy')}</div>
                      {record.startDate.getTime() !== record.endDate.getTime() && (
                        <div className="text-muted-foreground">
                          to {format(record.endDate, 'MMM dd, yyyy')}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{record.days}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(record.status)}>
                      {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(record.appliedOn, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-sm">
                    {record.approver || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                      {canCancelLeave(record) && (
                        <Button variant="outline" size="sm">
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {filteredRecords.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No leave records found</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeaveHistoryTable;