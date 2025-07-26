# HRMS Leave Management Portal - Setup Instructions

## 🚀 Complete Leave Management System

This is a comprehensive HRMS (Human Resource Management System) Leave Management Portal built for the hackathon competition. The system provides complete leave application, approval workflows, leave balance tracking, and reporting capabilities.

## ✨ Key Features Implemented

### 🎯 Core Requirements
- ✅ Web-based Leave Management Portal
- ✅ Streamlined leave application and approval workflows
- ✅ Leave balance tracking and reporting
- ✅ Support for multiple employee categories (full-time, interns, trainees)
- ✅ Configurable leave quotas through admin interface

### 📝 Leave Types & Policies
- ✅ **Sick Leave**: Can be applied same day (with time cutoff)
- ✅ **Casual Leave**: Requires 1+ working days advance notice
- ✅ **Vacation Leave**: Requires 7+ working days advance notice
- ✅ **Academic Leave**: Available for students with supporting documents
- ✅ Monthly accrual system (configurable rates)

### 🔄 Advanced Features
- ✅ **Loss of Pay (LOP)**: Automatic calculation for leave beyond balance
- ✅ **LOP Limits**: Maximum 10 LOP days per year (configurable)
- ✅ **Edge Case Validation**: Overlapping leaves, holidays/weekends validation
- ✅ **Document Support**: File upload for academic leave and emergency applications
- ✅ **Email Notifications**: Automatic notifications to HR (simulation)

### 👥 Role-Based Access Control
- ✅ **Employee Role**: Apply for leave, view own applications, comp off, WFH
- ✅ **Manager Role**: All employee features + team leave approval
- ✅ **Admin Role**: All features + system configuration and reporting

### 📊 Management Features
- ✅ **Leave Balance Dashboard**: Real-time balance tracking
- ✅ **Pending Applications**: Clear separation from visible balance
- ✅ **Manager Approval System**: Approve/reject with comments
- ✅ **Employee Cancellation**: Cancel leave before start date
- ✅ **Complete Audit Log**: All actions tracked

### 🏠 Additional Features
- ✅ **Work From Home (WFH)**: Mark WFH days with approval workflow
- ✅ **Comp Off Management**: Request compensatory leave for extra work
- ✅ **Carry Forward System**: Monthly carry forward with caps
- ✅ **Holiday Integration**: Public holiday calendar management
- ✅ **Mobile Responsive**: Works on all devices

### 📈 Reporting & Analytics
- ✅ **Comprehensive Reports**: Monthly trends, department analysis
- ✅ **Visual Analytics**: Charts and graphs for insights
- ✅ **Export Functionality**: Report generation capabilities
- ✅ **User Management**: Admin controls for user roles and permissions

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Tailwind CSS + Shadcn/UI
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Charts**: Recharts for analytics
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Form Management**: React Hook Form + Zod validation

## 🚦 Prerequisites

Before setting up the project, ensure you have:

- Node.js (v18 or higher)
- npm or yarn package manager
- A Supabase account (free tier works)
- Git for version control

## 📋 Setup Instructions

### 1. Database Setup (Supabase)

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Run Database Schema**:
   - Go to your Supabase dashboard
   - Navigate to "SQL Editor"
   - Copy and paste the content from `database_schema.sql`
   - Run the script to create all tables and configurations

3. **Set up Authentication**:
   - In Supabase dashboard, go to "Authentication" > "Settings"
   - Configure email authentication
   - Set up email templates (optional)

4. **Configure Storage** (for document uploads):
   - Go to "Storage" in Supabase dashboard
   - Create a bucket named `leave-documents`
   - Set appropriate policies for file uploads

### 2. Project Installation

1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd hrms-leave-management
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**:
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the Application**:
   - Open your browser and navigate to `http://localhost:5173`
   - The application should load with the login screen

### 3. Initial Data Setup

1. **Create Admin User**:
   - Register a new user through the application
   - In Supabase dashboard, go to Authentication > Users
   - Manually update the user's role to 'admin' in the users table

2. **Add Sample Data**:
   ```sql
   -- Add sample departments
   INSERT INTO users (auth_id, email, full_name, employee_id, role, employment_type, department, join_date) VALUES
   ('auth_user_id', 'admin@company.com', 'Admin User', 'EMP001', 'admin', 'full_time', 'IT', '2024-01-01'),
   ('auth_user_id_2', 'manager@company.com', 'Manager User', 'EMP002', 'manager', 'full_time', 'HR', '2024-01-01'),
   ('auth_user_id_3', 'employee@company.com', 'Employee User', 'EMP003', 'employee', 'full_time', 'Finance', '2024-01-01');
   
   -- Add sample holidays
   INSERT INTO public_holidays (name, date, year, is_optional) VALUES
   ('New Year', '2024-01-01', 2024, false),
   ('Independence Day', '2024-08-15', 2024, false),
   ('Gandhi Jayanti', '2024-10-02', 2024, false),
   ('Diwali', '2024-11-01', 2024, true);
   ```

## 🎮 How to Use the System

### For Employees:
1. **Dashboard**: View leave summary and quick actions
2. **Apply Leave**: Submit leave applications with validation
3. **My Leaves**: Track application status and cancel if needed
4. **Work From Home**: Mark WFH days
5. **Comp Off**: Request compensatory leave for weekend/holiday work

### For Managers:
1. **All Employee Features** +
2. **Team Leaves**: Approve/reject team member applications
3. **Reports**: View team analytics and trends

### For Admins:
1. **All Manager Features** +
2. **Settings**: Configure leave policies and holidays
3. **User Management**: Manage user roles and permissions
4. **Advanced Reports**: System-wide analytics

## 🔧 Configuration Options

### Leave Policy Configuration:
- Monthly accrual rates per leave type
- Maximum carry forward limits
- Advance notice requirements
- Same-day application permissions
- Maximum consecutive days

### Holiday Management:
- Add/remove public holidays
- Mark holidays as optional
- Year-wise holiday configuration

### User Management:
- Role assignments (Employee/Manager/Admin)
- Employment type configuration
- Department management
- User activation/deactivation

## 🚨 Important Security Features

1. **Row Level Security (RLS)**: Enabled on all tables
2. **Role-Based Access**: Proper authorization checks
3. **Data Validation**: Input sanitization and validation
4. **Audit Logging**: Complete action tracking
5. **Authentication**: Secure user authentication via Supabase

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🔄 Deployment Options

### Option 1: Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push

### Option 2: Netlify
1. Connect repository to Netlify
2. Configure build settings
3. Add environment variables
4. Deploy

### Option 3: Traditional Hosting
1. Build the project: `npm run build`
2. Upload `dist` folder to your hosting provider
3. Configure environment variables on your server

## 🐛 Troubleshooting

### Common Issues:

1. **Supabase Connection Error**:
   - Verify URL and keys in `.env.local`
   - Check if Supabase project is active

2. **Database Schema Issues**:
   - Ensure the complete schema is executed
   - Check for any SQL errors in Supabase logs

3. **Authentication Problems**:
   - Verify email authentication is enabled
   - Check user permissions and RLS policies

4. **Build Errors**:
   - Clear node_modules and reinstall
   - Check for TypeScript errors
   - Verify all environment variables

## 📞 Support

For technical issues or questions:
1. Check the troubleshooting section above
2. Review the database schema and ensure proper setup
3. Verify all environment variables are correctly configured
4. Check Supabase dashboard for any errors or logs

## 🎯 Hackathon Compliance

This HRMS Leave Management Portal meets all the specified requirements:

✅ **Complete Web-based Solution**: Fully functional web application
✅ **Role-based Access Control**: Employee, Manager, Admin roles
✅ **Leave Application Workflow**: Apply → Approve → Track
✅ **Balance Management**: Real-time tracking with carry forward
✅ **Policy Enforcement**: All business rules implemented
✅ **Reporting & Analytics**: Comprehensive insights
✅ **Mobile Responsive**: Works on all devices
✅ **Secure & Scalable**: Production-ready architecture

## 📊 System Architecture

```
Frontend (React + TypeScript)
    ↓
UI Components (Shadcn/UI + Tailwind)
    ↓
API Layer (Supabase Client)
    ↓
Backend Services (Supabase)
    ↓
Database (PostgreSQL with RLS)
    ↓
Authentication & Storage (Supabase Auth + Storage)
```

## 🔮 Future Enhancements

Potential features for v2.0:
- Email notification integration
- Calendar view for leave planning
- Bulk approval capabilities
- Advanced reporting filters
- Integration with payroll systems
- Mobile app development
- Slack/Teams integration

---

**Built with ❤️ for the HRMS Hackathon Competition**