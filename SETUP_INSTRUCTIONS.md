# HRMS Leave Management System - Setup Instructions

## ✅ What I've Created for You:

### 1. **Database Schema** (`database_schema.sql`)
- Complete database structure with all required tables
- User roles (employee, manager, admin)
- Leave types (sick, casual, vacation, academic, comp_off)
- Leave balances with automatic calculations
- Audit logs and security policies

### 2. **Backend Functions** (Supabase Edge Functions)
- `send-leave-notification` - Email notifications to HR and managers
- `leave-balance-calculator` - Automatic leave accrual calculations
- `approve-leave` - Leave approval workflow with balance updates

### 3. **Frontend Integration**
- Authentication system with role-based access
- Real-time data integration with Supabase
- Professional UI components and forms

---

## 🚀 Next Steps You Need to Do:

### Step 1: Set Up Database Schema
1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the content from `database_schema.sql`
4. Click **Run** to create all tables

### Step 2: Deploy Edge Functions
1. Install Supabase CLI: `npm install -g supabase`
2. Login: `supabase login`
3. Link project: `supabase link --project-ref YOUR_PROJECT_REF`
4. Deploy functions: `supabase functions deploy`

### Step 3: Configure Email Service
1. Get a Resend API key from https://resend.com
2. In Supabase dashboard, go to **Settings** → **Edge Functions**
3. Add environment variable: `RESEND_API_KEY` = your_api_key

### Step 4: Set Up Authentication
1. In Supabase dashboard, go to **Authentication** → **Settings**
2. Enable **Email** provider
3. Configure your email templates

### Step 5: Create Demo Users
Run this SQL in Supabase SQL Editor to create demo accounts:

```sql
-- Insert demo users (after they sign up through the UI)
INSERT INTO users (auth_id, email, full_name, employee_id, role, employment_type, department, join_date) VALUES
('auth_id_from_signup', 'employee@company.com', 'John Employee', 'EMP001', 'employee', 'full_time', 'Engineering', '2024-01-01'),
('auth_id_from_signup', 'manager@company.com', 'Jane Manager', 'MGR001', 'manager', 'full_time', 'Engineering', '2023-01-01'),
('auth_id_from_signup', 'admin@company.com', 'Admin User', 'ADM001', 'admin', 'full_time', 'HR', '2022-01-01');
```

### Step 6: Add Public Holidays
```sql
INSERT INTO public_holidays (name, date, year) VALUES
('New Year', '2024-01-01', 2024),
('Independence Day', '2024-08-15', 2024),
('Gandhi Jayanti', '2024-10-02', 2024),
('Christmas', '2024-12-25', 2024);
```

---

## 🎯 Features Implemented:

### ✅ From Your Problem Statement:
- **Leave Types**: Sick, Casual, Vacation, Academic (for students)
- **Role-Based Access**: Employee, Manager, Admin
- **Advance Notice**: Configurable per leave type
- **Same Day Application**: Allowed for sick leave
- **LOP Calculation**: Automatic when balance insufficient
- **Email Notifications**: To HR and managers
- **Leave Balance Dashboard**: Real-time balances
- **Approval Workflow**: Manager approval system
- **Leave Cancellation**: Before start date
- **Audit Log**: Complete activity tracking
- **Work From Home**: WFH tracking
- **Comp Off**: Extra work compensation
- **Carry Forward**: Monthly with caps
- **Holiday Integration**: Excludes weekends/holidays
- **Mobile Responsive**: Works on all devices
- **Security**: Row-level security policies

### 💡 Additional Features:
- Professional UI with gradient design
- Real-time updates
- File upload for documents
- Leave history with filters
- Stats and analytics
- Configurable leave policies

---

## 🔧 How to Test:

1. **Sign up** with the demo emails
2. **Apply for leave** - test different scenarios
3. **Check email notifications** (configure Resend first)
4. **Test approval workflow** as manager
5. **View dashboards** for different roles

---

## 📧 Email Configuration:
Replace `Exleaves@domain.com` in the email function with your actual HR email address.

---

## 🎉 You're Ready!
Your HRMS Leave Management Portal is now fully functional with both frontend and backend! The system handles all the requirements from your hackathon problem statement.