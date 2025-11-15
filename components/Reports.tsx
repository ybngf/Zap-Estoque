import { useState, useEffect } from 'react';
import * as api from '../services/api';
import { Product, Category, Supplier, StockMovement, MovementType } from '../types';

interface EnrichedProduct extends Product {
  categoryName?: string;
  supplierName?: string;
  totalValue?: number;
}

interface EnrichedMovement extends StockMovement {
  productName?: string;
}

interface ReportData {
  totalProducts: number;
  totalValue: number;
  lowStockCount: number;
  outOfStockCount: number;
  categoriesCount: number;
  suppliersCount: number;
  recentMovements: number;
}

interface CategoryReport {
  categoryId: number;
  categoryName: string;
  productCount: number;
  totalValue: number;
  avgStock: number;
}

interface SupplierReport {
  supplierId: number;
  supplierName: string;
  productCount: number;
  totalValue: number;
}

export default function Reports() {
  const [products, setProducts] = useState<EnrichedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [movements, setMovements] = useState<EnrichedMovement[]>([]);
  const [reportData, setReportData] = useState<ReportData>({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    categoriesCount: 0,
    suppliersCount: 0,
    recentMovements: 0
  });
  const [categoryReports, setCategoryReports] = useState<CategoryReport[]>([]);
  const [supplierReports, setSupplierReports] = useState<SupplierReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '30' | '90'>('30');
  const [selectedReport, setSelectedReport] = useState<'overview' | 'stock' | 'categories' | 'suppliers' | 'movements'>('overview');

  useEffect(() => {
    loadAllData();
  }, [selectedPeriod]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError('');

      const [productsData, categoriesData, suppliersData, movementsData] = await Promise.all([
        api.getProducts(),
        api.getCategories(),
        api.getSuppliers(),
        api.getStockMovements()
      ]);

      // Enrich products with category and supplier names
      const enrichedProducts = productsData.map((p: Product) => ({
        ...p,
        categoryName: categoriesData.find((c: Category) => c.id === p.categoryId)?.name || 'Sem categoria',
        supplierName: suppliersData.find((s: Supplier) => s.id === p.supplierId)?.name || 'Sem fornecedor'
      }));

      setProducts(enrichedProducts);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      
      // Filter movements by period
      const periodDays = parseInt(selectedPeriod);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays);
      
      // Enrich movements with product names
      const enrichedMovements = movementsData.map((m: StockMovement) => ({
        ...m,
        productName: enrichedProducts.find((p: EnrichedProduct) => p.id === m.productId)?.name
      }));
      
      const filteredMovements = enrichedMovements.filter((m: EnrichedMovement) => {
        const movementDate = new Date(m.date);
        return movementDate >= cutoffDate;
      });
      
      setMovements(filteredMovements);

      // Calculate report data
      calculateReportData(enrichedProducts, categoriesData, suppliersData, filteredMovements);
      calculateCategoryReports(enrichedProducts);
      calculateSupplierReports(enrichedProducts);

    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar dados dos relatórios');
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateReportData = (
    prods: EnrichedProduct[], 
    cats: Category[], 
    sups: Supplier[], 
    movs: EnrichedMovement[]
  ) => {
    const totalProducts = prods.length;
    const totalValue = prods.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const lowStockCount = prods.filter(p => p.stock <= p.minStock && p.stock > 0).length;
    const outOfStockCount = prods.filter(p => p.stock === 0).length;

    setReportData({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount,
      categoriesCount: cats.length,
      suppliersCount: sups.length,
      recentMovements: movs.length
    });
  };

  const calculateCategoryReports = (prods: EnrichedProduct[]) => {
    const categoryMap = new Map<number, CategoryReport>();

    prods.forEach(p => {
      if (!categoryMap.has(p.categoryId)) {
        categoryMap.set(p.categoryId, {
          categoryId: p.categoryId,
          categoryName: p.categoryName || 'Sem categoria',
          productCount: 0,
          totalValue: 0,
          avgStock: 0
        });
      }

      const report = categoryMap.get(p.categoryId)!;
      report.productCount++;
      report.totalValue += p.price * p.stock;
      report.avgStock += p.stock;
    });

    const reports = Array.from(categoryMap.values()).map(r => ({
      ...r,
      avgStock: r.productCount > 0 ? Math.round(r.avgStock / r.productCount) : 0
    }));

    reports.sort((a, b) => b.totalValue - a.totalValue);
    setCategoryReports(reports);
  };

  const calculateSupplierReports = (prods: EnrichedProduct[]) => {
    const supplierMap = new Map<number, SupplierReport>();

    prods.forEach(p => {
      if (!supplierMap.has(p.supplierId)) {
        supplierMap.set(p.supplierId, {
          supplierId: p.supplierId,
          supplierName: p.supplierName || 'Sem fornecedor',
          productCount: 0,
          totalValue: 0
        });
      }

      const report = supplierMap.get(p.supplierId)!;
      report.productCount++;
      report.totalValue += p.price * p.stock;
    });

    const reports = Array.from(supplierMap.values());
    reports.sort((a, b) => b.totalValue - a.totalValue);
    setSupplierReports(reports);
  };

  const getLowStockProducts = () => {
    return products
      .filter(p => p.stock <= p.minStock)
      .sort((a, b) => (a.stock / a.minStock) - (b.stock / b.minStock))
      .slice(0, 10);
  };

  const getTopValueProducts = () => {
    return products
      .map(p => ({ ...p, totalValue: p.price * p.stock }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 10);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    // Prepare CSV data based on selected report
    let csvContent = '';
    let filename = '';

    switch (selectedReport) {
      case 'categories':
        csvContent = 'Categoria,Produtos,Valor Total,Estoque Médio\n';
        categoryReports.forEach(r => {
          csvContent += `"${r.categoryName}",${r.productCount},${r.totalValue.toFixed(2)},${r.avgStock}\n`;
        });
        filename = 'relatorio_categorias.csv';
        break;

      case 'suppliers':
        csvContent = 'Fornecedor,Produtos,Valor Total\n';
        supplierReports.forEach(r => {
          csvContent += `"${r.supplierName}",${r.productCount},${r.totalValue.toFixed(2)}\n`;
        });
        filename = 'relatorio_fornecedores.csv';
        break;

      case 'stock':
        csvContent = 'Produto,SKU,Estoque Atual,Estoque Mínimo,Status\n';
        getLowStockProducts().forEach(p => {
          const status = p.stock === 0 ? 'SEM ESTOQUE' : 'ESTOQUE BAIXO';
          csvContent += `"${p.name}","${p.sku}",${p.stock},${p.minStock},${status}\n`;
        });
        filename = 'relatorio_estoque_critico.csv';
        break;

      default:
        csvContent = 'Métrica,Valor\n';
        csvContent += `Total de Produtos,${reportData.totalProducts}\n`;
        csvContent += `Valor Total do Inventário,${reportData.totalValue.toFixed(2)}\n`;
        csvContent += `Produtos com Estoque Baixo,${reportData.lowStockCount}\n`;
        csvContent += `Produtos Sem Estoque,${reportData.outOfStockCount}\n`;
        csvContent += `Total de Categorias,${reportData.categoriesCount}\n`;
        csvContent += `Total de Fornecedores,${reportData.suppliersCount}\n`;
        csvContent += `Movimentações (${selectedPeriod} dias),${reportData.recentMovements}\n`;
        filename = 'relatorio_geral.csv';
    }

    // Create download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-600">Carregando relatórios...</div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 print:mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">📊 Relatórios</h2>
        <div className="flex items-center space-x-4 print:hidden">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as '7' | '30' | '90')}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="7">Últimos 7 dias</option>
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
          </select>
          <button
            onClick={handleExport}
            className="flex items-center bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition-colors"
          >
            📥 Exportar CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            🖨️ Imprimir
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Erro:</strong> {error}
        </div>
      )}

      {/* Report Navigation */}
      <div className="flex space-x-2 mb-6 overflow-x-auto print:hidden">
        <button
          onClick={() => setSelectedReport('overview')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            selectedReport === 'overview'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
          }`}
        >
          📈 Visão Geral
        </button>
        <button
          onClick={() => setSelectedReport('stock')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            selectedReport === 'stock'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
          }`}
        >
          🔴 Estoque Crítico
        </button>
        <button
          onClick={() => setSelectedReport('categories')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            selectedReport === 'categories'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
          }`}
        >
          📂 Por Categoria
        </button>
        <button
          onClick={() => setSelectedReport('suppliers')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            selectedReport === 'suppliers'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
          }`}
        >
          🏢 Por Fornecedor
        </button>
        <button
          onClick={() => setSelectedReport('movements')}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap ${
            selectedReport === 'movements'
              ? 'bg-emerald-500 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
          }`}
        >
          📦 Movimentações
        </button>
      </div>

      {/* Overview Report */}
      {selectedReport === 'overview' && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Total de Produtos</p>
                  <p className="text-3xl font-bold mt-2">{reportData.totalProducts}</p>
                </div>
                <div className="text-5xl opacity-50">📦</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Valor do Inventário</p>
                  <p className="text-2xl font-bold mt-2">{formatCurrency(reportData.totalValue)}</p>
                </div>
                <div className="text-5xl opacity-50">💰</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Estoque Baixo</p>
                  <p className="text-3xl font-bold mt-2">{reportData.lowStockCount}</p>
                </div>
                <div className="text-5xl opacity-50">⚠️</div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">Sem Estoque</p>
                  <p className="text-3xl font-bold mt-2">{reportData.outOfStockCount}</p>
                </div>
                <div className="text-5xl opacity-50">🚫</div>
              </div>
            </div>
          </div>

          {/* Secondary KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Categorias Cadastradas</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">{reportData.categoriesCount}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Fornecedores Cadastrados</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">{reportData.suppliersCount}</p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Movimentações ({selectedPeriod} dias)</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-gray-200 mt-1">{reportData.recentMovements}</p>
            </div>
          </div>

          {/* Top Value Products */}
          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">🏆 Top 10 - Produtos com Maior Valor em Estoque</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-300 dark:border-gray-600">
                    <th className="text-left py-2 px-4 text-sm font-semibold">#</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold">Produto</th>
                    <th className="text-left py-2 px-4 text-sm font-semibold">Categoria</th>
                    <th className="text-right py-2 px-4 text-sm font-semibold">Qtd</th>
                    <th className="text-right py-2 px-4 text-sm font-semibold">Preço Unit.</th>
                    <th className="text-right py-2 px-4 text-sm font-semibold">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {getTopValueProducts().map((product, index) => (
                    <tr key={product.id} className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600">
                      <td className="py-3 px-4 text-sm">{index + 1}</td>
                      <td className="py-3 px-4 text-sm font-medium">{product.name}</td>
                      <td className="py-3 px-4 text-sm">{product.categoryName}</td>
                      <td className="py-3 px-4 text-sm text-right">{product.stock}</td>
                      <td className="py-3 px-4 text-sm text-right">{formatCurrency(product.price)}</td>
                      <td className="py-3 px-4 text-sm text-right font-bold text-green-600">{formatCurrency(product.totalValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Critical Report */}
      {selectedReport === 'stock' && (
        <div className="space-y-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-red-800 dark:text-red-300 mb-2">⚠️ Produtos com Estoque Crítico</h3>
            <p className="text-sm text-red-700 dark:text-red-400">
              {reportData.lowStockCount} produtos com estoque baixo e {reportData.outOfStockCount} produtos sem estoque.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="text-left py-3 px-4 font-semibold border-b-2 border-gray-300 dark:border-gray-600">Produto</th>
                  <th className="text-left py-3 px-4 font-semibold border-b-2 border-gray-300 dark:border-gray-600">SKU</th>
                  <th className="text-left py-3 px-4 font-semibold border-b-2 border-gray-300 dark:border-gray-600">Categoria</th>
                  <th className="text-left py-3 px-4 font-semibold border-b-2 border-gray-300 dark:border-gray-600">Fornecedor</th>
                  <th className="text-right py-3 px-4 font-semibold border-b-2 border-gray-300 dark:border-gray-600">Atual</th>
                  <th className="text-right py-3 px-4 font-semibold border-b-2 border-gray-300 dark:border-gray-600">Mínimo</th>
                  <th className="text-center py-3 px-4 font-semibold border-b-2 border-gray-300 dark:border-gray-600">Status</th>
                </tr>
              </thead>
              <tbody>
                {getLowStockProducts().map(product => {
                  const isOutOfStock = product.stock === 0;
                  const percentage = product.minStock > 0 ? (product.stock / product.minStock) * 100 : 0;
                  
                  return (
                    <tr key={product.id} className={`border-b border-gray-200 dark:border-gray-700 ${
                      isOutOfStock ? 'bg-red-50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}>
                      <td className="py-3 px-4">{product.name}</td>
                      <td className="py-3 px-4 font-mono text-sm">{product.sku}</td>
                      <td className="py-3 px-4 text-sm">{product.categoryName}</td>
                      <td className="py-3 px-4 text-sm">{product.supplierName}</td>
                      <td className="py-3 px-4 text-right font-bold">{product.stock}</td>
                      <td className="py-3 px-4 text-right">{product.minStock}</td>
                      <td className="py-3 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">SEM ESTOQUE</span>
                        ) : (
                          <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            {Math.round(percentage)}%
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Categories Report */}
      {selectedReport === 'categories' && (
        <div className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-blue-800 dark:text-blue-300 mb-2">📂 Análise por Categorias</h3>
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Distribuição de produtos e valores por categoria de produto.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryReports.map(report => (
              <div key={report.categoryId} className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-5 rounded-xl shadow-lg">
                <h4 className="font-bold text-lg mb-3">{report.categoryName}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="opacity-90">Produtos:</span>
                    <span className="font-bold">{report.productCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-90">Valor Total:</span>
                    <span className="font-bold">{formatCurrency(report.totalValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-90">Estoque Médio:</span>
                    <span className="font-bold">{report.avgStock} un</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Category Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left py-3 px-4 font-semibold">Categoria</th>
                  <th className="text-right py-3 px-4 font-semibold">Produtos</th>
                  <th className="text-right py-3 px-4 font-semibold">Valor Total</th>
                  <th className="text-right py-3 px-4 font-semibold">Estoque Médio</th>
                  <th className="text-right py-3 px-4 font-semibold">% do Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryReports.map(report => {
                  const percentage = reportData.totalValue > 0 
                    ? (report.totalValue / reportData.totalValue * 100).toFixed(1) 
                    : '0';
                  
                  return (
                    <tr key={report.categoryId} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 font-medium">{report.categoryName}</td>
                      <td className="py-3 px-4 text-right">{report.productCount}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(report.totalValue)}</td>
                      <td className="py-3 px-4 text-right">{report.avgStock}</td>
                      <td className="py-3 px-4 text-right font-semibold">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suppliers Report */}
      {selectedReport === 'suppliers' && (
        <div className="space-y-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-2">🏢 Análise por Fornecedores</h3>
            <p className="text-sm text-green-700 dark:text-green-400">
              Distribuição de produtos e valores por fornecedor.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left py-3 px-4 font-semibold">Fornecedor</th>
                  <th className="text-right py-3 px-4 font-semibold">Produtos</th>
                  <th className="text-right py-3 px-4 font-semibold">Valor Total</th>
                  <th className="text-right py-3 px-4 font-semibold">% do Total</th>
                </tr>
              </thead>
              <tbody>
                {supplierReports.map(report => {
                  const percentage = reportData.totalValue > 0 
                    ? (report.totalValue / reportData.totalValue * 100).toFixed(1) 
                    : '0';
                  
                  return (
                    <tr key={report.supplierId} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="py-3 px-4 font-medium">{report.supplierName}</td>
                      <td className="py-3 px-4 text-right">{report.productCount}</td>
                      <td className="py-3 px-4 text-right font-bold text-green-600">{formatCurrency(report.totalValue)}</td>
                      <td className="py-3 px-4 text-right font-semibold">{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Movements Report */}
      {selectedReport === 'movements' && (
        <div className="space-y-6">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
            <h3 className="text-lg font-bold text-orange-800 dark:text-orange-300 mb-2">📦 Movimentações Recentes</h3>
            <p className="text-sm text-orange-700 dark:text-orange-400">
              Últimas {movements.length} movimentações nos últimos {selectedPeriod} dias.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left py-3 px-4 font-semibold">Data</th>
                  <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold">Produto</th>
                  <th className="text-right py-3 px-4 font-semibold">Quantidade</th>
                  <th className="text-left py-3 px-4 font-semibold">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {movements.slice(0, 50).map(movement => (
                  <tr key={movement.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-3 px-4 text-sm">{formatDate(movement.date)}</td>
                    <td className="py-3 px-4">
                      {movement.type === MovementType.In && <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">ENTRADA</span>}
                      {movement.type === MovementType.Out && <span className="bg-red-500 text-white px-2 py-1 rounded text-xs font-bold">SAÍDA</span>}
                      {movement.type === MovementType.Adjustment && <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold">AJUSTE</span>}
                    </td>
                    <td className="py-3 px-4 font-medium">{movement.productName || `ID: ${movement.productId}`}</td>
                    <td className="py-3 px-4 text-right font-bold">{movement.quantity}</td>
                    <td className="py-3 px-4 text-sm">{movement.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          @page { margin: 1cm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:mb-4 { margin-bottom: 1rem !important; }
        }
      `}</style>
    </div>
  );
}
