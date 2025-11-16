import React from 'react';
import { Role, User } from '../types';
import { ChartPieIcon, CubeIcon, TagIcon, TruckIcon, UsersIcon, ArrowsRightLeftIcon, DocumentArrowUpIcon, BuildingOfficeIcon, ChartBarIcon, CogIcon } from './Icons';
import * as api from '../services/api';

type View = 'dashboard' | 'products' | 'categories' | 'suppliers' | 'users' | 'movements' | 'invoice-processor' | 'companies' | 'activity-log' | 'reports' | 'settings' | 'company-settings' | 'critical-activity-report';

interface SidebarProps {
  view: View;
  setView: (view: View) => void;
  hasPermission: (role: Role) => boolean;
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User;
}

const Sidebar: React.FC<SidebarProps> = ({ view, setView, hasPermission, isOpen, onClose, currentUser }) => {
  const [companyName, setCompanyName] = React.useState<string>('Estoque Gemini');
  const [logoUrl, setLogoUrl] = React.useState<string>('');

  React.useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        // Se for Super Admin, mostra configurações do sistema
        if (currentUser?.role === Role.SuperAdmin) {
          const settings = await api.getSettings();
          if (settings.system_name?.value) {
            setCompanyName(settings.system_name.value);
          }
          if (settings.system_logo_url?.value) {
            setLogoUrl(settings.system_logo_url.value);
          }
        } else {
          // Caso contrário, mostra logo e nome da empresa do usuário
          const companySettings = await api.getCompanySettings();
          
          // Buscar nome da empresa
          if (currentUser?.companyId) {
            const companies = await api.getCompanies();
            const userCompany = companies.find(c => c.id === currentUser.companyId);
            if (userCompany) {
              setCompanyName(userCompany.name);
            }
          }
          
          // Buscar logo da empresa
          if (companySettings.company_logo_url?.value) {
            setLogoUrl(companySettings.company_logo_url.value);
          }
        }
      } catch (error) {
        console.warn('Could not load company settings:', error);
      }
    };
    
    if (currentUser) {
      loadCompanySettings();
    }
  }, [currentUser]);

  const navItems = [
    { name: 'Dashboard', icon: ChartPieIcon, view: 'dashboard', requiredRole: Role.Employee },
    { name: 'Produtos', icon: CubeIcon, view: 'products', requiredRole: Role.Employee },
    { name: 'Categorias', icon: TagIcon, view: 'categories', requiredRole: Role.Manager },
    { name: 'Fornecedores', icon: TruckIcon, view: 'suppliers', requiredRole: Role.Manager },
    { name: 'Movimentações', icon: ArrowsRightLeftIcon, view: 'movements', requiredRole: Role.Employee },
    { name: 'Relatórios', icon: ChartBarIcon, view: 'reports', requiredRole: Role.Employee },
    { name: 'Processar Nota', icon: DocumentArrowUpIcon, view: 'invoice-processor', requiredRole: Role.Manager },
    { name: 'Log de Atividades', icon: DocumentArrowUpIcon, view: 'activity-log', requiredRole: Role.Admin },
    { name: 'Usuários', icon: UsersIcon, view: 'users', requiredRole: Role.Admin },
    { name: 'Configurações', icon: CogIcon, view: 'company-settings', requiredRole: Role.Admin },
    { name: 'Empresas', icon: BuildingOfficeIcon, view: 'companies', requiredRole: Role.SuperAdmin },
    { name: '🔒 Atividades Críticas', icon: DocumentArrowUpIcon, view: 'critical-activity-report', requiredRole: Role.SuperAdmin },
    { name: 'Config. Sistema', icon: CogIcon, view: 'settings', requiredRole: Role.SuperAdmin },
  ];

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30
      w-64 flex-shrink-0 
      bg-gray-800 dark:bg-gray-900 text-gray-300 flex flex-col
      transform transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Botão de fechar (apenas mobile) */}
      <button
        onClick={onClose}
        className="lg:hidden absolute top-4 right-4 text-gray-400 hover:text-white z-40"
        aria-label="Fechar menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div className="h-20 flex items-center justify-center text-2xl font-bold text-white px-4">
        {logoUrl ? (
          <img src={logoUrl} alt={companyName} className="h-12 object-contain" onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
          }} />
        ) : (
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{companyName}</span>
        )}
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {navItems.map(item =>
          hasPermission(item.requiredRole) && (
            <button
              key={item.name}
              onClick={() => setView(item.view as View)}
              className={`w-full flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
                view === item.view
                  ? 'bg-emerald-600 text-white shadow-lg'
                  : 'hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-6 h-6 mr-3" />
              <span>{item.name}</span>
            </button>
          )
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;