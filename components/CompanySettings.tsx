import React, { useState, useEffect } from 'react';
import type { User, CompanySettingsResponse, CompanySettings } from '../types';
import * as api from '../services/api';
import { CheckIcon, XMarkIcon } from './Icons';

interface CompanySettingsProps {
  currentUser: User;
}

const CompanySettings: React.FC<CompanySettingsProps> = ({ currentUser }) => {
  const [settings, setSettings] = useState<CompanySettingsResponse | null>(null);
  const [formData, setFormData] = useState<Partial<CompanySettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Admin Tools states
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [isProcessingTool, setIsProcessingTool] = useState(false);
  const [toolMessage, setToolMessage] = useState<string | null>(null);
  const [toolError, setToolError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    action: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    // Check if user is Admin or SuperAdmin
    setIsAdmin(currentUser.role === 'Admin' || currentUser.role === 'Super Admin');
    loadSettings();
    loadCategories();
  }, [currentUser]);

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err: any) {
      console.error('Erro ao carregar categorias:', err);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getCompanySettings();
      setSettings(data);
      
      // Convert to form data
      const form: Partial<CompanySettings> = {};
      Object.keys(data).forEach(key => {
        form[key as keyof CompanySettings] = data[key as keyof CompanySettings].value;
      });
      setFormData(form);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked ? '1' : '0' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAdmin) {
      setError('Apenas administradores podem editar configurações.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const result = await api.updateCompanySettings(formData);
      
      if (result.success) {
        setSuccessMessage(`✅ ${result.updated} configuração(ões) atualizada(s) com sucesso!`);
        setTimeout(() => setSuccessMessage(null), 5000);
        await loadSettings(); // Reload to get updated data
      }
      
      if (result.errors && result.errors.length > 0) {
        setError(result.errors.join(', '));
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (settings) {
      const form: Partial<CompanySettings> = {};
      Object.keys(settings).forEach(key => {
        form[key as keyof CompanySettings] = settings[key as keyof CompanySettings].value;
      });
      setFormData(form);
    }
    setError(null);
    setSuccessMessage(null);
  };

  // Admin Tools handlers
  const handleCategoryToggle = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map(c => c.id));
    }
  };

  const handleZeroStock = () => {
    if (selectedCategories.length === 0) {
      setToolError('Selecione pelo menos uma categoria.');
      return;
    }

    const categoryNames = categories
      .filter(c => selectedCategories.includes(c.id))
      .map(c => c.name)
      .join(', ');

    setConfirmDialog({
      show: true,
      action: 'zero-stock',
      message: `⚠️ ATENÇÃO: Esta ação irá ZERAR o estoque de todos os produtos nas categorias: ${categoryNames}. Esta operação NÃO pode ser desfeita. Deseja continuar?`,
      onConfirm: async () => {
        try {
          setIsProcessingTool(true);
          setToolError(null);
          setToolMessage(null);
          
          const data = await api.bulkZeroStock(selectedCategories);
          
          setToolMessage(`✅ ${data.affected} produtos tiveram o estoque zerado com sucesso!`);
          setSelectedCategories([]);
        } catch (err: any) {
          setToolError(err.message || 'Erro ao zerar estoque');
        } finally {
          setIsProcessingTool(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleClearMovements = () => {
    if (selectedCategories.length === 0) {
      setToolError('Selecione pelo menos uma categoria.');
      return;
    }

    const categoryNames = categories
      .filter(c => selectedCategories.includes(c.id))
      .map(c => c.name)
      .join(', ');

    setConfirmDialog({
      show: true,
      action: 'clear-movements',
      message: `⚠️ PERIGO: Esta ação irá APAGAR TODAS as movimentações de estoque dos produtos nas categorias: ${categoryNames}. TODO o histórico será PERDIDO e NÃO pode ser recuperado. Tem CERTEZA ABSOLUTA?`,
      onConfirm: async () => {
        try {
          setIsProcessingTool(true);
          setToolError(null);
          setToolMessage(null);
          
          const data = await api.bulkClearMovements(selectedCategories);
          
          setToolMessage(`✅ ${data.affected} movimentações foram apagadas.`);
          setSelectedCategories([]);
        } catch (err: any) {
          setToolError(err.message || 'Erro ao apagar movimentações');
        } finally {
          setIsProcessingTool(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleDeleteProducts = () => {
    if (selectedCategories.length === 0) {
      setToolError('Selecione pelo menos uma categoria.');
      return;
    }

    const categoryNames = categories
      .filter(c => selectedCategories.includes(c.id))
      .map(c => c.name)
      .join(', ');

    setConfirmDialog({
      show: true,
      action: 'delete-products',
      message: `🚨 PERIGO EXTREMO: Esta ação irá APAGAR PERMANENTEMENTE todos os produtos E suas movimentações nas categorias: ${categoryNames}. Esta ação é IRREVERSÍVEL. Confirma a EXCLUSÃO PERMANENTE?`,
      onConfirm: async () => {
        try {
          setIsProcessingTool(true);
          setToolError(null);
          setToolMessage(null);
          
          const data = await api.bulkDeleteProducts(selectedCategories);
          
          setToolMessage(`✅ ${data.affected} produtos foram apagados permanentemente.`);
          setSelectedCategories([]);
        } catch (err: any) {
          setToolError(err.message || 'Erro ao apagar produtos');
        } finally {
          setIsProcessingTool(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  const handleUpdateProductImages = () => {
    if (selectedCategories.length === 0) {
      setToolError('Selecione pelo menos uma categoria.');
      return;
    }

    const isAllCategories = selectedCategories.length === categories.length;
    const categoryNames = isAllCategories 
      ? 'TODAS as categorias' 
      : categories
          .filter(c => selectedCategories.includes(c.id))
          .map(c => c.name)
          .join(', ');

    const scopeMessage = isAllCategories
      ? '🌐 ATENÇÃO: Você selecionou TODAS as categorias. A IA irá processar TODOS OS PRODUTOS cadastrados na empresa!'
      : `📂 A IA irá processar apenas os produtos das categorias: ${categoryNames}`;

    setConfirmDialog({
      show: true,
      action: 'update-images',
      message: `🤖 Atualização Automática de Fotos por IA\n\n${scopeMessage}\n\nEsta operação pode levar alguns minutos dependendo da quantidade de produtos. As fotos atuais serão substituídas por imagens adequadas baseadas no nome de cada produto.\n\n⚠️ Certifique-se de ter configurado sua chave de API do Pixabay nas configurações para evitar limite de requisições.\n\nDeseja continuar?`,
      onConfirm: async () => {
        try {
          setIsProcessingTool(true);
          setToolError(null);
          setToolMessage(null);
          
          const data = await api.bulkUpdateImages(selectedCategories);
          
          const totalProcessed = data.updated + data.skipped;
          setToolMessage(`✅ ${data.updated} produtos tiveram suas fotos atualizadas com sucesso! ${data.skipped > 0 ? `\n⚠️ ${data.skipped} produtos não encontraram imagem adequada na API Pixabay.\n\n📊 Total processado: ${totalProcessed} produtos` : `\n\n📊 Total processado: ${totalProcessed} produtos`}`);
          setSelectedCategories([]);
        } catch (err: any) {
          setToolError(err.message || 'Erro ao atualizar fotos');
        } finally {
          setIsProcessingTool(false);
          setConfirmDialog(null);
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-400">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Configurações da Empresa</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {isAdmin ? 'Configure as preferências e informações da sua empresa' : 'Visualização das configurações da empresa (somente Admin pode editar)'}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
          <XMarkIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2">
          <CheckIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <p className="text-emerald-700 dark:text-emerald-300">{successMessage}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Grid de Seções */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 1. Integração com IA */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span>🤖</span> Integração com IA
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="gemini_api_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Google Gemini API Key
                </label>
                <input
                  type="password"
                  id="gemini_api_key"
                  name="gemini_api_key"
                  value={formData.gemini_api_key || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="AIza..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {settings?.gemini_api_key?.description}
                </p>
                <a 
                  href="https://makersuite.google.com/app/apikey" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline inline-block"
                >
                  → Obter chave de API do Google Gemini
                </a>
              </div>

              <div>
                <label htmlFor="pixabay_api_key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pixabay API Key
                </label>
                <input
                  type="text"
                  id="pixabay_api_key"
                  name="pixabay_api_key"
                  value={formData.pixabay_api_key || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="46737899-b38ce8e1a26a3f4110dae3156"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {settings?.pixabay_api_key?.description || 'Chave de API do Pixabay para busca automática de imagens de produtos'}
                </p>
                <a 
                  href="https://pixabay.com/api/docs/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline inline-block"
                >
                  → Obter chave de API do Pixabay (Gratuita)
                </a>
              </div>
            </div>
          </div>

          {/* 2. Preferências de Documentos */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span>📄</span> Documentos
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="invoice_prefix" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prefixo de Notas Fiscais
                </label>
                <input
                  type="text"
                  id="invoice_prefix"
                  name="invoice_prefix"
                  value={formData.invoice_prefix || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="INV-001-"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {settings?.invoice_prefix?.description}
                </p>
              </div>

              <div>
                <label htmlFor="default_payment_terms" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prazo de Pagamento Padrão (dias)
                </label>
                <input
                  type="number"
                  id="default_payment_terms"
                  name="default_payment_terms"
                  value={formData.default_payment_terms || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  min="0"
                  placeholder="30"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {settings?.default_payment_terms?.description}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Impostos e Finanças */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span>💰</span> Impostos e Finanças
            </h2>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Taxa de Imposto Padrão (%)
                </label>
                <input
                  type="number"
                  id="tax_rate"
                  name="tax_rate"
                  value={formData.tax_rate || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {settings?.tax_rate?.description}
                </p>
              </div>

              <div>
                <label htmlFor="company_tax_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  CNPJ/CPF
                </label>
                <input
                  type="text"
                  id="company_tax_id"
                  name="company_tax_id"
                  value={formData.company_tax_id || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="00.000.000/0000-00"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {settings?.company_tax_id?.description}
                </p>
              </div>
            </div>
          </div>

          {/* 4. Alertas e Notificações */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span>🔔</span> Alertas e Notificações
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="low_stock_alert_enabled"
                  name="low_stock_alert_enabled"
                  checked={formData.low_stock_alert_enabled === '1'}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div>
                  <label htmlFor="low_stock_alert_enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Alertas de Estoque Baixo
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {settings?.low_stock_alert_enabled?.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="email_notifications_enabled"
                  name="email_notifications_enabled"
                  checked={formData.email_notifications_enabled === '1'}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div>
                  <label htmlFor="email_notifications_enabled" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    Notificações por Email
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {settings?.email_notifications_enabled?.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Informações da Empresa */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-200 dark:border-gray-700 lg:col-span-2">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <span>🏢</span> Informações da Empresa
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="company_logo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL do Logotipo
                </label>
                <input
                  type="text"
                  id="company_logo_url"
                  name="company_logo_url"
                  value={formData.company_logo_url || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="https://exemplo.com/logo.png"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {formData.company_logo_url && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview:</p>
                    <img 
                      src={formData.company_logo_url} 
                      alt="Logo" 
                      className="h-16 object-contain border border-gray-300 dark:border-gray-600 rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="company_address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Endereço Completo
                </label>
                <textarea
                  id="company_address"
                  name="company_address"
                  value={formData.company_address || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  rows={3}
                  placeholder="Rua, Número, Bairro, Cidade - UF, CEP"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                />
              </div>

              <div>
                <label htmlFor="company_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  id="company_phone"
                  name="company_phone"
                  value={formData.company_phone || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="(00) 0000-0000"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="company_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="company_email"
                  name="company_email"
                  value={formData.company_email || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="contato@empresa.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label htmlFor="company_website" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  id="company_website"
                  name="company_website"
                  value={formData.company_website || ''}
                  onChange={handleInputChange}
                  disabled={!isAdmin}
                  placeholder="https://www.empresa.com"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Ferramentas Administrativas */}
          {isAdmin && (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border-2 border-red-300 dark:border-red-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-3xl">⚠️</div>
                <div>
                  <h2 className="text-xl font-semibold text-red-800 dark:text-red-300">
                    Ferramentas Administrativas
                  </h2>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                    CUIDADO: Operações irreversíveis que podem apagar dados permanentemente!
                  </p>
                </div>
              </div>

              {/* Mensagens de Feedback */}
              {toolMessage && (
                <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg text-green-800 dark:text-green-300">
                  {toolMessage}
                </div>
              )}

              {toolError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-800 dark:text-red-300">
                  ❌ {toolError}
                </div>
              )}

              {/* Seleção de Categorias */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-red-800 dark:text-red-300">
                    Selecione as Categorias (ou "Todas" para aplicar em todos os produtos)
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllCategories}
                    className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium"
                  >
                    {selectedCategories.length === categories.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                  </button>
                </div>

                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    💡 <strong>Dica:</strong> Se você selecionou todas as categorias, a operação será aplicada em <strong>TODOS os produtos da empresa</strong>.
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Categorias selecionadas: <strong>{selectedCategories.length}</strong> de <strong>{categories.length}</strong>
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                  {categories.map(category => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {category.name}
                      </span>
                    </label>
                  ))}
                </div>

                <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                  {selectedCategories.length} categoria(s) selecionada(s)
                </p>
              </div>

              {/* Botões de Ação Destrutiva */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={handleUpdateProductImages}
                  disabled={isProcessingTool || selectedCategories.length === 0}
                  className="p-4 bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-700 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-2">🤖📸</div>
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                    Atualizar Fotos (IA)
                  </h3>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    IA busca fotos adequadas para cada produto
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleZeroStock}
                  disabled={isProcessingTool || selectedCategories.length === 0}
                  className="p-4 bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-400 dark:border-orange-700 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-2">📦</div>
                  <h3 className="font-semibold text-orange-800 dark:text-orange-300 mb-1">
                    Zerar Estoque
                  </h3>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Define estoque = 0 para produtos selecionados
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleClearMovements}
                  disabled={isProcessingTool || selectedCategories.length === 0}
                  className="p-4 bg-red-100 dark:bg-red-900/30 border-2 border-red-400 dark:border-red-700 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-2">🗑️</div>
                  <h3 className="font-semibold text-red-800 dark:text-red-300 mb-1">
                    Limpar Movimentações
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Apaga TODO histórico de movimentações
                  </p>
                </button>

                <button
                  type="button"
                  onClick={handleDeleteProducts}
                  disabled={isProcessingTool || selectedCategories.length === 0}
                  className="p-4 bg-red-200 dark:bg-red-900/50 border-2 border-red-500 dark:border-red-600 rounded-lg hover:bg-red-300 dark:hover:bg-red-900/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-3xl mb-2">🚨</div>
                  <h3 className="font-semibold text-red-900 dark:text-red-200 mb-1">
                    Apagar Produtos
                  </h3>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Deleta permanentemente produtos e movimentações
                  </p>
                </button>
              </div>

              {isProcessingTool && (
                <div className="mt-4 flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Processando...</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal de Confirmação */}
        {confirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
                ⚠️ Confirmação Necessária
              </h3>
              <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-line">
                {confirmDialog.message}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmDialog(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDialog.onConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  Sim, Confirmo
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botões de Ação */}
        {isAdmin && (
          <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-lg flex justify-end gap-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSaving}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <CheckIcon className="w-5 h-5" />
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default CompanySettings;
