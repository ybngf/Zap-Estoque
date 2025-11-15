export enum Role {
  SuperAdmin = 'Super Admin',
  Admin = 'Admin',
  Manager = 'Manager',
  Employee = 'Employee',
}

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: Role;
  companyId: number;
  avatar: string;
}

export interface Company {
  id: number;
  name: string;
  cnpj?: string;
  address?: string;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
  companyId?: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  companyId?: number;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  categoryId: number;
  supplierId: number;
  price: number;
  stock: number;
  minStock: number;
  imageUrl: string;
  companyId?: number;
}

export enum MovementType {
  In = 'Entrada',
  Out = 'Saída',
  Adjustment = 'Ajuste',
}

export interface StockMovement {
  id: number;
  productId: number;
  type: MovementType;
  quantity: number;
  reason: string;
  date: string;
  userId: number;
}

export enum ActivityAction {
  Insert = 'INSERT',
  Update = 'UPDATE',
  Delete = 'DELETE',
}

export enum EntityType {
  Products = 'products',
  Categories = 'categories',
  Suppliers = 'suppliers',
  Users = 'users',
  StockMovements = 'stock_movements',
}

export interface ActivityLog {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  companyId: number;
  companyName: string;
  action: ActivityAction;
  entityType: EntityType;
  entityId: number;
  oldData: any | null;
  newData: any | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface SystemSettings {
  system_name: string;
  system_logo_url: string;
  gemini_api_key: string;
  default_category_id: string;
  default_supplier_id: string;
  min_stock_default: string;
  currency_symbol: string;
  currency_locale: string;
  enable_invoice_processing: string;
  enable_activity_log: string;
  items_per_page: string;
  session_timeout_minutes: string;
  company_website: string;
  company_email: string;
  company_phone: string;
}

export interface SettingItem {
  value: string;
  description: string;
}

export type SettingsResponse = {
  [key in keyof SystemSettings]: SettingItem;
};

// Company Settings (per company configuration)
export interface CompanySettings {
  gemini_api_key: string;
  pixabay_api_key: string;
  invoice_prefix: string;
  tax_rate: string;
  default_payment_terms: string;
  low_stock_alert_enabled: string;
  email_notifications_enabled: string;
  company_logo_url: string;
  company_address: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_tax_id: string;
}

export interface CompanySettingItem {
  value: string;
  description: string;
}

export type CompanySettingsResponse = {
  [key in keyof CompanySettings]: CompanySettingItem;
};
