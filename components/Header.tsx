
import React, { useState, useEffect } from 'react';
import { User, Company } from '../types';
import { PowerIcon } from './Icons';
import * as api from '../services/api';

interface HeaderProps {
  currentUser: User;
  onLogout: () => void;
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onMenuClick }) => {
  const [companyName, setCompanyName] = useState<string>('');
  const [systemName, setSystemName] = useState<string>('Estoque Gemini');
  const [logoUrl, setLogoUrl] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch company
        const companies = await api.getCompanies();
        const company = companies.find(c => c.id === currentUser.companyId);
        setCompanyName(company?.name || 'Empresa não encontrada');
        
        // Fetch settings
        const settings = await api.getSettings();
        if (settings.system_name?.value) {
          setSystemName(settings.system_name.value);
        }
        if (settings.system_logo_url?.value) {
          setLogoUrl(settings.system_logo_url.value);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setCompanyName('Erro ao carregar');
      }
    };
    fetchData();
  }, [currentUser.companyId]);

  return (
    <header className="h-20 flex-shrink-0 flex items-center justify-between px-4 sm:px-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        {/* Botão Menu Hambúrguer - Apenas Mobile */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Abrir menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-200">
            Bem-vindo(a), {currentUser.name.split(' ')[0]}!
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{companyName}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4">
        <div className="text-right hidden sm:block">
          <p className="font-semibold text-gray-800 dark:text-gray-200">{currentUser.name}</p>
          <p className="text-sm text-emerald-500 font-medium">{currentUser.role}</p>
        </div>
        <img className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover" src={currentUser.avatar} alt={currentUser.name} />
        <button
          onClick={onLogout}
          className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-red-500 dark:hover:text-red-500 transition-colors"
          title="Sair"
        >
          <PowerIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </header>
  );
};

export default Header;
