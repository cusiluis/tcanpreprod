export interface StatCard {
  id: string;
  title: string;
  value: number | string;
  icon: string;
  color: string;
  trend?: number;
  trendDirection?: 'up' | 'down';
  unit?: string;
}

export interface Activity {
  id: string;
  date: string;
  time: string;
  user: string; // Proveedor
  client?: string; // Nuevo: cliente asociado al pago
  action: string;
  amount?: number;
  currency?: string;
  paymentStatus?: 'PAGADO' | 'POR_PAGAR' | string; // Nuevo: estado de pago
  verified?: boolean; // Nuevo: flag de verificación cruda
  status: 'completado' | 'sin-verificacion'; // Mantiene estado derivado para compatibilidad
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  route: string;
  badge?: number;
  children?: MenuItem[];
  translationKey?: string;
}

export interface DashboardData {
  stats: StatCard[];
  activities: Activity[];
}
