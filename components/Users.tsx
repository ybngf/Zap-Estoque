import React, { useState, useEffect } from 'react';
import { User, Role, Company } from '../types';
import * as api from '../services/api';
import { PencilIcon, TrashIcon, PlusIcon } from './Icons';

interface UsersProps {
  currentUser: User;
}

const roleColors: Record<Role, string> = {
    [Role.SuperAdmin]: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200',
    [Role.Admin]: 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-purple-200',
    [Role.Manager]: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-blue-200',
    [Role.Employee]: 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200',
};

const Users: React.FC<UsersProps> = ({ currentUser }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  
  const initialNewUserState = {
    name: '',
    email: '',
    password: '',
    role: Role.Employee,
    companyId: currentUser.companyId,
    avatar: '',
  };

  const [newUser, setNewUser] = useState<Omit<User, 'id'>>(initialNewUserState);

  useEffect(() => {
      const fetchData = async () => {
          setIsLoading(true);
          const [usersData, companiesData] = await Promise.all([
            api.getUsers(),
            api.getCompanies()
          ]);
          setUsers(usersData);
          setCompanies(companiesData);
          setIsLoading(false);
      };
      fetchData();
  }, []);

  const handleOpenModal = () => {
    setNewUser(initialNewUserState);
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      email: user.email,
      password: '', // Deixar vazio - não enviar senha se não mudou
      role: user.role,
      companyId: user.companyId,
      avatar: user.avatar || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setNewUser(initialNewUserState);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // Converter companyId para número
    const parsedValue = name === 'companyId' ? parseInt(value) : value;
    setNewUser(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      // Editar usuário existente
      const dataToUpdate = { ...newUser };
      // Se a senha estiver vazia, não incluir no update (backend vai ignorar)
      if (!dataToUpdate.password || dataToUpdate.password.trim() === '') {
        delete (dataToUpdate as any).password;
      }
      const updatedUser = await api.updateUser(editingUser.id, dataToUpdate);
      setUsers(prev => prev.map(u => u.id === editingUser.id ? updatedUser : u));
    } else {
      // Criar novo usuário
      const userToAdd = await api.createUser(newUser);
      setUsers(prev => [userToAdd, ...prev]);
    }
    handleCloseModal();
  };

  const handleDelete = async (userId: number) => {
    if(currentUser.id === userId) {
        alert("Você não pode excluir a si mesmo.");
        return;
    }
    if(window.confirm("Tem certeza que deseja excluir este usuário?")) {
        await api.deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
    }
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Usuários</h2>
          <button 
            onClick={handleOpenModal}
            className="flex items-center bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
          >
              <PlusIcon className="w-5 h-5 mr-2" />
              Novo Usuário
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                <th className="py-3 px-4 font-medium">Usuário</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Empresa</th>
                <th className="py-3 px-4 font-medium">Nível</th>
                <th className="py-3 px-4 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                  <tr><td colSpan={5} className="text-center py-8">Carregando usuários...</td></tr>
              ) : users.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="py-3 px-4">
                          <div className="flex items-center space-x-3">
                              <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover"/>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">{user.name}</span>
                          </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        {companies.find(c => c.id === user.companyId)?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${roleColors[user.role]}`}>
                              {user.role}
                          </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                          <button onClick={() => handleEdit(user)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors">
                              <PencilIcon className="w-5 h-5" />
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                              <TrashIcon className="w-5 h-5" />
                          </button>
                      </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 scale-100">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
              {editingUser ? 'Editar Usuário' : 'Adicionar Novo Usuário'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input type="text" name="name" id="name" value={newUser.name} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" name="email" id="email" value={newUser.email} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Senha {editingUser && <span className="text-xs text-gray-500">(deixe vazio para não alterar)</span>}
                </label>
                <input 
                  type="password" 
                  name="password" 
                  id="password" 
                  value={newUser.password} 
                  onChange={handleInputChange} 
                  required={!editingUser}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              </div>
               <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nível de Acesso</label>
                <select name="role" id="role" value={newUser.role} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  <option value={Role.Employee}>Employee</option>
                  <option value={Role.Manager}>Manager</option>
                  <option value={Role.Admin}>Admin</option>
                  {currentUser.role === Role.SuperAdmin && <option value={Role.SuperAdmin}>Super Admin</option>}
                </select>
              </div>
               <div>
                <label htmlFor="companyId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Empresa</label>
                <select 
                  name="companyId" 
                  id="companyId" 
                  value={newUser.companyId} 
                  onChange={handleInputChange} 
                  required 
                  disabled={currentUser.role !== Role.SuperAdmin} 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
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

export default Users;