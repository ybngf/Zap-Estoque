import React, { useState } from 'react';
import * as api from '../services/api';

interface LoginProps {
  onLogin: (email: string, pass: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemName, setSystemName] = useState<string>('Zap Estoque');
  const [logoUrl, setLogoUrl] = useState<string>('');

  React.useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await api.getSettings();
        if (settings.system_name?.value) {
          setSystemName(settings.system_name.value);
        }
        if (settings.system_logo_url?.value) {
          setLogoUrl(settings.system_logo_url.value);
        }
      } catch (error) {
        console.warn('Could not load system settings for login page:', error);
      }
    };
    loadSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const success = await onLogin(email, password);
    if (!success) {
      setError('Credenciais inválidas. Tente novamente.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        <div className="text-center">
          {logoUrl ? (
            <div className="flex justify-center mb-4">
              <img src={logoUrl} alt={systemName} className="h-16 object-contain" onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
            </div>
          ) : (
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">
              {systemName}
            </h1>
          )}
          <p className="mt-2 text-gray-600 dark:text-gray-400">Controle de Estoque</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="relative">
             <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer h-10 w-full border-b-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-transparent placeholder-transparent focus:outline-none focus:border-emerald-500"
              placeholder="seu@email.com"
            />
             <label htmlFor="email-address" className="absolute left-0 -top-3.5 text-gray-600 dark:text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 dark:peer-focus:text-gray-400 peer-focus:text-sm">
              Email
            </label>
          </div>
          <div className="mt-4 relative">
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer h-10 w-full border-b-2 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-transparent placeholder-transparent focus:outline-none focus:border-emerald-500"
              placeholder="Senha"
            />
            <label htmlFor="password" className="absolute left-0 -top-3.5 text-gray-600 dark:text-gray-400 text-sm transition-all peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-gray-500 peer-placeholder-shown:top-2 peer-focus:-top-3.5 peer-focus:text-gray-600 dark:peer-focus:text-gray-400 peer-focus:text-sm">
              Senha
            </label>
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 dark:focus:ring-offset-gray-800 transition-transform transform hover:scale-105 disabled:bg-emerald-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sistema de Gestão de Estoque
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            © {new Date().getFullYear()} Todos os direitos reservados
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;