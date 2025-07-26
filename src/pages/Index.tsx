import React, { useState } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Dashboard from '@/pages/Dashboard';
import ApplyLeave from '@/pages/ApplyLeave';
import MyLeaves from '@/pages/MyLeaves';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userRole] = useState<'employee' | 'manager' | 'admin'>('employee');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userRole={userRole} />;
      case 'apply-leave':
        return <ApplyLeave />;
      case 'my-leaves':
        return <MyLeaves />;
      case 'team-leaves':
        return <div className="p-8"><h1 className="text-2xl font-bold">Team Leaves (Coming Soon)</h1></div>;
      case 'reports':
        return <div className="p-8"><h1 className="text-2xl font-bold">Reports (Coming Soon)</h1></div>;
      case 'settings':
        return <div className="p-8"><h1 className="text-2xl font-bold">Settings (Coming Soon)</h1></div>;
      case 'comp-off':
        return <div className="p-8"><h1 className="text-2xl font-bold">Comp Off (Coming Soon)</h1></div>;
      default:
        return <Dashboard userRole={userRole} />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        currentPage={currentPage} 
        onPageChange={setCurrentPage}
        userRole={userRole}
      />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {renderPage()}
        </div>
      </main>
    </div>
  );
};

export default Index;
