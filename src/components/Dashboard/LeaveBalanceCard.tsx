import React from 'react';
import { Progress } from '@/components/ui/progress';

interface LeaveBalanceCardProps {
  title: string;
  used: number;
  total: number;
  pending?: number;
  color: 'primary' | 'success' | 'warning';
}

const LeaveBalanceCard = ({ title, used, total, pending = 0, color }: LeaveBalanceCardProps) => {
  const available = total - used;
  const percentage = (used / total) * 100;

  const colorClasses = {
    primary: 'text-primary',
    success: 'text-success',
    warning: 'text-warning'
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-md border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <span className={`text-sm font-medium ${colorClasses[color]}`}>
          {available} days left
        </span>
      </div>
      
      <div className="space-y-4">
        <Progress value={percentage} className="h-2" />
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-foreground">{total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-destructive">{used}</p>
            <p className="text-xs text-muted-foreground">Used</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-warning">{pending}</p>
            <p className="text-xs text-muted-foreground">Pending</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveBalanceCard;