import React, { useState, useMemo } from 'react';
import { User, Role } from './types';
import { USERS } from './constants';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Products from './components/Products';
import Categories from './components/Categories';
import Suppliers from './components/Suppliers';
import Users from './components/Users';
import StockMovements from './components/StockMovements';
import InvoiceProcessor from './components/InvoiceProcessor';
import Companies from './components/Companies';
import ActivityLog from './components/ActivityLog';
import Reports from './components/Reports';
import Settings from './components/Settings';
import CompanySettings from './components/CompanySettings';
import CriticalActivityReport from './components/CriticalActivityReport';
import ErrorBoundary from './components/ErrorBoundary';
import * as api from './services/api';

type View = 'dashboard' | 'products' | 'categories' | 'suppliers' | 'users' | 'movements' | 'invoice-processor' | 'companies' | 'activity-log' | 'reports' | 'settings' | 'company-settings' | 'critical-activity-report';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = async (email: string, pass: string): Promise<boolean> => {
    const user = await api.login(email, pass);
    if (user) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('dashboard');
  };

  const hasPermission = (requiredRole: Role): boolean => {
    if (!currentUser) return false;
    const roleHierarchy: Record<Role, number> = {
      [Role.SuperAdmin]: 3,
      [Role.Admin]: 2,
      [Role.Manager]: 1,
      [Role.Employee]: 0,
    };
    return roleHierarchy[currentUser.role] >= roleHierarchy[requiredRole];
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard setView={setView} currentUser={currentUser!} />;
      case 'products':
        return (
          <ErrorBoundary>
            <Products currentUser={currentUser!} />
          </ErrorBoundary>
        );
      case 'categories':
        return <Categories currentUser={currentUser!} />;
      case 'suppliers':
        return <Suppliers currentUser={currentUser!} />;
      case 'users':
        return <Users currentUser={currentUser!} />;
      case 'movements':
        return <StockMovements currentUser={currentUser!} />;
      case 'invoice-processor':
          return <InvoiceProcessor currentUser={currentUser!} />;
      case 'companies':
          return <Companies currentUser={currentUser!} />;
      case 'activity-log':
          return <ActivityLog currentUser={currentUser!} />;
      case 'reports':
          return <Reports />;
      case 'settings':
          return <Settings currentUser={currentUser!} />;
      case 'company-settings':
          return <CompanySettings currentUser={currentUser!} />;
      case 'critical-activity-report':
          return <CriticalActivityReport />;
      default:
        return <Dashboard setView={setView} currentUser={currentUser!} />;
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Overlay para fechar sidebar em mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      <Sidebar 
        view={view} 
        setView={(newView) => {
          setView(newView);
          setIsSidebarOpen(false); // Fecha o menu ao selecionar item
        }}
        hasPermission={hasPermission}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentUser={currentUser}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentUser={currentUser} 
          onLogout={handleLogout}
          onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 md:p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;