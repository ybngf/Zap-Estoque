import React, { useState, useEffect } from 'react';
import { User, SettingsResponse, SystemSettings } from '../types';
import * as api from '../services/api';
import { CheckIcon, XMarkIcon } from './Icons';

interface SettingsProps {
  currentUser: User;
}

const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getSettings();
      setSettings(data);
      
      // Convert to form data
      const form: Partial<SystemSettings> = {};
      Object.keys(data).forEach(key => {
        form[key as keyof SystemSettings] = data[key as keyof SettingsResponse].value;
      });
      setFormData(form);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar configurações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: keyof SystemSettings, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      const result = await api.updateSettings(formData);
      
      if (result.success) {
        setSuccessMessage(`✅ ${result.updated} configurações atualizadas com sucesso!`);
        await loadSettings();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }

      if (result.errors.length > 0) {
        setError(`⚠️ Alguns erros ocorreram: ${result.errors.join(', ')}`);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      const form: Partial<SystemSettings> = {};
      Object.keys(settings).forEach(key => {
        form[key as keyof SystemSettings] = settings[key as keyof SettingsResponse].value;
      });
      setFormData(form);
      setSuccessMessage(null);
      setError(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="animate-spin h-8 w-8 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">⚙️ Configurações do Sistema</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Apenas Super Admin pode gerenciar estas configurações
          </p>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
          <p className="text-emerald-700 dark:text-emerald-300">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aparência do Sistema */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            🎨 Aparência do Sistema
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nome do Sistema
              </label>
              <input
                type="text"
                value={formData.system_name || ''}
                onChange={(e) => handleChange('system_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                placeholder="Ex: Estoque Gemini"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings?.system_name?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                URL da Logomarca
              </label>
              <input
                type="text"
                value={formData.system_logo_url || ''}
                onChange={(e) => handleChange('system_logo_url', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                placeholder="https://exemplo.com/logo.png"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings?.system_logo_url?.description}
              </p>
              {formData.system_logo_url && (
                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Preview:</p>
                  <img 
                    src={formData.system_logo_url} 
                    alt="Logo preview" 
                    className="h-12 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Integrações */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            🔌 Integrações
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Google Gemini API Key
              </label>
              <input
                type="password"
                value={formData.gemini_api_key || ''}
                onChange={(e) => handleChange('gemini_api_key', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-mono text-sm"
                placeholder="AIza..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings?.gemini_api_key?.description}
              </p>
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-block"
              >
                🔗 Obter chave de API
              </a>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <input
                type="checkbox"
                id="enable_invoice"
                checked={formData.enable_invoice_processing === '1'}
                onChange={(e) => handleChange('enable_invoice_processing', e.target.checked ? '1' : '0')}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="enable_invoice" className="text-sm text-gray-700 dark:text-gray-300">
                Habilitar processamento de notas fiscais
              </label>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <input
                type="checkbox"
                id="enable_log"
                checked={formData.enable_activity_log === '1'}
                onChange={(e) => handleChange('enable_activity_log', e.target.checked ? '1' : '0')}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <label htmlFor="enable_log" className="text-sm text-gray-700 dark:text-gray-300">
                Habilitar log de atividades
              </label>
            </div>
          </div>
        </div>

        {/* Padrões de Produtos */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            📦 Padrões de Produtos
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Categoria Padrão (ID)
              </label>
              <input
                type="number"
                value={formData.default_category_id || ''}
                onChange={(e) => handleChange('default_category_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                min="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings?.default_category_id?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fornecedor Padrão (ID)
              </label>
              <input
                type="number"
                value={formData.default_supplier_id || ''}
                onChange={(e) => handleChange('default_supplier_id', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                min="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings?.default_supplier_id?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Estoque Mínimo Padrão
              </label>
              <input
                type="number"
                value={formData.min_stock_default || ''}
                onChange={(e) => handleChange('min_stock_default', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                min="0"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings?.min_stock_default?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Formatação e Localização */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            🌍 Formatação e Localização
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Símbolo da Moeda
              </label>
              <input
                type="text"
                value={formData.currency_symbol || ''}
                onChange={(e) => handleChange('currency_symbol', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                placeholder="R$"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings?.currency_symbol?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Locale de Formatação
              </label>
              <input
                type="text"
                value={formData.currency_locale || ''}
                onChange={(e) => handleChange('currency_locale', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                placeholder="pt-BR"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings?.currency_locale?.description}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Itens por Página
              </label>
              <input
                type="number"
                value={formData.items_per_page || ''}
                onChange={(e) => handleChange('items_per_page', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                min="10"
                step="10"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings?.items_per_page?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Segurança */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            🔒 Segurança
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Timeout de Sessão (minutos)
              </label>
              <input
                type="number"
                value={formData.session_timeout_minutes || ''}
                onChange={(e) => handleChange('session_timeout_minutes', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                min="30"
                step="30"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {settings?.session_timeout_minutes?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Informações da Empresa */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            🏢 Informações da Empresa
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Website
              </label>
              <input
                type="url"
                value={formData.company_website || ''}
                onChange={(e) => handleChange('company_website', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                placeholder="https://exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email de Contato
              </label>
              <input
                type="email"
                value={formData.company_email || ''}
                onChange={(e) => handleChange('company_email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                placeholder="contato@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Telefone
              </label>
              <input
                type="tel"
                value={formData.company_phone || ''}
                onChange={(e) => handleChange('company_phone', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                placeholder="(00) 0000-0000"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end sticky bottom-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <button
          onClick={handleReset}
          disabled={isSaving}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <XMarkIcon className="w-5 h-5" />
          Cancelar Alterações
        </button>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    </div>
  );
};

export default Settings;
