
import React, { useState, useEffect } from 'react';
import { StockMovement, MovementType, User } from '../types';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const movementsData = await api.getStockMovements();
        setMovements(movementsData);
      } catch (error) {
        console.error('Erro ao carregar movimentações:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Histórico de Movimentações</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400">
              <th className="py-3 px-4 font-medium">Data</th>
              <th className="py-3 px-4 font-medium">Produto</th>
              <th className="py-3 px-4 font-medium text-center">Tipo</th>
              <th className="py-3 px-4 font-medium text-right">Quantidade</th>
              <th className="py-3 px-4 font-medium">Motivo</th>
              <th className="py-3 px-4 font-medium">Usuário</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="animate-pulse">Carregando movimentações...</div>
                </td>
              </tr>
            ) : movements.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Nenhuma movimentação registrada
                </td>
              </tr>
            ) : movements.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(movement => {
                const config = movementTypeConfig[movement.type];
                const Icon = config.icon;
                return (
                    <tr key={movement.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{new Date(movement.date).toLocaleString()}</td>
                        <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-200">{movement.productName || 'Produto não encontrado'}</td>
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

