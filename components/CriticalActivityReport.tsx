import { useState, useEffect } from 'react';
import * as api from '../services/api';

interface CriticalActivity {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  company_id: number;
  company_name: string;
  action_type: 'CREATE' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: number;
  old_value: any;
  new_value: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

interface FilterOptions {
  startDate: string;
  endDate: string;
  userId: string;
  companyId: string;
  actionType: string;
  tableName: string;
}

export default function CriticalActivityReport() {
  const [activities, setActivities] = useState<CriticalActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
    endDate: new Date().toISOString().split('T')[0],
    userId: '',
    companyId: '',
    actionType: '',
    tableName: ''
  });

  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load critical activities
      const activitiesData = await api.getCriticalActivities(filters);
      setActivities(activitiesData);

      // Load users and companies for filters
      const [usersData, companiesData] = await Promise.all([
        api.getUsers(),
        api.getCompanies()
      ]);
      setUsers(usersData);
      setCompanies(companiesData);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadData();
  };

  const handleExportCSV = () => {
    // Create CSV content
    const headers = ['Data/Hora', 'Usuário', 'Email', 'Empresa', 'Ação', 'Tabela', 'Registro ID', 'IP', 'Detalhes'];
    const rows = activities.map(activity => [
      new Date(activity.created_at).toLocaleString('pt-BR'),
      activity.user_name,
      activity.user_email,
      activity.company_name,
      activity.action_type,
      activity.table_name,
      activity.record_id,
      activity.ip_address,
      JSON.stringify(activity.new_value || activity.old_value || {})
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `atividades-criticas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getActionBadge = (action: string) => {
    const badges = {
      CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
    };
    return badges[action as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  const getCriticalityLevel = (activity: CriticalActivity): { level: string; color: string } => {
    // Determine criticality based on action and table
    const criticalTables = ['users', 'companies', 'company_settings', 'products'];
    const isCriticalTable = criticalTables.includes(activity.table_name);
    const isDelete = activity.action_type === 'DELETE';

    if (isDelete && isCriticalTable) {
      return { level: 'CRÍTICO', color: 'text-red-600 dark:text-red-400' };
    } else if (isDelete || (isCriticalTable && activity.action_type === 'UPDATE')) {
      return { level: 'ALTO', color: 'text-orange-600 dark:text-orange-400' };
    } else if (isCriticalTable) {
      return { level: 'MÉDIO', color: 'text-yellow-600 dark:text-yellow-400' };
    }
    return { level: 'BAIXO', color: 'text-gray-600 dark:text-gray-400' };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-gray-600 dark:text-gray-400">Carregando relatório...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
          <span className="text-4xl">🔒</span>
          Relatório de Atividades Críticas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Monitoramento detalhado de ações críticas realizadas por usuários no sistema
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-300">❌ {error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <span>🔍</span> Filtros
        </h2>
        
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Inicial
            </label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data Final
            </label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Usuário
            </label>
            <select
              name="userId"
              value={filters.userId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Empresa
            </label>
            <select
              name="companyId"
              value={filters.companyId}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo de Ação
            </label>
            <select
              name="actionType"
              value={filters.actionType}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tabela
            </label>
            <select
              name="tableName"
              value={filters.tableName}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas</option>
              <option value="users">Usuários</option>
              <option value="companies">Empresas</option>
              <option value="products">Produtos</option>
              <option value="stock_movements">Movimentações</option>
              <option value="company_settings">Configurações</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              onClick={handleApplyFilters}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Aplicar
            </button>
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              title="Exportar para CSV"
            >
              📥
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">Total de Atividades</div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{activities.length}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg shadow-sm p-4 border border-green-200 dark:border-green-800">
          <div className="text-sm text-green-600 dark:text-green-400">Criações</div>
          <div className="text-2xl font-bold text-green-800 dark:text-green-200">
            {activities.filter(a => a.action_type === 'CREATE').length}
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow-sm p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-600 dark:text-blue-400">Atualizações</div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
            {activities.filter(a => a.action_type === 'UPDATE').length}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg shadow-sm p-4 border border-red-200 dark:border-red-800">
          <div className="text-sm text-red-600 dark:text-red-400">Exclusões</div>
          <div className="text-2xl font-bold text-red-800 dark:text-red-200">
            {activities.filter(a => a.action_type === 'DELETE').length}
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Criticidade</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Data/Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usuário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Ação</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tabela</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Registro</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">IP</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {activities.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma atividade encontrada no período selecionado
                  </td>
                </tr>
              ) : (
                activities.map((activity) => {
                  const criticality = getCriticalityLevel(activity);
                  return (
                    <tr key={activity.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold ${criticality.color}`}>
                          {criticality.level}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {new Date(activity.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {activity.user_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {activity.user_email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {activity.company_name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getActionBadge(activity.action_type)}`}>
                          {activity.action_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {activity.table_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        #{activity.record_id}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-600 dark:text-gray-400">
                        {activity.ip_address || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 dark:text-blue-400 hover:underline">
                            Ver
                          </summary>
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-900 rounded text-gray-700 dark:text-gray-300">
                            <div className="mb-1"><strong>User Agent:</strong> {activity.user_agent || 'N/A'}</div>
                            {activity.old_value && (
                              <div className="mb-1">
                                <strong>Valor Anterior:</strong>
                                <pre className="mt-1 text-xs overflow-x-auto">{JSON.stringify(activity.old_value, null, 2)}</pre>
                              </div>
                            )}
                            {activity.new_value && (
                              <div>
                                <strong>Novo Valor:</strong>
                                <pre className="mt-1 text-xs overflow-x-auto">{JSON.stringify(activity.new_value, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
