import React, { useState, useEffect } from 'react';
import { Supplier, User, Product, Role } from '../types';
import * as api from '../services/api';
import { PencilIcon, TrashIcon, PlusIcon } from './Icons';
import CSVImporter from './CSVImporter';

interface SuppliersProps {
  currentUser: User;
}

const Suppliers: React.FC<SuppliersProps> = ({ currentUser }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const initialNewSupplierState: Omit<Supplier, 'id'> = {
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
  };
  const [newSupplier, setNewSupplier] = useState<Omit<Supplier, 'id'>>(initialNewSupplierState);

  useEffect(() => {
      const fetchData = async () => {
          setIsLoading(true);
          const [suppliersData, productsData] = await Promise.all([
              api.getSuppliers(),
              api.getProducts(),
          ]);
          setSuppliers(suppliersData);
          setProducts(productsData);
          setIsLoading(false);
      };
      fetchData();
  }, []);

  const handleOpenModal = () => {
    setNewSupplier(initialNewSupplierState);
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setNewSupplier({
      name: supplier.name,
      contactPerson: supplier.contactPerson,
      email: supplier.email,
      phone: supplier.phone,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSupplier(null);
    setNewSupplier(initialNewSupplierState);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSupplier(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSupplier) {
      // Editar fornecedor existente
      const updatedSupplier = await api.updateSupplier(editingSupplier.id, newSupplier);
      setSuppliers(prev => prev.map(s => s.id === editingSupplier.id ? updatedSupplier : s));
    } else {
      // Criar novo fornecedor
      const supplierToAdd = await api.createSupplier(newSupplier);
      setSuppliers(prev => [supplierToAdd, ...prev]);
    }
    handleCloseModal();
  };

  const handleDelete = async (supplierId: number) => {
    if(window.confirm("Tem certeza que deseja excluir este fornecedor?")) {
      await api.deleteSupplier(supplierId);
      setSuppliers(prev => prev.filter(s => s.id !== supplierId));
    }
  }

  const handleImportSuppliers = async (data: any[], options: {importIds: boolean, replaceExisting: boolean}) => {
    try {
      const mappedSuppliers = data.map(row => ({
        ...(options.importIds && row.id ? { id: parseInt(row.id) } : {}),
        name: row.name || row.nome || row.fornecedor,
        contactPerson: row.contactPerson || row.contato || row.responsavel || '',
        email: row.email || '',
        phone: row.phone || row.telefone || row.fone || ''
      }));

      const result = await api.importSuppliers(mappedSuppliers, options);
      
      let message = `✓ Importação concluída com sucesso!\n`;
      message += `${result.imported} fornecedores criados`;
      if (result.updated && result.updated > 0) {
        message += `\n${result.updated} fornecedores atualizados`;
      }
      
      if (result.errors && result.errors.length > 0) {
        message += `\n\n⚠️ Avisos:\n${result.errors.join('\n')}`;
      }
      
      alert(message);
      
      // Recarregar fornecedores
      const updatedSuppliers = await api.getSuppliers();
      setSuppliers(updatedSuppliers);
    } catch (error) {
      throw new Error('Erro ao importar fornecedores: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Fornecedores</h2>
          <div className="flex gap-2">
            <CSVImporter
              onImport={handleImportSuppliers}
              userRole={currentUser.role}
              fieldMappings={{
                id: 'ID (opcional)',
                name: 'Nome do Fornecedor',
                contactPerson: 'Pessoa de Contato',
                email: 'E-mail',
                phone: 'Telefone'
              }}
              sampleData="id,name,contactPerson,email,phone
1,Fornecedor ABC Ltda,João Silva,joao@abc.com,11999999999
2,Distribuidora XYZ,Maria Santos,maria@xyz.com,11988888888"
            />
            <button 
              onClick={handleOpenModal}
              className="flex items-center bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                Novo Fornecedor
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                <th className="py-3 px-4 font-medium">Nome</th>
                <th className="py-3 px-4 font-medium">Contato</th>
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Telefone</th>
                <th className="py-3 px-4 font-medium">Produtos</th>
                <th className="py-3 px-4 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-8">Carregando fornecedores...</td></tr>
              ) : suppliers.map(supplier => {
                  const productCount = products.filter(p => p.supplierId === supplier.id).length;
                  return (
                    <tr key={supplier.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">{supplier.name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{supplier.contactPerson}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{supplier.email}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{supplier.phone}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                           <span className="px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full dark:bg-blue-900 dark:text-blue-200">
                              {productCount} {productCount === 1 ? 'produto' : 'produtos'}
                           </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                            <button onClick={() => handleEdit(supplier)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors">
                                <PencilIcon className="w-5 h-5" />
                            </button>
                            <button onClick={() => handleDelete(supplier.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </td>
                    </tr>
                  )
              })}
            </tbody>
          </table>
        </div>
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
              {editingSupplier ? 'Editar Fornecedor' : 'Adicionar Novo Fornecedor'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
                <input type="text" name="name" id="name" value={newSupplier.name} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
               <div>
                <label htmlFor="contactPerson" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pessoa de Contato</label>
                <input type="text" name="contactPerson" id="contactPerson" value={newSupplier.contactPerson} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input type="email" name="email" id="email" value={newSupplier.email} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                <input type="tel" name="phone" id="phone" value={newSupplier.phone} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
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

export default Suppliers;