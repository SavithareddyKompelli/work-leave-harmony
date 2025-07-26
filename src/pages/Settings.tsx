import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Settings as SettingsIcon, Users, Calendar as CalendarIcon, Shield, Save, Plus, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface SettingsProps {
  userRole: 'employee' | 'manager' | 'admin';
}

interface LeaveConfig {
  id: string;
  leave_type: string;
  employment_type: string;
  monthly_accrual: number;
  max_carry_forward: number;
  advance_notice_days: number;
  same_day_allowed: boolean;
  max_consecutive_days: number | null;
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  year: number;
  is_optional: boolean;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  employee_id: string;
  role: string;
  employment_type: string;
  department: string;
  is_active: boolean;
}

const Settings = ({ userRole }: SettingsProps) => {
  const [loading, setLoading] = useState(true);
  const [leaveConfigs, setLeaveConfigs] = useState<LeaveConfig[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState<Date>();
  const [isOptional, setIsOptional] = useState(false);
  const [editingConfig, setEditingConfig] = useState<LeaveConfig | null>(null);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (userRole === 'admin') {
      loadSettingsData();
    }
  }, [userRole]);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadLeaveConfigs(),
        loadHolidays(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Error loading settings data:', error);
      toast({
        title: "Error",
        description: "Failed to load settings data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveConfigs = async () => {
    const { data, error } = await supabase
      .from('leave_types_config')
      .select('*')
      .order('leave_type');

    if (error) throw error;
    setLeaveConfigs(data || []);
  };

  const loadHolidays = async () => {
    const { data, error } = await supabase
      .from('public_holidays')
      .select('*')
      .eq('year', new Date().getFullYear())
      .order('date');

    if (error) throw error;
    setHolidays(data || []);
  };

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('full_name');

    if (error) throw error;
    setUsers(data || []);
  };

  const saveLeaveConfig = async (config: LeaveConfig) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('leave_types_config')
        .upsert({
          id: config.id,
          leave_type: config.leave_type,
          employment_type: config.employment_type,
          monthly_accrual: config.monthly_accrual,
          max_carry_forward: config.max_carry_forward,
          advance_notice_days: config.advance_notice_days,
          same_day_allowed: config.same_day_allowed,
          max_consecutive_days: config.max_consecutive_days
        });

      if (error) throw error;

      toast({
        title: "Configuration Saved",
        description: "Leave configuration has been updated successfully.",
      });

      loadLeaveConfigs();
      setEditingConfig(null);
    } catch (error) {
      console.error('Error saving leave config:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save leave configuration.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addHoliday = async () => {
    if (!newHolidayName.trim() || !newHolidayDate) {
      toast({
        title: "Missing Information",
        description: "Please provide holiday name and date.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('public_holidays')
        .insert({
          name: newHolidayName.trim(),
          date: format(newHolidayDate, 'yyyy-MM-dd'),
          year: newHolidayDate.getFullYear(),
          is_optional: isOptional
        });

      if (error) throw error;

      toast({
        title: "Holiday Added",
        description: "Holiday has been added successfully.",
      });

      setNewHolidayName('');
      setNewHolidayDate(undefined);
      setIsOptional(false);
      loadHolidays();
    } catch (error) {
      console.error('Error adding holiday:', error);
      toast({
        title: "Add Failed",
        description: "Failed to add holiday.",
        variant: "destructive",
      });
    }
  };

  const deleteHoliday = async (holidayId: string) => {
    try {
      const { error } = await supabase
        .from('public_holidays')
        .delete()
        .eq('id', holidayId);

      if (error) throw error;

      toast({
        title: "Holiday Deleted",
        description: "Holiday has been removed successfully.",
      });

      loadHolidays();
    } catch (error) {
      console.error('Error deleting holiday:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete holiday.",
        variant: "destructive",
      });
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Updated",
        description: "User role has been updated successfully.",
      });

      loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update user role.",
        variant: "destructive",
      });
    }
  };

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "User Status Updated",
        description: `User has been ${!isActive ? 'activated' : 'deactivated'} successfully.`,
      });

      loadUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">
            Access denied. This section is only available to administrators.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Loading settings...</p>
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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage leave policies, holidays, and system configuration
        </p>
      </div>

      <Tabs defaultValue="leave-policies" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="leave-policies">Leave Policies</TabsTrigger>
          <TabsTrigger value="holidays">Holidays</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
        </TabsList>

        <TabsContent value="leave-policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                Leave Policy Configuration
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure leave types, accrual rates, and policy rules
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {leaveConfigs.map((config) => (
                  <Card key={config.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">
                            {config.leave_type.replace('_', ' ').toUpperCase()} - {config.employment_type.replace('_', ' ').toUpperCase()}
                          </h3>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingConfig(config)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-foreground">Monthly Accrual</label>
                        <p className="text-muted-foreground">{config.monthly_accrual} days</p>
                      </div>
                      <div>
                        <label className="font-medium text-foreground">Carry Forward</label>
                        <p className="text-muted-foreground">{config.max_carry_forward} days</p>
                      </div>
                      <div>
                        <label className="font-medium text-foreground">Advance Notice</label>
                        <p className="text-muted-foreground">{config.advance_notice_days} days</p>
                      </div>
                      <div>
                        <label className="font-medium text-foreground">Same Day</label>
                        <p className="text-muted-foreground">
                          {config.same_day_allowed ? 'Allowed' : 'Not Allowed'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Edit Config Dialog */}
          {editingConfig && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Edit {editingConfig.leave_type.replace('_', ' ').toUpperCase()} Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Monthly Accrual (days)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingConfig.monthly_accrual}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        monthly_accrual: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label>Max Carry Forward (days)</Label>
                    <Input
                      type="number"
                      value={editingConfig.max_carry_forward}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        max_carry_forward: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label>Advance Notice Required (days)</Label>
                    <Input
                      type="number"
                      value={editingConfig.advance_notice_days}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        advance_notice_days: parseInt(e.target.value)
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label>Max Consecutive Days</Label>
                    <Input
                      type="number"
                      value={editingConfig.max_consecutive_days || ''}
                      onChange={(e) => setEditingConfig({
                        ...editingConfig,
                        max_consecutive_days: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="No limit"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={editingConfig.same_day_allowed}
                      onCheckedChange={(checked) => setEditingConfig({
                        ...editingConfig,
                        same_day_allowed: checked
                      })}
                    />
                    <Label>Allow same day application</Label>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                  <Button 
                    onClick={() => saveLeaveConfig(editingConfig)}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setEditingConfig(null)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="holidays" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                Add Holiday
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Holiday Name</Label>
                  <Input
                    placeholder="e.g., Independence Day"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newHolidayDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newHolidayDate ? format(newHolidayDate, "PPP") : "Pick date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newHolidayDate}
                        onSelect={setNewHolidayDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="flex items-end">
                  <div className="flex items-center space-x-2 mb-2">
                    <Switch
                      checked={isOptional}
                      onCheckedChange={setIsOptional}
                    />
                    <Label>Optional Holiday</Label>
                  </div>
                </div>
              </div>
              
              <Button onClick={addHoliday} className="mt-4">
                <Plus className="w-4 h-4 mr-1" />
                Add Holiday
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Holidays {new Date().getFullYear()}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {holidays.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No holidays configured for this year.
                  </p>
                ) : (
                  holidays.map((holiday) => (
                    <div key={holiday.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{holiday.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(holiday.date), 'EEEE, MMMM dd, yyyy')}
                          {holiday.is_optional && (
                            <Badge variant="secondary" className="ml-2">Optional</Badge>
                          )}
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Holiday</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete "{holiday.name}"? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteHoliday(holiday.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage user roles and access permissions
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.full_name}</p>
                        <Badge variant={user.is_active ? "default" : "secondary"}>
                          {user.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <Badge variant="outline">
                          {user.role.toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {user.employment_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {user.email} • {user.employee_id} • {user.department}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(value) => updateUserRole(user.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Employee</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      <Button
                        variant={user.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                      >
                        {user.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;