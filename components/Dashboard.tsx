import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { CubeIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ExclamationTriangleIcon } from './Icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import * as api from '../services/api';

interface DashboardCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  onClick?: () => void;
  isLoading: boolean;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, color, onClick, isLoading }) => (
  <div
    className={`relative p-6 rounded-2xl overflow-hidden text-white shadow-lg transition-transform transform hover:-translate-y-1 ${color} ${onClick ? 'cursor-pointer' : ''}`}
    onClick={onClick}
  >
    {isLoading ? (
        <div className="animate-pulse flex flex-col z-10">
            <div className="h-6 bg-white/30 rounded w-3/4 mb-4"></div>
            <div className="h-10 bg-white/30 rounded w-1/2"></div>
        </div>
    ) : (
      <>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Icon className="w-8 h-8 opacity-80" />
          </div>
          <p className="text-4xl font-bold mt-4">{value}</p>
        </div>
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white/10"></div>
        <div className="absolute -bottom-8 -left-2 w-32 h-32 rounded-full bg-white/5"></div>
      </>
    )}
  </div>
);


interface DashboardProps {
    setView: (view: any) => void;
    currentUser: User;
}

const Dashboard: React.FC<DashboardProps> = ({ setView }) => {
    const [dashboardData, setDashboardData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            const data = await api.getDashboardData();
            setDashboardData(data);
            setIsLoading(false);
        };
        fetchData();
    }, []);

  const salesData = [
    { name: 'Seg', 'Saídas': 30 },
    { name: 'Ter', 'Saídas': 45 },
    { name: 'Qua', 'Saídas': 28 },
    { name: 'Qui', 'Saídas': 50 },
    { name: 'Sex', 'Saídas': 62 },
    { name: 'Sáb', 'Saídas': 40 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard title="Total de Produtos" value={dashboardData?.totalProducts ?? 0} icon={CubeIcon} color="bg-gradient-to-br from-blue-500 to-indigo-600" onClick={() => setView('products')} isLoading={isLoading} />
        <DashboardCard title="Estoque Baixo" value={dashboardData?.lowStockProducts ?? 0} icon={ExclamationTriangleIcon} color="bg-gradient-to-br from-amber-500 to-orange-600" onClick={() => setView('products')} isLoading={isLoading} />
        <DashboardCard title="Entradas Recentes" value={dashboardData?.recentMovementsIn ?? 0} icon={ArrowTrendingUpIcon} color="bg-gradient-to-br from-emerald-500 to-green-600" onClick={() => setView('movements')} isLoading={isLoading}/>
        <DashboardCard title="Saídas Recentes" value={dashboardData?.recentMovementsOut ?? 0} icon={ArrowTrendingDownIcon} color="bg-gradient-to-br from-rose-500 to-red-600" onClick={() => setView('movements')} isLoading={isLoading}/>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Atividade de Vendas (Saídas)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.5rem' }} />
              <Legend />
              <Line type="monotone" dataKey="Saídas" stroke="#10b981" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg">
          <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Estoque por Categoria</h3>
           {isLoading ? <div className="animate-pulse h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg"></div> :
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData?.stockByCategoryData ?? []}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2}/>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(31, 41, 55, 0.8)', border: 'none', borderRadius: '0.5rem' }} />
                <Legend />
                <Bar dataKey="estoque" fill="#3b82f6" />
                </BarChart>
            </ResponsiveContainer>
           }
        </div>
      </div>
    </div>
  );
};

export default Dashboard;