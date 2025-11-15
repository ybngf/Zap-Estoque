import { User, Category, Supplier, Product, StockMovement, Company, Role, ActivityLog, SystemSettings, SettingsResponse, CompanySettings, CompanySettingsResponse } from '../types';

// Base API URL - Dynamic based on environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

// Get base path from current URL for subdirectory support
const getBasePath = () => {
  if (isDevelopment) {
    // Check if running on Vite dev server (port 5173/5174)
    if (window.location.port === '5173' || window.location.port === '5174') {
      // Use Vite proxy (configured in vite.config.ts)
      return '/api';
    }
    
    // Running on Apache/production (localhost without port or with port 80)
    // Auto-detect base path from current URL
    const pathname = window.location.pathname;
    
    // Extract base directory (e.g., /estoque/, /EstoqueGemini/)
    const match = pathname.match(/^(\/[^\/]+\/)/);
    const baseDir = match ? match[1] : '/';
    
    return baseDir + 'api.php';
  }
  
  // Production fallback
  return '/EstoqueGemini/api.php';
};

const API_URL = getBasePath();

console.log('🚀 API_URL initialized:', API_URL, '| isDevelopment:', isDevelopment, '| Port:', window.location.port, '| Current path:', window.location.pathname);

// Helper function for API requests
const apiRequest = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro na requisição' }));
    throw new Error(error.error || 'Erro na requisição');
  }

  return response.json();
};


// --- Products API ---
export const getProducts = async (): Promise<Product[]> => {
    return apiRequest<Product[]>('/products');
};

export const createProduct = async (productData: Omit<Product, 'id'>): Promise<Product> => {
    return apiRequest<Product>('/products', {
        method: 'POST',
        body: JSON.stringify(productData),
    });
};

export const updateProduct = async (productId: number, productData: Partial<Omit<Product, 'id'>>): Promise<Product> => {
    return apiRequest<Product>(`/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify(productData),
    });
};

export const deleteProduct = async (productId: number): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/products/${productId}`, {
        method: 'DELETE',
    });
};


// --- Categories API ---
export const getCategories = async (): Promise<Category[]> => {
    return apiRequest<Category[]>('/categories');
};

export const createCategory = async (categoryData: Omit<Category, 'id'>): Promise<Category> => {
    return apiRequest<Category>('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData),
    });
};

export const updateCategory = async (categoryId: number, categoryData: Partial<Omit<Category, 'id'>>): Promise<Category> => {
    return apiRequest<Category>(`/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify(categoryData),
    });
};

export const deleteCategory = async (categoryId: number): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/categories/${categoryId}`, {
        method: 'DELETE',
    });
}


// --- Suppliers API ---
export const getSuppliers = async (): Promise<Supplier[]> => {
    return apiRequest<Supplier[]>('/suppliers');
};

export const createSupplier = async (supplierData: Omit<Supplier, 'id'>): Promise<Supplier> => {
    return apiRequest<Supplier>('/suppliers', {
        method: 'POST',
        body: JSON.stringify(supplierData),
    });
};

export const updateSupplier = async (supplierId: number, supplierData: Partial<Omit<Supplier, 'id'>>): Promise<Supplier> => {
    return apiRequest<Supplier>(`/suppliers/${supplierId}`, {
        method: 'PUT',
        body: JSON.stringify(supplierData),
    });
};

export const deleteSupplier = async (supplierId: number): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/suppliers/${supplierId}`, {
        method: 'DELETE',
    });
}

// --- Users API ---
export const getUsers = async (): Promise<User[]> => {
    return apiRequest<User[]>('/users');
};

export const createUser = async (userData: Omit<User, 'id'>): Promise<User> => {
    return apiRequest<User>('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
    });
};

export const updateUser = async (userId: number, userData: Partial<Omit<User, 'id'>>): Promise<User> => {
    return apiRequest<User>(`/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(userData),
    });
};

export const deleteUser = async (userId: number): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/users/${userId}`, {
        method: 'DELETE',
    });
}


// --- Companies API ---
export const getCompanies = async (): Promise<Company[]> => {
    return apiRequest<Company[]>('/companies');
};

export const createCompany = async (companyData: Omit<Company, 'id'>): Promise<Company> => {
    return apiRequest<Company>('/companies', {
        method: 'POST',
        body: JSON.stringify(companyData),
    });
};

export const updateCompany = async (companyId: number, companyData: Partial<Omit<Company, 'id'>>): Promise<Company> => {
    return apiRequest<Company>(`/companies/${companyId}`, {
        method: 'PUT',
        body: JSON.stringify(companyData),
    });
};

export const deleteCompany = async (companyId: number): Promise<{ success: boolean }> => {
    return apiRequest<{ success: boolean }>(`/companies/${companyId}`, {
        method: 'DELETE',
    });
}

// --- Stock Movements API ---
export const getStockMovements = async (): Promise<StockMovement[]> => {
    return apiRequest<StockMovement[]>('/stock-movements');
};

export const createStockMovement = async (movementData: Omit<StockMovement, 'id' | 'date'>): Promise<StockMovement> => {
    return apiRequest<StockMovement>('/stock-movements', {
        method: 'POST',
        body: JSON.stringify(movementData),
    });
};

// --- Authentication ---
export const login = async (email: string, pass: string): Promise<User | null> => {
    try {
        return await apiRequest<User>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password: pass }),
        });
    } catch (error) {
        return null;
    }
}

// --- Dashboard Data ---
export const getDashboardData = async () => {
    return apiRequest('/dashboard');
};

// --- Activity Log ---
export const getActivityLog = async (): Promise<ActivityLog[]> => {
    return apiRequest<ActivityLog[]>('/activity-log');
};

// --- CSV Import ---
export const importProducts = async (products: any[], options: {importIds: boolean, replaceExisting: boolean}): Promise<{success: boolean, imported: number, updated?: number, total: number, errors: string[]}> => {
    return apiRequest('/products-import', {
        method: 'POST',
        body: JSON.stringify({ products, options }),
    });
};

export const importCategories = async (categories: any[], options: {importIds: boolean, replaceExisting: boolean}): Promise<{success: boolean, imported: number, updated?: number, total: number, errors: string[]}> => {
    return apiRequest('/categories-import', {
        method: 'POST',
        body: JSON.stringify({ categories, options }),
    });
};

export const importSuppliers = async (suppliers: any[], options: {importIds: boolean, replaceExisting: boolean}): Promise<{success: boolean, imported: number, updated?: number, total: number, errors: string[]}> => {
    return apiRequest('/suppliers-import', {
        method: 'POST',
        body: JSON.stringify({ suppliers, options }),
    });
};

// --- Settings API ---
export const getSettings = async (): Promise<SettingsResponse> => {
    return apiRequest<SettingsResponse>('/settings');
};

export const updateSettings = async (settings: Partial<SystemSettings>): Promise<{success: boolean, updated: number, errors: string[]}> => {
    return apiRequest('/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
    });
};

// --- Company Settings API ---
export const getCompanySettings = async (): Promise<CompanySettingsResponse> => {
    return apiRequest<CompanySettingsResponse>('/company-settings');
};

export const updateCompanySettings = async (settings: Partial<CompanySettings>): Promise<{success: boolean, updated: number, errors: string[]}> => {
    return apiRequest('/company-settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
    });
};

// --- Bulk Operations API ---
export const bulkZeroStock = async (categoryIds: number[]): Promise<{success: boolean, message: string, affected: number}> => {
    return apiRequest('/bulk-operations', {
        method: 'POST',
        body: JSON.stringify({ action: 'zero-stock', categoryIds }),
    });
};

export const bulkClearMovements = async (categoryIds: number[]): Promise<{success: boolean, message: string, affected: number}> => {
    return apiRequest('/bulk-operations', {
        method: 'POST',
        body: JSON.stringify({ action: 'clear-movements', categoryIds }),
    });
};

export const bulkDeleteProducts = async (categoryIds: number[]): Promise<{success: boolean, message: string, affected: number, movements_deleted: number}> => {
    return apiRequest('/bulk-operations', {
        method: 'POST',
        body: JSON.stringify({ action: 'delete-products', categoryIds }),
    });
};

export const bulkUpdateImages = async (categoryIds: number[]): Promise<{success: boolean, message: string, updated: number, skipped: number}> => {
    return apiRequest('/bulk-operations', {
        method: 'POST',
        body: JSON.stringify({ action: 'update-images', categoryIds }),
    });
};

// Critical Activity Report functions
export const getCriticalActivities = async (filters?: {
    startDate?: string;
    endDate?: string;
    userId?: string;
    companyId?: string;
    actionType?: string;
    tableName?: string;
}): Promise<any[]> => {
    const params = new URLSearchParams();
    if (filters?.startDate) params.append('start_date', filters.startDate);
    if (filters?.endDate) params.append('end_date', filters.endDate);
    if (filters?.userId) params.append('user_id', filters.userId);
    if (filters?.companyId) params.append('company_id', filters.companyId);
    if (filters?.actionType) params.append('action_type', filters.actionType);
    if (filters?.tableName) params.append('table_name', filters.tableName);

    return apiRequest(`/activity-log?${params.toString()}`);
};
