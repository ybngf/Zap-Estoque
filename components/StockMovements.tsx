
import React, { useState, useEffect } from 'react';
import { StockMovement, MovementType, User, Company, Role } from '../types';
import * as api from '../services/api';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, ArrowsRightLeftIcon } from './Icons';

interface StockMovementsProps {
  currentUser: User;
}

const movementTypeConfig: Record<MovementType, { color: string, icon: React.ComponentType<{className?: string}> }> = {
    [MovementType.In]: { color: 'text-emerald-500', icon: ArrowTrendingUpIcon },
    [MovementType.Out]: { color: 'text-rose-500', icon: ArrowTrendingDownIcon },
    [MovementType.Adjustment]: { color: 'text-amber-500', icon: ArrowsRightLeftIcon },
};


const StockMovements: React.FC<StockMovementsProps> = ({ currentUser }) => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  const isSuperAdmin = currentUser.role === Role.SuperAdmin;

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const movementsData = await api.getStockMovements();
        setMovements(movementsData);
        
        // Se for Super Admin, carregar lista de empresas para o filtro
        if (isSuperAdmin) {
          const companiesData = await api.getCompanies();
          setCompanies(companiesData);
        }
      } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [isSuperAdmin]);

  // Filtrar movimentações por empresa selecionada
  const filteredMovements = isSuperAdmin && selectedCompanyId !== 'all'
    ? movements.filter(m => m.companyId === selectedCompanyId)
    : movements;

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Histórico de Movimentações</h2>
        
        {/* Filtro de empresa para Super Admin */}
        {isSuperAdmin && (
          <div className="flex items-center gap-2">
            <label htmlFor="companyFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Filtrar por empresa:
            </label>
            <select
              id="companyFilter"
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as empresas ({movements.length})</option>
              {companies.map(company => {
                const count = movements.filter(m => m.companyId === company.id).length;
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
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
              <th className="py-3 px-4 font-medium">Data</th>
              <th className="py-3 px-4 font-medium">Produto</th>
              {isSuperAdmin && <th className="py-3 px-4 font-medium">Empresa</th>}
              <th className="py-3 px-4 font-medium text-center">Tipo</th>
              <th className="py-3 px-4 font-medium text-right">Quantidade</th>
              <th className="py-3 px-4 font-medium">Motivo</th>
              <th className="py-3 px-4 font-medium">Usuário</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8">
                  <div className="animate-pulse">Carregando movimentações...</div>
                </td>
              </tr>
            ) : filteredMovements.length === 0 ? (
              <tr>
                <td colSpan={isSuperAdmin ? 7 : 6} className="text-center py-8 text-gray-500">
                  Nenhuma movimentação registrada
                </td>
              </tr>
            ) : filteredMovements.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(movement => {
                const config = movementTypeConfig[movement.type];
                const Icon = config.icon;
                return (
                    <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{new Date(movement.date).toLocaleString()}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">{movement.productName || 'Produto não encontrado'}</td>
                        {isSuperAdmin && (
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                              {movement.companyName || 'N/A'}
                            </span>
                          </td>
                        )}
                        <td className={`py-3 px-4 text-center font-semibold ${config.color}`}>
                            <div className="flex items-center justify-center space-x-2">
                                <Icon className="w-5 h-5"/>
                                <span>{movement.type}</span>
                            </div>
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${config.color}`}>{movement.quantity}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{movement.reason}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{movement.userName || 'Sistema'}</td>
                    </tr>
                )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StockMovements;

