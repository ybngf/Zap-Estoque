import React, { useState, useEffect } from 'react';
import { ActivityLog, ActivityAction, EntityType, User } from '../types';
import * as api from '../services/api';

interface Props {
  currentUser: User;
}

const ActivityLogComponent: React.FC<Props> = ({ currentUser }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  
  // Filters
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterEntity, setFilterEntity] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    loadLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filterAction, filterEntity, filterUser, filterDate]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const data = await api.getActivityLog();
      setLogs(data);
    } catch (error) {
      console.error('Erro ao carregar log de atividades:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.action === filterAction);
    }

    if (filterEntity !== 'all') {
      filtered = filtered.filter(log => log.entityType === filterEntity);
    }

    if (filterUser !== 'all') {
      filtered = filtered.filter(log => log.userId.toString() === filterUser);
    }

    if (filterDate) {
      filtered = filtered.filter(log => {
        const logDate = new Date(log.createdAt).toISOString().split('T')[0];
        return logDate === filterDate;
      });
    }

    setFilteredLogs(filtered);
  };

  const getActionBadge = (action: ActivityAction) => {
    const colors = {
      INSERT: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
    };
    
    const labels = {
      INSERT: 'Criação',
      UPDATE: 'Edição',
      DELETE: 'Exclusão',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colors[action]}`}>
        {labels[action]}
      </span>
    );
  };

  const getEntityLabel = (entityType: EntityType) => {
    const labels = {
      products: 'Produtos',
      categories: 'Categorias',
      suppliers: 'Fornecedores',
      users: 'Usuários',
      stock_movements: 'Movimentações',
    };
    return labels[entityType] || entityType;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  const uniqueUsers = Array.from(new Set(logs.map(log => log.userId))).map(userId => {
    const log = logs.find(l => l.userId === userId);
    return { id: userId, name: log?.userName || 'Desconhecido' };
  });

  const renderDataDiff = (log: ActivityLog) => {
    if (!log.oldData && !log.newData) return null;

    return (
      <div className="mt-4 space-y-4">
        {log.action === ActivityAction.Delete && log.oldData && (
          <div>
            <h4 className="text-sm font-semibold text-red-700 mb-2">Dados Removidos:</h4>
            <pre className="bg-red-50 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(log.oldData, null, 2)}
            </pre>
          </div>
        )}

        {log.action === ActivityAction.Insert && log.newData && (
          <div>
            <h4 className="text-sm font-semibold text-green-700 mb-2">Dados Criados:</h4>
            <pre className="bg-green-50 p-3 rounded text-xs overflow-x-auto">
              {JSON.stringify(log.newData, null, 2)}
            </pre>
          </div>
        )}

        {log.action === ActivityAction.Update && (
          <div className="grid grid-cols-2 gap-4">
            {log.oldData && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Antes:</h4>
                <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(log.oldData, null, 2)}
                </pre>
              </div>
            )}
            {log.newData && (
              <div>
                <h4 className="text-sm font-semibold text-blue-700 mb-2">Depois:</h4>
                <pre className="bg-blue-50 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(log.newData, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Carregando logs...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">📊</span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Log de Atividades</h1>
            <p className="text-sm text-gray-600">
              Histórico de todas as alterações no sistema
            </p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {filteredLogs.length} registro{filteredLogs.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🔍</span>
          <h2 className="font-semibold text-gray-700">Filtros</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ação
            </label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="INSERT">Criação</option>
              <option value="UPDATE">Edição</option>
              <option value="DELETE">Exclusão</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entidade
            </label>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todas</option>
              <option value="products">Produtos</option>
              <option value="categories">Categorias</option>
              <option value="suppliers">Fornecedores</option>
              <option value="users">Usuários</option>
              <option value="stock_movements">Movimentações</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usuário
            </label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Todos</option>
              {uniqueUsers.map(user => (
                <option key={user.id} value={user.id.toString()}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {(filterAction !== 'all' || filterEntity !== 'all' || filterUser !== 'all' || filterDate) && (
          <button
            onClick={() => {
              setFilterAction('all');
              setFilterEntity('all');
              setFilterUser('all');
              setFilterDate('');
            }}
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ação
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Entidade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Nenhum registro encontrado
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="mr-2">👤</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {log.userName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {log.userEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2">📦</span>
                        {getEntityLabel(log.entityType)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      #{log.entityId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Ver detalhes"
                      >
                        👁️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Detalhes da Atividade #{selectedLog.id}
                </h3>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-sm font-semibold text-gray-600">Usuário:</span>
                    <p className="text-sm text-gray-900">{selectedLog.userName} ({selectedLog.userEmail})</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-600">Empresa:</span>
                    <p className="text-sm text-gray-900">{selectedLog.companyName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-600">Ação:</span>
                    <p className="text-sm">{getActionBadge(selectedLog.action)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-600">Entidade:</span>
                    <p className="text-sm text-gray-900">{getEntityLabel(selectedLog.entityType)} #{selectedLog.entityId}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-600">Data/Hora:</span>
                    <p className="text-sm text-gray-900">{formatDate(selectedLog.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-600">IP:</span>
                    <p className="text-sm text-gray-900">{selectedLog.ipAddress || 'Não registrado'}</p>
                  </div>
                </div>

                {renderDataDiff(selectedLog)}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityLogComponent;
