// src/types/index.ts
// Definiciones de tipos TypeScript para el sistema POS

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'cajero';
  nombre: string;
  email?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  nombre: string;
  descripcion?: string;
  precio: number;
  costo: number;
  stock: number;
  stock_minimo: number;
  codigo_barras?: string;
  categoria_id: number;
  proveedor_id?: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  nombre: string;
  rnc_cedula?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  limite_credito?: number;
  saldo_pendiente: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  nombre: string;
  rnc?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  contacto?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: number;
  factura_id: number;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  itbis: number;
  subtotal: number;
  created_at: string;
}

export interface Category {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  code?: string;
}

export interface LoadingState {
  loading: boolean;
  error: string | null;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface Theme {
  name: 'light' | 'dark' | 'blue';
  label: string;
  icon: string;
}

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterState {
  search?: string;
  category?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Props comunes para componentes
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingSpinnerProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export interface AlertMessageProps extends BaseComponentProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export interface PaginationProps extends BaseComponentProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
}

// Tipos para hooks personalizados
export interface UsePaginationReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  refetch: () => void;
}

export interface UseErrorHandlerReturn {
  error: string | null;
  setError: (error: string | null) => void;
  clearError: () => void;
  handleError: (error: any, customMessage?: string) => void;
  wrapAsync: <T>(fn: () => Promise<T>) => Promise<T>;
}

// Tipos para formularios
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

export interface FormData {
  [key: string]: any;
}

// Tipos para la API
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  user: User;
  token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  nombre: string;
  email?: string;
  role?: 'admin' | 'cajero';
}

// Tipos para reportes
export interface SalesReport {
  total_sales: number;
  total_revenue: number;
  total_profit: number;
  period: string;
  top_products: Array<{
    product_id: number;
    product_name: string;
    quantity_sold: number;
    revenue: number;
  }>;
  daily_sales: Array<{
    date: string;
    sales: number;
    revenue: number;
  }>;
}

export interface InventoryReport {
  total_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  total_value: number;
  categories: Array<{
    category_id: number;
    category_name: string;
    product_count: number;
    total_value: number;
  }>;
}

// Tipos para configuración
export interface AppConfig {
  theme: 'light' | 'dark' | 'blue';
  language: 'es' | 'en';
  currency: 'DOP' | 'USD';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY';
  itemsPerPage: number;
  autoSave: boolean;
  notifications: boolean;
}

// Declaraciones globales
declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => boolean;
    };
  }
}

export interface Invoice {
  id: number;
  numero_factura: string;
  cliente_id?: number;
  cliente_nombre?: string;
  cajero_id: number;
  cajero_nombre?: string;
  total: number;
  itbis?: number;
  estado: 'activa' | 'anulada';
  tiene_nota_credito?: boolean;
  workstation_id?: number;
  created_at: string;
  updated_at?: string;
}

export interface InvoiceDetail {
  id: number;
  factura_id: number;
  producto_id: number;
  producto_nombre: string;
  cantidad: number;
  precio_unitario: number;
  itbis?: number;
  subtotal: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}

export interface Settings {
  id: number;
  nombre_empresa: string;
  rnc: string;
  telefono: string;
  email: string;
  direccion: string;
  tasa_dolar: number;
  tipo_impresora: 'fiscal' | 'normal';
  logo_url?: string;
  created_at?: string;
  updated_at?: string;
}