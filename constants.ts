import { User, Role, Category, Supplier, Product, StockMovement, MovementType, Company } from './types';

export const USERS: User[] = [
  { id: 1, name: 'Maria Santos', email: 'maria@donasalada.com.br', password: '123456', role: Role.Admin, company: 'Dona Salada', avatar: 'https://picsum.photos/seed/maria/100' },
  { id: 2, name: 'João Silva', email: 'joao@donasalada.com.br', password: '123456', role: Role.Manager, company: 'Dona Salada', avatar: 'https://picsum.photos/seed/joao/100' },
  { id: 3, name: 'Ana Oliveira', email: 'ana@donasalada.com.br', password: '123456', role: Role.Employee, company: 'Dona Salada', avatar: 'https://picsum.photos/seed/ana/100' },
  { id: 4, name: 'Super Admin', email: 'admin@sistema.com', password: '123456', role: Role.SuperAdmin, company: 'Sistema', avatar: 'https://picsum.photos/seed/admin/100' },
];

export const COMPANIES: Company[] = [
    { id: 1, name: 'Dona Salada' },
    { id: 2, name: 'Sistema' },
];

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Verduras' },
  { id: 2, name: 'Frutas' },
  { id: 3, name: 'Molhos' },
  { id: 4, name: 'Bebidas' },
];

export const SUPPLIERS: Supplier[] = [
  { id: 1, name: 'Fazenda Fresca', contactPerson: 'Carlos Andrade', email: 'contato@fazendafresca.com', phone: '(11) 98765-4321' },
  { id: 2, name: 'Horta & Cia', contactPerson: 'Fernanda Lima', email: 'vendas@hortaecia.com', phone: '(21) 91234-5678' },
];

export const PRODUCTS: Product[] = [
  { id: 1, name: 'Alface Crespa', sku: 'V-ALF-001', categoryId: 1, supplierId: 1, price: 3.50, stock: 150, minStock: 20, imageUrl: 'https://picsum.photos/seed/alface/400' },
  { id: 2, name: 'Tomate Cereja', sku: 'F-TOM-002', categoryId: 2, supplierId: 1, price: 8.90, stock: 80, minStock: 15, imageUrl: 'https://picsum.photos/seed/tomate/400' },
  { id: 3, name: 'Molho Caesar', sku: 'M-CAE-003', categoryId: 3, supplierId: 2, price: 12.00, stock: 45, minStock: 10, imageUrl: 'https://picsum.photos/seed/molho/400' },
  { id: 4, name: 'Suco de Laranja Natural', sku: 'B-SUC-004', categoryId: 4, supplierId: 2, price: 9.50, stock: 60, minStock: 25, imageUrl: 'https://picsum.photos/seed/suco/400' },
  { id: 5, name: 'Rúcula', sku: 'V-RUC-005', categoryId: 1, supplierId: 1, price: 4.20, stock: 18, minStock: 20, imageUrl: 'https://picsum.photos/seed/rucula/400' },
];

export const STOCK_MOVEMENTS: StockMovement[] = [
  { id: 1, productId: 1, type: MovementType.In, quantity: 50, reason: 'Pedido #101', date: '2023-10-26T10:00:00Z', userId: 2 },
  { id: 2, productId: 2, type: MovementType.Out, quantity: 10, reason: 'Venda #201', date: '2023-10-26T11:30:00Z', userId: 3 },
  { id: 3, productId: 3, type: MovementType.In, quantity: 20, reason: 'Pedido #102', date: '2023-10-27T09:00:00Z', userId: 2 },
  { id: 4, productId: 1, type: MovementType.Out, quantity: 5, reason: 'Venda #202', date: '2023-10-27T14:00:00Z', userId: 3 },
  { id: 5, productId: 4, type: MovementType.Adjustment, quantity: -2, reason: 'Perda', date: '2023-10-28T18:00:00Z', userId: 2 },
];