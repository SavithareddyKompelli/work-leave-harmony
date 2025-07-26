-- HRMS Leave Management Database Schema
-- Copy this SQL and run it in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('employee', 'manager', 'admin');
CREATE TYPE employment_type AS ENUM ('full_time', 'intern', 'trainee');
CREATE TYPE leave_type AS ENUM ('sick', 'casual', 'vacation', 'academic', 'comp_off');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- Users/Employees table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    employee_id TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'employee',
    employment_type employment_type NOT NULL DEFAULT 'full_time',
    department TEXT,
    manager_id UUID REFERENCES users(id),
    join_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave types configuration
CREATE TABLE leave_types_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_type leave_type NOT NULL,
    employment_type employment_type NOT NULL,
    monthly_accrual DECIMAL(3,1) NOT NULL,
    max_carry_forward INTEGER DEFAULT 5,
    advance_notice_days INTEGER DEFAULT 0,
    same_day_allowed BOOLEAN DEFAULT FALSE,
    max_consecutive_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(leave_type, employment_type)
);

-- Leave balances
CREATE TABLE leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    year INTEGER NOT NULL,
    opening_balance DECIMAL(3,1) DEFAULT 0,
    accrued DECIMAL(3,1) DEFAULT 0,
    used DECIMAL(3,1) DEFAULT 0,
    carried_forward DECIMAL(3,1) DEFAULT 0,
    lop_days DECIMAL(3,1) DEFAULT 0,
    current_balance DECIMAL(3,1) GENERATED ALWAYS AS (opening_balance + accrued + carried_forward - used) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, leave_type, year)
);

-- Leave applications
CREATE TABLE leave_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    leave_type leave_type NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(3,1) NOT NULL,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'pending',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_reason TEXT,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    documents JSONB,
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Work from home tracking
CREATE TABLE wfh_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    wfh_date DATE NOT NULL,
    reason TEXT,
    status leave_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wfh_date)
);

-- Comp off tracking
CREATE TABLE comp_off_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    work_date DATE NOT NULL,
    comp_off_date DATE,
    reason TEXT NOT NULL,
    status leave_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public holidays
CREATE TABLE public_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    date DATE NOT NULL,
    year INTEGER NOT NULL,
    is_optional BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date, year)
);

-- Audit log
CREATE TABLE leave_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    leave_application_id UUID REFERENCES leave_applications(id),
    user_id UUID REFERENCES users(id),
    action TEXT NOT NULL,
    performed_by UUID REFERENCES users(id),
    old_status leave_status,
    new_status leave_status,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wfh_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE comp_off_requests ENABLE ROW LEVEL SECURITY;

-- Insert default leave configurations
INSERT INTO leave_types_config (leave_type, employment_type, monthly_accrual, max_carry_forward, advance_notice_days, same_day_allowed) VALUES
('sick', 'full_time', 1.0, 5, 0, true),
('casual', 'full_time', 1.0, 5, 1, false),
('vacation', 'full_time', 1.5, 5, 7, false),
('sick', 'intern', 0.5, 2, 0, true),
('casual', 'intern', 0.5, 2, 1, false),
('sick', 'trainee', 0.5, 2, 0, true),
('casual', 'trainee', 0.5, 2, 1, false),
('academic', 'intern', 0, 0, 7, false),
('academic', 'trainee', 0, 0, 7, false);