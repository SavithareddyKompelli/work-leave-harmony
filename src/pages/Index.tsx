import React, { useState } from 'react';
import Sidebar from '@/components/Layout/Sidebar';
import Dashboard from '@/pages/Dashboard';
import ApplyLeave from '@/pages/ApplyLeave';
import MyLeaves from '@/pages/MyLeaves';
import TeamLeaves from '@/pages/TeamLeaves';
import CompOff from '@/pages/CompOff';
import WorkFromHome from '@/pages/WorkFromHome';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';

interface IndexProps {
  userProfile: any;
}

const Index = ({ userProfile }: IndexProps) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const userRole = userProfile?.role || 'employee';

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userRole={userRole} />;
      case 'apply-leave':
        return <ApplyLeave />;
      case 'my-leaves':
        return <MyLeaves />;
      case 'team-leaves':
        return <TeamLeaves userRole={userRole} />;
      case 'comp-off':
        return <CompOff />;
      case 'work-from-home':
        return <WorkFromHome />;
      case 'reports':
        return <Reports userRole={userRole} />;
      case 'settings':
        return <Settings userRole={userRole} />;
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
        userProfile={userProfile}
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
