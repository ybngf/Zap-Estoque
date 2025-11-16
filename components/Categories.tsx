import React, { useState, useEffect } from 'react';
import { Category, User, Product, Role } from '../types';
import * as api from '../services/api';
import { PencilIcon, TrashIcon, PlusIcon } from './Icons';
import CSVImporter from './CSVImporter';

interface CategoriesProps {
  currentUser: User;
}

const Categories: React.FC<CategoriesProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const [categoriesData, productsData] = await Promise.all([
            api.getCategories(),
            api.getProducts(),
        ]);
        setCategories(categoriesData);
        setProducts(productsData);
        setIsLoading(false);
    };
    fetchData();
  }, []);
  
  const handleOpenModal = () => {
    setNewCategoryName('');
    setEditingCategory(null);
    setIsModalOpen(true);
  };
  
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setNewCategoryName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategoryName.trim()) {
      if (editingCategory) {
        // Editar categoria existente
        const updatedCategory = await api.updateCategory(editingCategory.id, { name: newCategoryName.trim() });
        setCategories(prev => prev.map(c => c.id === editingCategory.id ? updatedCategory : c));
      } else {
        // Criar nova categoria
        const newCategory = await api.createCategory({ name: newCategoryName.trim() });
        setCategories(prev => [newCategory, ...prev]);
      }
      handleCloseModal();
    }
  };

  const handleDelete = async (categoryId: number) => {
    if(window.confirm("Tem certeza que deseja excluir esta categoria?")) {
      await api.deleteCategory(categoryId);
      setCategories(prev => prev.filter(c => c.id !== categoryId));
    }
  }

  const handleImportCategories = async (data: any[], options: {importIds: boolean, replaceExisting: boolean}) => {
    try {
      const mappedCategories = data.map(row => ({
        ...(options.importIds && row.id ? { id: parseInt(row.id) } : {}),
        name: row.name || row.nome || row.categoria,
        description: row.description || row.descricao || ''
      }));

      const result = await api.importCategories(mappedCategories, options);
      
      let message = `✓ Importação concluída com sucesso!\n`;
      message += `${result.imported} categorias criadas`;
      if (result.updated && result.updated > 0) {
        message += `\n${result.updated} categorias atualizadas`;
      }
      
      if (result.errors && result.errors.length > 0) {
        message += `\n\n⚠️ Avisos:\n${result.errors.join('\n')}`;
      }
      
      alert(message);
      
      // Recarregar categorias
      const updatedCategories = await api.getCategories();
      setCategories(updatedCategories);
    } catch (error) {
      throw new Error('Erro ao importar categorias: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Categorias</h2>
          <div className="flex gap-2">
            <CSVImporter
              onImport={handleImportCategories}
              userRole={currentUser.role}
              fieldMappings={{
                id: 'ID (opcional)',
                name: 'Nome da Categoria',
                description: 'Descrição'
              }}
              sampleData="id,name,description
1,Eletrônicos,Produtos eletrônicos e tecnologia
2,Alimentos,Produtos alimentícios"
            />
            <button 
              onClick={handleOpenModal}
              className="flex items-center bg-emerald-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
            >
                <PlusIcon className="w-5 h-5 mr-2" />
                Nova Categoria
            </button>
          </div>
        </div>
        {isLoading ? (
            <div className="text-center py-8">Carregando categorias...</div>
        ) : (
            <ul className="space-y-3">
            {categories
                .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
                .map(category => {
                const productCount = products.filter(p => p.categoryId === category.id).length;
                return (
                <li key={category.id} className="flex justify-between items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                    <div className="flex items-center space-x-4">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{category.name}</span>
                    <span className="px-2 py-1 text-xs font-medium text-emerald-800 bg-emerald-100 rounded-full dark:bg-emerald-900 dark:text-emerald-200">
                        {productCount} {productCount === 1 ? 'produto' : 'produtos'}
                    </span>
                    </div>
                    <div>
                    <button onClick={() => handleEdit(category)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors">
                        <PencilIcon className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(category.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                    </div>
                </li>
                );
            })}
            </ul>
        )}
      </div>

       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">
              {editingCategory ? 'Editar Categoria' : 'Adicionar Nova Categoria'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Categoria</label>
                <input 
                  type="text" 
                  name="name" 
                  id="name" 
                  value={newCategoryName} 
                  onChange={(e) => setNewCategoryName(e.target.value)} 
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

export default Categories;