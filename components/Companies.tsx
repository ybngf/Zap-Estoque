import React, { useState, useEffect } from 'react';
import { Company, User } from '../types';
import * as api from '../services/api';
import { PencilIcon, TrashIcon, PlusIcon } from './Icons';

interface CompaniesProps {
  currentUser: User;
}

const Companies: React.FC<CompaniesProps> = ({ currentUser }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEffect(() => {
      const fetchCompanies = async () => {
          setIsLoading(true);
          const data = await api.getCompanies();
          setCompanies(data);
          setIsLoading(false);
      }
      fetchCompanies();
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
        const newCompany = await api.createCompany({ name: newCompanyName.trim() });
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

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-2xl mx-auto">
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
        {isLoading ? (
            <div className="text-center py-8">Carregando empresas...</div>
        ) : (
            <ul className="space-y-3">
            {companies.map(company => (
                <li key={company.id} className="flex justify-between items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <span className="font-semibold text-gray-800 dark:text-gray-200">{company.name}</span>
                <div>
                    <button onClick={() => handleEdit(company)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(company.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </div>
                </li>
            ))}
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