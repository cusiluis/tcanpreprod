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
  user: string;
  action: string;
  amount?: number;
  currency?: string;
  status: 'pagado' | 'pendiente' | 'completado';
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
