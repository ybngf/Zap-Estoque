import React, { useState, useEffect } from 'react';
import { Company, User } from '../types';
import * as api from '../services/api';
import { PencilIcon, TrashIcon, PlusIcon } from './Icons';

interface CompaniesProps {
  currentUser: User;
}

const Companies: React.FC<CompaniesProps> = ({ currentUser }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  useEffect(() => {
      const fetchData = async () => {
          setIsLoading(true);
          const [companiesData, usersData] = await Promise.all([
            api.getCompanies(),
            api.getUsers()
          ]);
          setCompanies(companiesData);
          setUsers(usersData);
          setIsLoading(false);
      }
      fetchData();
  }, []);
  
  const handleOpenModal = () => {
    setNewCompanyName('');
    setEditingCompany(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setNewCompanyName(company.name);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
    setNewCompanyName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompanyName.trim()) {
      if (editingCompany) {
        // Editar empresa existente
        const updatedCompany = await api.updateCompany(editingCompany.id, { name: newCompanyName.trim() });
        setCompanies(prev => prev.map(c => c.id === editingCompany.id ? updatedCompany : c));
      } else {
        // Criar nova empresa
        const newCompany = await api.createCompany({ name: newCompanyName.trim(), active: 1 });
        setCompanies(prev => [newCompany, ...prev]);
      }
      handleCloseModal();
    }
  };
  
  const handleDelete = async (companyId: number) => {
      if(window.confirm("Tem certeza que deseja excluir esta empresa?")) {
          await api.deleteCompany(companyId);
          setCompanies(prev => prev.filter(c => c.id !== companyId));
      }
  }

  const handleToggleActive = async (companyId: number) => {
    try {
      const updatedCompany = await api.toggleCompanyActive(companyId);
      setCompanies(prev => prev.map(c => c.id === companyId ? updatedCompany : c));
      // Recarregar usuários para refletir mudanças
      const usersData = await api.getUsers();
      setUsers(usersData);
    } catch (error: any) {
      alert(error.message || 'Erro ao alterar status da empresa');
    }
  }

  // Contar usuários por empresa
  const getUserCount = (companyId: number) => {
    return users.filter(u => u.companyId === companyId).length;
  }

  // Filtrar empresas
  const filteredCompanies = companies.filter(company => {
    if (filterActive === 'active') return company.active === 1;
    if (filterActive === 'inactive') return company.active === 0;
    return true;
  });

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Empresas</h2>
          <button 
            onClick={handleOpenModal}
            className="flex items-center bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
          >
              <PlusIcon className="w-5 h-5 mr-2" />
              Nova Empresa
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setFilterActive('all')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filterActive === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Todas ({companies.length})
          </button>
          <button 
            onClick={() => setFilterActive('active')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filterActive === 'active' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Ativas ({companies.filter(c => c.active === 1).length})
          </button>
          <button 
            onClick={() => setFilterActive('inactive')}
            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${filterActive === 'inactive' ? 'bg-red-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Inativas ({companies.filter(c => c.active === 0).length})
          </button>
        </div>

        {isLoading ? (
            <div className="text-center py-8">Carregando empresas...</div>
        ) : (
            <ul className="space-y-3">
            {filteredCompanies.map(company => (
                <li key={company.id} className="flex justify-between items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{company.name}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${company.active === 1 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {company.active === 1 ? '✓ Ativa' : '✗ Inativa'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {getUserCount(company.id)} usuário(s)
                  </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Toggle Ativar/Desativar */}
                    <button 
                      onClick={() => handleToggleActive(company.id)} 
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${company.active === 1 ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`}
                      title={company.active === 1 ? 'Desativar empresa e seus usuários' : 'Reativar empresa e seus usuários'}
                    >
                      {company.active === 1 ? 'Desativar' : 'Ativar'}
                    </button>
                    <button onClick={() => handleEdit(company)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors" title="Editar">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(company.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors" title="Excluir">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
                </li>
            ))}
            {filteredCompanies.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Nenhuma empresa encontrada
              </div>
            )}
            </ul>
        )}
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
              {editingCompany ? 'Editar Empresa' : 'Adicionar Nova Empresa'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Empresa</label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  value={newCompanyName} 
                  onChange={(e) => setNewCompanyName(e.target.value)} 
                  required 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 font-semibold transition-colors">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Companies;