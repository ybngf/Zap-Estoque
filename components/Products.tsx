import React, { useState, useEffect } from 'react';
import { Product, User, Category, Supplier, MovementType, Role, Company } from '../types';
import * as api from '../services/api';
import { PencilIcon, TrashIcon, PlusIcon } from './Icons';
import CSVImporter from './CSVImporter';

interface ProductsProps {
  currentUser: User;
}

const Products: React.FC<ProductsProps> = ({ currentUser }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const isSuperAdmin = currentUser.role === Role.SuperAdmin;
  
  // Filtros avançados
  const [filterCategory, setFilterCategory] = useState<number | ''>('');
  const [filterSupplier, setFilterSupplier] = useState<number | ''>('');
  const [filterStockLevel, setFilterStockLevel] = useState<'all' | 'low' | 'ok' | 'high'>('all');
  const [filterCompany, setFilterCompany] = useState<number | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Estado do modal de impressão
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    format: 'list' as 'list' | 'compact',
    compactColumns: 4 as 1 | 2 | 3 | 4 | 5 | 6,
    groupByCategory: false,
    columns: {
      number: true,
      name: true,
      sku: true,
      category: true,
      supplier: false,
      price: true,
      stock: true,
      minStock: true
    },
    filterByCategories: [] as number[],
    filterBySuppliers: [] as number[]
  });

  const initialProductState: Omit<Product, 'id'> = {
    name: '',
    sku: '',
    categoryId: 0,
    supplierId: 0,
    price: 0,
    stock: 0,
    minStock: 0,
    imageUrl: '',
  };

  const [productForm, setProductForm] = useState<Omit<Product, 'id'>>(initialProductState);

  const handleOpenPrintModal = () => {
    setShowPrintModal(true);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Aplicar filtros de categoria e fornecedor da configuração de impressão
    let printProducts = filteredProducts;
    
    if (printConfig.filterByCategories.length > 0) {
      printProducts = printProducts.filter(p => 
        printConfig.filterByCategories.includes(p.categoryId)
      );
    }
    
    if (printConfig.filterBySuppliers.length > 0) {
      printProducts = printProducts.filter(p => 
        printConfig.filterBySuppliers.includes(p.supplierId)
      );
    }

    // Ordenar alfabeticamente por nome do produto
    printProducts = [...printProducts].sort((a, b) => 
      a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
    );

    // Agrupar por categoria se a opção estiver ativada
    const groupedByCategory: { [categoryId: number]: Product[] } = {};
    if (printConfig.groupByCategory) {
      printProducts.forEach(product => {
        if (!groupedByCategory[product.categoryId]) {
          groupedByCategory[product.categoryId] = [];
        }
        groupedByCategory[product.categoryId].push(product);
      });
      
      // Ordenar alfabeticamente os produtos dentro de cada categoria
      Object.keys(groupedByCategory).forEach(categoryId => {
        groupedByCategory[Number(categoryId)] = groupedByCategory[Number(categoryId)].sort((a, b) =>
          a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
        );
      });
    }

    const isCompactFormat = printConfig.format === 'compact';
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Lista de Produtos - EstoqueVS</title>
          <style>
            @media print {
              @page { 
                margin: ${isCompactFormat ? '0.5cm' : '1.5cm'}; 
                size: A4 portrait;
              }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              padding: ${isCompactFormat ? '10px' : '20px'};
              color: #333;
              font-size: ${isCompactFormat ? '10px' : '12px'};
            }
            .header {
              text-align: center;
              margin-bottom: ${isCompactFormat ? '15px' : '30px'};
              border-bottom: ${isCompactFormat ? '2px' : '3px'} solid #10b981;
              padding-bottom: ${isCompactFormat ? '10px' : '20px'};
            }
            .header h1 {
              color: #10b981;
              font-size: ${isCompactFormat ? '20px' : '32px'};
              margin-bottom: 5px;
            }
            .header p {
              color: #666;
              font-size: ${isCompactFormat ? '10px' : '14px'};
            }
            .info {
              display: flex;
              justify-between;
              margin-bottom: ${isCompactFormat ? '10px' : '20px'};
              font-size: ${isCompactFormat ? '9px' : '12px'};
              color: #666;
            }
            
            .category-header {
              background: linear-gradient(135deg, #10b981 0%, #059669 100%);
              color: white;
              padding: ${isCompactFormat ? '8px 12px' : '12px 16px'};
              margin-top: ${isCompactFormat ? '15px' : '25px'};
              margin-bottom: ${isCompactFormat ? '8px' : '12px'};
              border-radius: 6px;
              font-weight: 600;
              font-size: ${isCompactFormat ? '11px' : '14px'};
              display: flex;
              align-items: center;
              gap: 8px;
              page-break-after: avoid;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .category-header:first-of-type {
              margin-top: ${isCompactFormat ? '5px' : '10px'};
            }
            .category-count {
              background: rgba(255, 255, 255, 0.2);
              padding: 2px 8px;
              border-radius: 12px;
              font-size: ${isCompactFormat ? '9px' : '11px'};
              margin-left: auto;
            }
            
            ${isCompactFormat ? `
              /* Formato Compacto - Lista de Compras */
              .compact-grid {
                display: grid;
                grid-template-columns: repeat(${printConfig.compactColumns}, 1fr);
                gap: 8px;
                margin-top: 10px;
              }
              .compact-item {
                border: 1px solid #ddd;
                padding: 6px 8px;
                display: flex;
                align-items: center;
                gap: 8px;
                background: white;
                page-break-inside: avoid;
              }
              .checkbox {
                width: 16px;
                height: 16px;
                border: 2px solid #333;
                flex-shrink: 0;
                border-radius: 3px;
              }
              .item-content {
                flex: 1;
                min-width: 0;
              }
              .item-name {
                font-weight: 600;
                font-size: 10px;
                margin-bottom: 2px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .item-details {
                font-size: 8px;
                color: #666;
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
              }
              .item-details span {
                white-space: nowrap;
              }
            ` : `
              /* Formato Lista - Tabela Tradicional */
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th {
                background-color: #f3f4f6;
                color: #374151;
                padding: 10px 6px;
                text-align: left;
                font-weight: 600;
                font-size: 11px;
                border: 1px solid #e5e7eb;
              }
              td {
                padding: 8px 6px;
                border: 1px solid #e5e7eb;
                font-size: 10px;
              }
              tr:nth-child(even) {
                background-color: #f9fafb;
              }
              .price {
                text-align: right;
                font-weight: 600;
                color: #059669;
              }
              .stock {
                text-align: center;
              }
              .low-stock {
                color: #dc2626;
                font-weight: 600;
              }
            `}
            
            .footer {
              margin-top: ${isCompactFormat ? '20px' : '40px'};
              text-align: center;
              font-size: ${isCompactFormat ? '8px' : '11px'};
              color: #999;
              border-top: 1px solid #e5e7eb;
              padding-top: ${isCompactFormat ? '10px' : '15px'};
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>📦 EstoqueVS</h1>
            <p>${isCompactFormat ? 'Lista de Compras' : 'Relatório de Produtos'}</p>
          </div>
          
          <div class="info">
            <div>
              <strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR', { 
                day: '2-digit', 
                month: 'long', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            <div>
              <strong>Total:</strong> ${printProducts.length} ${printProducts.length === 1 ? 'produto' : 'produtos'}
            </div>
          </div>
          
          ${isCompactFormat ? `
            <!-- Formato Compacto -->
            ${printConfig.groupByCategory ? 
              Object.entries(groupedByCategory)
                .sort(([aId], [bId]) => {
                  const catA = categories.find(c => c.id === Number(aId));
                  const catB = categories.find(c => c.id === Number(bId));
                  return (catA?.name || '').localeCompare(catB?.name || '');
                })
                .map(([categoryId, products]) => {
                  const category = categories.find(c => c.id === Number(categoryId));
                  return `
                    <div class="category-header">
                      <span>📁 ${category?.name || 'Sem Categoria'}</span>
                      <span class="category-count">${products.length} ${products.length === 1 ? 'item' : 'itens'}</span>
                    </div>
                    <div class="compact-grid">
                      ${products.map((product) => {
                        const supplier = suppliers.find(s => s.id === product.supplierId);
                        const isLowStock = product.stock < product.minStock;
                        
                        let details = [];
                        if (printConfig.columns.sku) details.push(`SKU: ${product.sku}`);
                        if (printConfig.columns.category) details.push(`${category?.name || 'N/A'}`);
                        if (printConfig.columns.supplier) details.push(`${supplier?.name || 'N/A'}`);
                        if (printConfig.columns.price) details.push(`R$ ${product.price.toFixed(2).replace('.', ',')}`);
                        if (printConfig.columns.stock) details.push(`Estq: ${product.stock}${isLowStock ? ' ⚠️' : ''}`);
                        
                        return `
                          <div class="compact-item">
                            <div class="checkbox"></div>
                            <div class="item-content">
                              <div class="item-name">${product.name}</div>
                              <div class="item-details">
                                ${details.map(d => `<span>${d}</span>`).join('')}
                              </div>
                            </div>
                          </div>
                        `;
                      }).join('')}
                    </div>
                  `;
                }).join('')
            : `
              <div class="compact-grid">
                ${printProducts.map((product) => {
                  const category = categories.find(c => c.id === product.categoryId);
                  const supplier = suppliers.find(s => s.id === product.supplierId);
                  const isLowStock = product.stock < product.minStock;
                  
                  let details = [];
                  if (printConfig.columns.sku) details.push(`SKU: ${product.sku}`);
                  if (printConfig.columns.category) details.push(`${category?.name || 'N/A'}`);
                  if (printConfig.columns.supplier) details.push(`${supplier?.name || 'N/A'}`);
                  if (printConfig.columns.price) details.push(`R$ ${product.price.toFixed(2).replace('.', ',')}`);
                  if (printConfig.columns.stock) details.push(`Estq: ${product.stock}${isLowStock ? ' ⚠️' : ''}`);
                  
                  return `
                    <div class="compact-item">
                      <div class="checkbox"></div>
                      <div class="item-content">
                        <div class="item-name">${product.name}</div>
                        <div class="item-details">
                          ${details.map(d => `<span>${d}</span>`).join('')}
                        </div>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            `}
          ` : `
            <!-- Formato Lista -->
            ${printConfig.groupByCategory ?
              Object.entries(groupedByCategory)
                .sort(([aId], [bId]) => {
                  const catA = categories.find(c => c.id === Number(aId));
                  const catB = categories.find(c => c.id === Number(bId));
                  return (catA?.name || '').localeCompare(catB?.name || '');
                })
                .map(([categoryId, products]) => {
                  const category = categories.find(c => c.id === Number(categoryId));
                  let itemCounter = 0;
                  return `
                    <div class="category-header">
                      <span>📁 ${category?.name || 'Sem Categoria'}</span>
                      <span class="category-count">${products.length} ${products.length === 1 ? 'item' : 'itens'}</span>
                    </div>
                    <table>
                      <thead>
                        <tr>
                          ${printConfig.columns.number ? '<th style="width: 4%">#</th>' : ''}
                          ${printConfig.columns.name ? '<th style="width: 30%">Produto</th>' : ''}
                          ${printConfig.columns.sku ? '<th style="width: 12%">SKU</th>' : ''}
                          ${printConfig.columns.category ? '<th style="width: 15%">Categoria</th>' : ''}
                          ${printConfig.columns.supplier ? '<th style="width: 15%">Fornecedor</th>' : ''}
                          ${printConfig.columns.price ? '<th style="width: 10%">Preço</th>' : ''}
                          ${printConfig.columns.stock ? '<th style="width: 8%">Estoque</th>' : ''}
                          ${printConfig.columns.minStock ? '<th style="width: 6%">Mín.</th>' : ''}
                        </tr>
                      </thead>
                      <tbody>
                        ${products.map((product, index) => {
                          const supplier = suppliers.find(s => s.id === product.supplierId);
                          const isLowStock = product.stock < product.minStock;
                          itemCounter++;
                          return `
                            <tr>
                              ${printConfig.columns.number ? `<td>${itemCounter}</td>` : ''}
                              ${printConfig.columns.name ? `<td><strong>${product.name}</strong></td>` : ''}
                              ${printConfig.columns.sku ? `<td>${product.sku}</td>` : ''}
                              ${printConfig.columns.category ? `<td>${category?.name || 'N/A'}</td>` : ''}
                              ${printConfig.columns.supplier ? `<td>${supplier?.name || 'N/A'}</td>` : ''}
                              ${printConfig.columns.price ? `<td class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</td>` : ''}
                              ${printConfig.columns.stock ? `<td class="stock ${isLowStock ? 'low-stock' : ''}">${product.stock}</td>` : ''}
                              ${printConfig.columns.minStock ? `<td class="stock">${product.minStock}</td>` : ''}
                            </tr>
                          `;
                        }).join('')}
                      </tbody>
                    </table>
                  `;
                }).join('')
            : `
              <table>
                <thead>
                  <tr>
                    ${printConfig.columns.number ? '<th style="width: 4%">#</th>' : ''}
                    ${printConfig.columns.name ? '<th style="width: 30%">Produto</th>' : ''}
                    ${printConfig.columns.sku ? '<th style="width: 12%">SKU</th>' : ''}
                    ${printConfig.columns.category ? '<th style="width: 15%">Categoria</th>' : ''}
                    ${printConfig.columns.supplier ? '<th style="width: 15%">Fornecedor</th>' : ''}
                    ${printConfig.columns.price ? '<th style="width: 10%">Preço</th>' : ''}
                    ${printConfig.columns.stock ? '<th style="width: 8%">Estoque</th>' : ''}
                    ${printConfig.columns.minStock ? '<th style="width: 6%">Mín.</th>' : ''}
                  </tr>
                </thead>
                <tbody>
                  ${printProducts.map((product, index) => {
                    const category = categories.find(c => c.id === product.categoryId);
                    const supplier = suppliers.find(s => s.id === product.supplierId);
                    const isLowStock = product.stock < product.minStock;
                    return `
                      <tr>
                        ${printConfig.columns.number ? `<td>${index + 1}</td>` : ''}
                        ${printConfig.columns.name ? `<td><strong>${product.name}</strong></td>` : ''}
                        ${printConfig.columns.sku ? `<td>${product.sku}</td>` : ''}
                        ${printConfig.columns.category ? `<td>${category?.name || 'N/A'}</td>` : ''}
                        ${printConfig.columns.supplier ? `<td>${supplier?.name || 'N/A'}</td>` : ''}
                        ${printConfig.columns.price ? `<td class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</td>` : ''}
                        ${printConfig.columns.stock ? `<td class="stock ${isLowStock ? 'low-stock' : ''}">${product.stock}</td>` : ''}
                        ${printConfig.columns.minStock ? `<td class="stock">${product.minStock}</td>` : ''}
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            `}
          `}
          
          <div class="footer">
            Relatório gerado por EstoqueVS - Sistema de Gerenciamento de Estoque
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    setShowPrintModal(false);
  };

  const handleImportProducts = async (data: any[], options: {importIds: boolean, replaceExisting: boolean}) => {
    try {
      const mappedProducts = data.map(row => ({
        ...(options.importIds && row.id ? { id: parseInt(row.id) } : {}),
        name: row.name || row.produto || row.nome,
        sku: row.sku || row.codigo || '',
        categoryId: parseInt(row.categoryId || row.categoria || categories[0]?.id || '0'),
        supplierId: parseInt(row.supplierId || row.fornecedor || suppliers[0]?.id || '0'),
        price: parseFloat((row.price || row.preco || '0').toString().replace(',', '.')),
        stock: parseInt(row.stock || row.estoque || '0'),
        minStock: parseInt(row.minStock || row.estoqueMinimo || row.minimo || '10'),
      }));

      const result = await api.importProducts(mappedProducts, options);
      
      let message = `✓ Importação concluída com sucesso!\n`;
      message += `${result.imported} produtos criados`;
      if (result.updated && result.updated > 0) {
        message += `\n${result.updated} produtos atualizados`;
      }
      
      if (result.errors && result.errors.length > 0) {
        message += `\n\n⚠️ Avisos:\n${result.errors.join('\n')}`;
      }
      
      alert(message);
      
      // Recarregar produtos
      const updatedProducts = await api.getProducts();
      setProducts(updatedProducts);
    } catch (error) {
      throw new Error('Erro ao importar produtos: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const productsData = await api.getProducts();
        const categoriesData = await api.getCategories();
        const suppliersData = await api.getSuppliers();
        
        console.log('Products:', productsData);
        console.log('Categories:', categoriesData);
        console.log('Suppliers:', suppliersData);
        
        setProducts(productsData || []);
        setCategories(categoriesData || []);
        setSuppliers(suppliersData || []);
        
        // Se for Super Admin, carregar empresas também
        if (isSuperAdmin) {
          const companiesData = await api.getCompanies();
          setCompanies(companiesData || []);
        }
        
        if (categoriesData && categoriesData.length > 0 && suppliersData && suppliersData.length > 0) {
          setProductForm(prev => ({
            ...prev,
            categoryId: categoriesData[0].id,
            supplierId: suppliersData[0].id,
          }));
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isSuperAdmin]);

  useEffect(() => {
    if (editingProduct) {
      setProductForm(editingProduct);
    } else {
      setProductForm({
        ...initialProductState,
        categoryId: categories[0]?.id || 0,
        supplierId: suppliers[0]?.id || 0,
      });
    }
  }, [editingProduct, categories, suppliers]);

  const filteredProducts = products.filter(p => {
    // Filtro por nome/SKU
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por categoria
    const matchesCategory = filterCategory === '' || p.categoryId === filterCategory;
    
    // Filtro por fornecedor
    const matchesSupplier = filterSupplier === '' || p.supplierId === filterSupplier;
    
    // Filtro por empresa (apenas para Super Admin)
    const matchesCompany = !isSuperAdmin || filterCompany === 'all' || p.companyId === filterCompany;
    
    // Filtro por nível de estoque
    let matchesStockLevel = true;
    if (filterStockLevel === 'low') {
      matchesStockLevel = p.stock <= p.minStock;
    } else if (filterStockLevel === 'ok') {
      matchesStockLevel = p.stock > p.minStock && p.stock <= p.minStock * 2;
    } else if (filterStockLevel === 'high') {
      matchesStockLevel = p.stock > p.minStock * 2;
    }
    
    return matchesSearch && matchesCategory && matchesSupplier && matchesStockLevel && matchesCompany;
  }).sort((a, b) => 
    // Ordenar alfabeticamente por nome
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );

  const clearFilters = () => {
    setSearchTerm('');
    setFilterCategory('');
    setFilterSupplier('');
    setFilterCompany('all');
    setFilterStockLevel('all');
  };

  const activeFiltersCount = 
    (searchTerm ? 1 : 0) + 
    (filterCategory !== '' ? 1 : 0) + 
    (filterSupplier !== '' ? 1 : 0) + 
    (filterStockLevel !== 'all' ? 1 : 0);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };
  
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numericFields = ['price', 'stock', 'minStock', 'categoryId', 'supplierId'];
    setProductForm(prev => ({ 
      ...prev, 
      [name]: numericFields.includes(name) ? Number(value) : value 
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProduct) {
      const updatedProduct = await api.updateProduct(editingProduct.id, productForm);
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === editingProduct.id ? updatedProduct : p
        )
      );
    } else {
      const newProduct = await api.createProduct(productForm);
      setProducts(prev => [newProduct, ...prev]);
    }
    handleCloseModal();
  };
  
  const handleDelete = async (productId: number) => {
      if(window.confirm("Tem certeza que deseja excluir este produto?")) {
        await api.deleteProduct(productId);
        setProducts(products.filter(p => p.id !== productId));
      }
  }

  const handleStockChange = async (product: Product, change: number) => {
    const newStock = product.stock + change;
    
    // Não permitir estoque negativo
    if (newStock < 0) {
      alert('O estoque não pode ser negativo!');
      return;
    }

    try {
      // 1. Atualizar o estoque do produto
      const updatedProduct = await api.updateProduct(product.id, { stock: newStock });
      
      // 2. Registrar a movimentação
      await api.createStockMovement({
        productId: product.id,
        userId: currentUser.id,
        type: change > 0 ? MovementType.In : MovementType.Out,
        quantity: Math.abs(change),
        reason: change > 0 ? 'Ajuste manual - Entrada' : 'Ajuste manual - Saída',
      });

      // 3. Atualizar a lista de produtos
      setProducts(prevProducts =>
        prevProducts.map(p =>
          p.id === product.id ? updatedProduct : p
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      alert('Erro ao atualizar o estoque. Tente novamente.');
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Produtos</h2>
          
          {/* Barra de busca e ações - Responsiva */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            
            {/* Botões - Stack em mobile, inline em desktop */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center px-3 sm:px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  activeFiltersCount > 0 
                    ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                title="Mostrar/ocultar filtros"
              >
                🔍 <span className="hidden sm:inline ml-1">Filtros</span> {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>
              
              <button 
                onClick={handleOpenPrintModal}
                className="flex items-center justify-center bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors text-sm"
                title="Configurar e imprimir lista de produtos"
              >
                🖨️ <span className="hidden sm:inline ml-1">Imprimir</span>
              </button>
              
              <div className="hidden sm:block">
                <CSVImporter
                  onImport={handleImportProducts}
                  userRole={currentUser.role}
                  fieldMappings={{
                    id: 'ID (opcional)',
                    name: 'Nome do Produto',
                    sku: 'SKU/Código',
                    categoryId: 'ID da Categoria',
                    supplierId: 'ID do Fornecedor',
                    price: 'Preço',
                    stock: 'Estoque Atual',
                    minStock: 'Estoque Mínimo'
                  }}
                  sampleData="id,name,sku,categoryId,supplierId,price,stock,minStock
1,Notebook Dell Inspiron,NB-DELL-001,1,1,2500.00,15,5
2,Mouse Logitech MX,MS-LOG-001,1,1,120.50,50,10"
                />
              </div>
              
              <button 
                onClick={handleOpenCreateModal}
                className="flex items-center justify-center bg-emerald-500 text-white px-3 sm:px-4 py-2 rounded-lg font-semibold hover:bg-emerald-600 transition-colors text-sm"
              >
                <PlusIcon className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
                <span className="hidden sm:inline">Novo Produto</span>
                <span className="sm:hidden">Novo</span>
              </button>
            </div>
          </div>
        </div>

        {/* Painel de Filtros Avançados */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300">🔍 Filtros Avançados</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                ✕ Limpar Filtros
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Filtro por Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📂 Categoria
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Fornecedor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🏢 Fornecedor
                </label>
                <select
                  value={filterSupplier}
                  onChange={(e) => setFilterSupplier(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Todos os fornecedores</option>
                  {suppliers.map(sup => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Nível de Estoque */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  📊 Nível de Estoque
                </label>
                <select
                  value={filterStockLevel}
                  onChange={(e) => setFilterStockLevel(e.target.value as 'all' | 'low' | 'ok' | 'high')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">Todos os níveis</option>
                  <option value="low">🔴 Estoque Baixo (≤ mínimo)</option>
                  <option value="ok">🟡 Estoque Normal (mínimo a 2x)</option>
                  <option value="high">🟢 Estoque Alto (&gt; 2x mínimo)</option>
                </select>
              </div>

              {/* Filtro por Empresa (apenas para Super Admin) */}
              {isSuperAdmin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    🏭 Empresa
                  </label>
                  <select
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="all">Todas as empresas ({products.length})</option>
                    {companies.map(company => {
                      const count = products.filter(p => p.companyId === company.id).length;
                      return (
                        <option key={company.id} value={company.id}>
                          {company.name} ({count})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
            </div>

            {/* Resumo dos Filtros */}
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Mostrando:</span>
              <span className="bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 px-2 py-1 rounded">
                {filteredProducts.length} de {products.length} produtos
              </span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Erro:</strong> {error}
          </div>
        )}
        
        {/* Tabela Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
                <th className="py-3 px-4 font-medium"></th>
                <th className="py-3 px-4 font-medium">Produto</th>
                <th className="py-3 px-4 font-medium">SKU</th>
                <th className="py-3 px-4 font-medium">Categoria</th>
                {isSuperAdmin && <th className="py-3 px-4 font-medium">Empresa</th>}
                <th className="py-3 px-4 font-medium text-right">Preço</th>
                <th className="py-3 px-4 font-medium text-right">Estoque</th>
                <th className="py-3 px-4 font-medium text-center">Ajuste Rápido</th>
                <th className="py-3 px-4 font-medium text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                    <td colSpan={8} className="text-center py-8">
                        <div className="animate-pulse">Carregando produtos...</div>
                    </td>
                </tr>
              ) : filteredProducts.map(product => {
                  const category = categories.find(c => c.id === product.categoryId);
                  const isLowStock = product.stock < product.minStock;
                  return (
                      <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="py-3 px-4">
                              <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                          </td>
                          <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">{product.name}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{product.sku}</td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{category?.name}</td>
                          {isSuperAdmin && (
                            <td className="py-3 px-4">
                              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-xs font-medium">
                                {product.companyName || 'N/A'}
                              </span>
                            </td>
                          )}
                          <td className="py-3 px-4 text-right text-gray-600 dark:text-gray-400">R$ {product.price.toFixed(2)}</td>
                          <td className={`py-3 px-4 text-right font-bold ${isLowStock ? 'text-red-500' : 'text-green-500'}`}>
                              {product.stock}
                              {isLowStock && <span className="text-xs ml-1"> (Baixo!)</span>}
                          </td>
                          <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                  <button 
                                      onClick={() => handleStockChange(product, -1)}
                                      className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors"
                                      title="Diminuir estoque"
                                  >
                                      −
                                  </button>
                                  <button 
                                      onClick={() => handleStockChange(product, 1)}
                                      className="w-8 h-8 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
                                      title="Aumentar estoque"
                                  >
                                      +
                                  </button>
                              </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                              <button onClick={() => handleOpenEditModal(product)} className="p-2 text-gray-500 hover:text-blue-500 transition-colors">
                                  <PencilIcon className="w-5 h-5" />
                              </button>
                              <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                                  <TrashIcon className="w-5 h-5" />
                              </button>
                          </td>
                      </tr>
                  )
              })}
            </tbody>
          </table>
        </div>

        {/* Lista Mobile - Cards Compactos */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse">Carregando produtos...</div>
            </div>
          ) : filteredProducts.map(product => {
              const category = categories.find(c => c.id === product.categoryId);
              const isLowStock = product.stock < product.minStock;
              return (
                <div key={product.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-base">
                        {product.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        SKU: {product.sku} • {category?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {/* Estoque */}
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Estoque:</span>
                      <span className={`text-lg font-bold ${isLowStock ? 'text-red-500' : 'text-green-500'}`}>
                        {product.stock}
                        {isLowStock && <span className="text-xs ml-1">(Baixo!)</span>}
                      </span>
                    </div>
                    
                    {/* Ajuste Rápido */}
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleStockChange(product, -1)}
                        className="w-9 h-9 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg transition-colors text-lg"
                        title="Diminuir estoque"
                      >
                        −
                      </button>
                      <button 
                        onClick={() => handleStockChange(product, 1)}
                        className="w-9 h-9 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors text-lg"
                        title="Aumentar estoque"
                      >
                        +
                      </button>
                    </div>
                    
                    {/* Botão Editar */}
                    <button 
                      onClick={() => handleOpenEditModal(product)} 
                      className="w-9 h-9 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                      title="Editar produto"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
          })}
        </div>
      </div>

      {/* Modal de Configuração de Impressão */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200 flex items-center">
              🖨️ Configurar Impressão
            </h3>
            
            <div className="space-y-6">
              {/* Formato de Impressão */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  📄 Formato de Impressão
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setPrintConfig({...printConfig, format: 'list'})}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      printConfig.format === 'list'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300'
                    }`}
                  >
                    <div className="font-bold mb-2">📋 Lista Tradicional</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Tabela completa com todas as informações selecionadas
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPrintConfig({...printConfig, format: 'compact'})}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      printConfig.format === 'compact'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300'
                    }`}
                  >
                    <div className="font-bold mb-2">🛒 Lista de Compras</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Formato compacto com checkbox para marcar. Economiza papel!
                    </div>
                  </button>
                </div>
              </div>

              {/* Opção de Agrupar por Categoria */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-2 border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <label className="flex items-center space-x-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={printConfig.groupByCategory}
                    onChange={(e) => setPrintConfig({...printConfig, groupByCategory: e.target.checked})}
                    className="w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-2">
                      📁 Agrupar Produtos por Categoria
                    </div>
                    <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                      Separa os produtos em seções com cabeçalhos de categoria. Ideal para organização!
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                    printConfig.groupByCategory 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}>
                    {printConfig.groupByCategory ? 'ATIVADO' : 'DESATIVADO'}
                  </div>
                </label>
              </div>

              {/* Número de Colunas (Formato Compacto) */}
              {printConfig.format === 'compact' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    📐 Itens por Linha
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setPrintConfig({...printConfig, compactColumns: num as 1 | 2 | 3 | 4 | 5 | 6})}
                        className={`p-3 rounded-lg border-2 font-bold transition-all ${
                          printConfig.compactColumns === num
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                            : 'border-gray-300 dark:border-gray-600 hover:border-emerald-300'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {printConfig.compactColumns === 1 && '📱 Uma coluna - Ideal para celular/móvel'}
                    {printConfig.compactColumns === 2 && '📄 Duas colunas - Padrão recomendado'}
                    {printConfig.compactColumns === 3 && '📰 Três colunas - Compacto'}
                    {printConfig.compactColumns === 4 && '🗞️ Quatro colunas - Muito compacto'}
                    {printConfig.compactColumns === 5 && '📋 Cinco colunas - Ultra compacto'}
                    {printConfig.compactColumns === 6 && '📊 Seis colunas - Máxima economia'}
                  </p>
                </div>
              )}

              {/* Colunas a Imprimir */}
              {printConfig.format === 'list' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    📊 Colunas a Imprimir
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printConfig.columns.number}
                        onChange={(e) => setPrintConfig({
                          ...printConfig,
                          columns: {...printConfig.columns, number: e.target.checked}
                        })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm">#</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printConfig.columns.name}
                        onChange={(e) => setPrintConfig({
                          ...printConfig,
                          columns: {...printConfig.columns, name: e.target.checked}
                        })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm">Nome</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printConfig.columns.sku}
                        onChange={(e) => setPrintConfig({
                          ...printConfig,
                          columns: {...printConfig.columns, sku: e.target.checked}
                        })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm">SKU</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printConfig.columns.category}
                        onChange={(e) => setPrintConfig({
                          ...printConfig,
                          columns: {...printConfig.columns, category: e.target.checked}
                        })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm">Categoria</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printConfig.columns.supplier}
                        onChange={(e) => setPrintConfig({
                          ...printConfig,
                          columns: {...printConfig.columns, supplier: e.target.checked}
                        })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm">Fornecedor</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printConfig.columns.price}
                        onChange={(e) => setPrintConfig({
                          ...printConfig,
                          columns: {...printConfig.columns, price: e.target.checked}
                        })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm">Preço</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printConfig.columns.stock}
                        onChange={(e) => setPrintConfig({
                          ...printConfig,
                          columns: {...printConfig.columns, stock: e.target.checked}
                        })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm">Estoque</span>
                    </label>
                    
                    <label className="flex items-center space-x-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printConfig.columns.minStock}
                        onChange={(e) => setPrintConfig({
                          ...printConfig,
                          columns: {...printConfig.columns, minStock: e.target.checked}
                        })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm">Mín.</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Filtrar por Categorias */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  📂 Filtrar por Categorias (opcional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  {categories.map(cat => (
                    <label key={cat.id} className="flex items-center space-x-2 p-2 hover:bg-white dark:hover:bg-gray-600 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printConfig.filterByCategories.includes(cat.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPrintConfig({
                              ...printConfig,
                              filterByCategories: [...printConfig.filterByCategories, cat.id]
                            });
                          } else {
                            setPrintConfig({
                              ...printConfig,
                              filterByCategories: printConfig.filterByCategories.filter(id => id !== cat.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm">{cat.name}</span>
                    </label>
                  ))}
                </div>
                {printConfig.filterByCategories.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrintConfig({...printConfig, filterByCategories: []})}
                    className="mt-2 text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    ✕ Limpar seleção
                  </button>
                )}
              </div>

              {/* Filtrar por Fornecedores */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  🏢 Filtrar por Fornecedores (opcional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  {suppliers.map(sup => (
                    <label key={sup.id} className="flex items-center space-x-2 p-2 hover:bg-white dark:hover:bg-gray-600 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={printConfig.filterBySuppliers.includes(sup.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPrintConfig({
                              ...printConfig,
                              filterBySuppliers: [...printConfig.filterBySuppliers, sup.id]
                            });
                          } else {
                            setPrintConfig({
                              ...printConfig,
                              filterBySuppliers: printConfig.filterBySuppliers.filter(id => id !== sup.id)
                            });
                          }
                        }}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="text-sm">{sup.name}</span>
                    </label>
                  ))}
                </div>
                {printConfig.filterBySuppliers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrintConfig({...printConfig, filterBySuppliers: []})}
                    className="mt-2 text-xs text-emerald-600 hover:text-emerald-700"
                  >
                    ✕ Limpar seleção
                  </button>
                )}
              </div>

              {/* Preview Info */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">📊 Produtos que serão impressos:</span>
                  <span className="bg-emerald-600 text-white px-3 py-1 rounded-full font-bold">
                    {(() => {
                      let count = filteredProducts.length;
                      if (printConfig.filterByCategories.length > 0) {
                        count = filteredProducts.filter(p => printConfig.filterByCategories.includes(p.categoryId)).length;
                      }
                      if (printConfig.filterBySuppliers.length > 0) {
                        const temp = printConfig.filterByCategories.length > 0
                          ? filteredProducts.filter(p => printConfig.filterByCategories.includes(p.categoryId))
                          : filteredProducts;
                        count = temp.filter(p => printConfig.filterBySuppliers.includes(p.supplierId)).length;
                      }
                      return count;
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Botões de Ação */}
            <div className="flex justify-end space-x-4 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-semibold"
              >
                🖨️ Imprimir Agora
              </button>
            </div>
          </div>
        </div>
      )}

       {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-lg">
            <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">{editingProduct ? 'Editar Produto' : 'Adicionar Novo Produto'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Produto</label>
                    <input type="text" name="name" id="name" value={productForm.name} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                    <input type="text" name="sku" id="sku" value={productForm.sku} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-agray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                 <div>
                    <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                    <select name="categoryId" id="categoryId" value={productForm.categoryId} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="supplierId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fornecedor</label>
                    <select name="supplierId" id="supplierId" value={productForm.supplierId} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Preço (R$)</label>
                    <input type="number" name="price" id="price" value={productForm.price} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" step="0.01" />
                </div>
                <div>
                    <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque</label>
                    <input type="number" name="stock" id="stock" value={productForm.stock} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                    <label htmlFor="minStock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Estoque Mínimo</label>
                    <input type="number" name="minStock" id="minStock" value={productForm.minStock} onChange={handleInputChange} required className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL da Imagem</label>
                <input 
                  type="text" 
                  name="imageUrl" 
                  id="imageUrl" 
                  value={productForm.imageUrl} 
                  onChange={handleInputChange} 
                  placeholder="https://exemplo.com/imagem.jpg ou https://source.unsplash.com/400x400/?product" 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                />
                {productForm.imageUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Preview:</p>
                    <img 
                      src={productForm.imageUrl} 
                      alt="Preview" 
                      className="w-24 h-24 rounded-lg object-cover border border-gray-300 dark:border-gray-600"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={handleCloseModal} className="px-6 py-2 rounded-lg text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 font-semibold transition-colors">Cancelar</button>
                <button type="submit" className="px-6 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 font-semibold transition-colors">{editingProduct ? 'Salvar Alterações' : 'Salvar Produto'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Products;