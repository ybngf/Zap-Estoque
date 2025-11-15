
import React, { useState } from 'react';
import { User, MovementType } from '../types';
import { parseInvoiceWithGemini } from '../services/geminiService';
import * as api from '../services/api';
import { DocumentArrowUpIcon, PlusIcon, XMarkIcon, CheckIcon, PencilIcon, TrashIcon } from './Icons';

interface ParsedItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
  suggestedCategory?: string;
  categoryId?: number;
  isEditing?: boolean;
}

interface InvoiceProcessorProps {
  currentUser: User;
}

const InvoiceProcessor: React.FC<InvoiceProcessorProps> = ({ currentUser }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAddingToStock, setIsAddingToStock] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState<number>(1);
  const [defaultSupplierId, setDefaultSupplierId] = useState<number>(1);
  const [minStockDefault, setMinStockDefault] = useState<number>(10);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<number>(1);

  // Load default settings on component mount
  React.useEffect(() => {
    const loadDefaults = async () => {
      try {
        const settings = await api.getSettings();
        if (settings.default_category_id?.value) {
          setDefaultCategoryId(parseInt(settings.default_category_id.value));
        }
        if (settings.default_supplier_id?.value) {
          const supplierId = parseInt(settings.default_supplier_id.value);
          setDefaultSupplierId(supplierId);
          setSelectedSupplierId(supplierId);
        }
        if (settings.min_stock_default?.value) {
          setMinStockDefault(parseInt(settings.min_stock_default.value));
        }
      } catch (error) {
        console.warn('Could not load default settings:', error);
      }
    };
    
    const loadSuppliersAndCategories = async () => {
      try {
        const [suppliersData, categoriesData] = await Promise.all([
          api.getSuppliers(),
          api.getCategories()
        ]);
        setSuppliers(suppliersData);
        setCategories(categoriesData);
      } catch (error) {
        console.warn('Could not load suppliers and categories:', error);
      }
    };
    
    loadDefaults();
    loadSuppliersAndCategories();
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setParsedItems([]);
    }
  };
  
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setParsedItems([]);
    setError(null);
    setSuccessMessage(null);
  };

  const handleEditItem = (index: number) => {
    const newItems = [...parsedItems];
    newItems[index].isEditing = true;
    setParsedItems(newItems);
  };

  const handleSaveItem = (index: number) => {
    const newItems = [...parsedItems];
    newItems[index].isEditing = false;
    setParsedItems(newItems);
  };

  const handleDeleteItem = (index: number) => {
    setParsedItems(parsedItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof ParsedItem, value: string | number) => {
    const newItems = [...parsedItems];
    if (field === 'quantity' || field === 'unitPrice' || field === 'categoryId') {
      newItems[index][field] = Number(value);
    } else if (field === 'productName' || field === 'imageUrl' || field === 'suggestedCategory') {
      newItems[index][field] = String(value);
    }
    setParsedItems(newItems);
  };

  const handleProcessInvoice = async () => {
    if (!selectedFile) {
      setError("Por favor, selecione um arquivo de nota fiscal.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessMessage(null);
    setParsedItems([]);

    try {
      const items = await parseInvoiceWithGemini(selectedFile);
      if (items.length === 0) {
        setError("Nenhum item foi encontrado na nota fiscal. Tente uma imagem mais nítida.");
      }
      
      // Map suggested categories to existing category IDs
      const itemsWithCategories = items.map((item: any) => {
        let categoryId = defaultCategoryId;
        
        // Try to find matching category by name (case-insensitive, partial match)
        if (item.suggestedCategory && categories.length > 0) {
          const suggested = item.suggestedCategory.toLowerCase();
          const matchingCategory = categories.find(cat => 
            cat.name.toLowerCase().includes(suggested) || 
            suggested.includes(cat.name.toLowerCase())
          );
          
          if (matchingCategory) {
            categoryId = matchingCategory.id;
          }
        }
        
        return {
          ...item,
          categoryId,
          isEditing: false
        };
      });
      
      setParsedItems(itemsWithCategories);
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar a nota.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAndAddToStock = async () => {
    if (parsedItems.length === 0) {
      setError("Nenhum item para adicionar ao estoque.");
      return;
    }

    setIsAddingToStock(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const item of parsedItems) {
        try {
          // Buscar produtos existentes para verificar se já existe
          const existingProducts = await api.getProducts();
          const existingProduct = existingProducts.find(
            p => p.name.toLowerCase() === item.productName.toLowerCase()
          );

          let productId: number;

          if (existingProduct) {
            // Produto já existe, usar o ID dele
            productId = existingProduct.id;
          } else {
            // Criar novo produto com fornecedor selecionado e categoria da IA
            const newProduct = await api.createProduct({
              name: item.productName,
              sku: `AUTO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              categoryId: item.categoryId || defaultCategoryId,
              supplierId: selectedSupplierId,
              price: item.unitPrice,
              stock: 0,
              minStock: minStockDefault,
              imageUrl: item.imageUrl || '',
            });
            productId = newProduct.id;
          }

          // Criar movimentação de entrada no estoque
          await api.createStockMovement({
            productId,
            type: MovementType.In,
            quantity: item.quantity,
            userId: currentUser.id,
            reason: `Entrada via nota fiscal - ${item.quantity} un. @ R$ ${item.unitPrice.toFixed(2)}`,
          });

          results.success++;
        } catch (err: any) {
          results.failed++;
          results.errors.push(`${item.productName}: ${err.message}`);
        }
      }

      if (results.success > 0) {
        setSuccessMessage(
          `✅ ${results.success} ${results.success === 1 ? 'item adicionado' : 'itens adicionados'} ao estoque com sucesso!`
        );
        setParsedItems([]);
        setSelectedFile(null);
        setPreviewUrl(null);
      }

      if (results.failed > 0) {
        setError(`⚠️ ${results.failed} ${results.failed === 1 ? 'item falhou' : 'itens falharam'}: ${results.errors.join(', ')}`);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao adicionar itens ao estoque.");
    } finally {
      setIsAddingToStock(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Processador de Notas Fiscais com IA</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Faça o upload da imagem de uma nota fiscal para adicionar os itens ao estoque automaticamente.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        <div className="space-y-4">
          {!selectedFile ? (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <DocumentArrowUpIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" />
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">Clique para fazer upload</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">PNG, JPG, ou WEBP</span>
              <input type="file" className="hidden" accept="image/png, image/jpeg, image/webp" onChange={handleFileChange} />
            </label>
          ) : (
            <div className="relative">
              <img src={previewUrl!} alt="Pré-visualização da nota" className="w-full h-auto max-h-80 object-contain rounded-lg shadow-md" />
              <button onClick={handleClear} className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70">
                <XMarkIcon className="w-5 h-5"/>
              </button>
            </div>
          )}

          {/* Seletor de Fornecedor */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Fornecedor dos Produtos
            </label>
            <select
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Selecione o fornecedor que emitiu esta nota fiscal
            </p>
          </div>

          <button
            onClick={handleProcessInvoice}
            disabled={!selectedFile || isProcessing}
            className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processando...
              </>
            ) : 'Analisar Nota Fiscal'}
          </button>
           {error && <p className="text-sm text-red-500 text-center">{error}</p>}
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Itens Extraídos</h3>
            {parsedItems.length > 0 && (
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {parsedItems.length} {parsedItems.length === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>

          {successMessage && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</p>
            </div>
          )}

          {parsedItems.length > 0 ? (
            <>
              <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                {parsedItems.map((item, index) => (
                  <div key={index} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
                    {item.isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => handleUpdateItem(index, 'productName', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                          placeholder="Nome do produto"
                        />
                        <input
                          type="text"
                          value={item.imageUrl || ''}
                          onChange={(e) => handleUpdateItem(index, 'imageUrl', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                          placeholder="URL da imagem (opcional)"
                        />
                        <select
                          value={item.categoryId || defaultCategoryId}
                          onChange={(e) => handleUpdateItem(index, 'categoryId', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        >
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                            placeholder="Quantidade"
                            min="1"
                            step="1"
                          />
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(index, 'unitPrice', e.target.value)}
                            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                            placeholder="Preço unitário"
                            min="0"
                            step="0.01"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleSaveItem(index)}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center gap-1 text-sm"
                          >
                            <CheckIcon className="w-4 h-4" />
                            Salvar
                          </button>
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 text-sm"
                          >
                            <TrashIcon className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start gap-4">
                        {item.imageUrl && (
                          <div className="flex-shrink-0">
                            <img 
                              src={item.imageUrl} 
                              alt={item.productName}
                              className="w-16 h-16 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                              onError={(e) => {
                                // Fallback se a imagem não carregar
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 dark:text-gray-200">{item.productName}</p>
                          {item.suggestedCategory && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                              🏷️ Categoria sugerida: {item.suggestedCategory}
                              {item.categoryId && categories.find(c => c.id === item.categoryId) && (
                                <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                                  → {categories.find(c => c.id === item.categoryId)?.name}
                                </span>
                              )}
                            </p>
                          )}
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Quantidade: {item.quantity} un. | Preço: R$ {item.unitPrice.toFixed(2)}
                          </p>
                          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                            Total: R$ {(item.quantity * item.unitPrice).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItem(index)}
                            className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Editar"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(index)}
                            className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            title="Remover"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                    💰 Total da Nota: R$ {parsedItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={handleConfirmAndAddToStock}
                  disabled={isAddingToStock}
                  className="w-full py-3 px-4 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isAddingToStock ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Adicionando ao estoque...
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-5 h-5" />
                      Confirmar e Adicionar ao Estoque
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-center px-4">
              <p className="text-gray-500 dark:text-gray-400">Os itens da nota fiscal aparecerão aqui após a análise.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceProcessor;
