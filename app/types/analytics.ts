import type { CareerEventType } from './rates';

export type ComparisonMode = 'calendar' | 'tenure';
export type MetricMode = 'rate' | 'income';
export type UiLanguage = 'es' | 'en';

export interface ChartPoint {
  time: string;
  value: number;
  dayIndex: number;
  label: string;
}

export interface RateAnnotation {
  time: string;
  dayIndex: number;
  reasonType: CareerEventType;
  fromRate: number | null;
  toRate: number;
  effectiveDate: string;
  isRateIncrease: boolean;
}

export interface PersonSeries {
  personId: number;
  personName: string;
  color: string;
  metric: MetricMode;
  points: ChartPoint[];
  annotations: RateAnnotation[];
  hasHistoricalIncome: boolean;
}

export interface PersonKpi {
  personId: number;
  personName: string;
  currentRate: number;
  totalIncome: number | null;
  annualBonus: number;
  monthlyBonusEquivalent: number;
  bonusesAppliedToSalary: boolean;
  gapToMarket: number;
  tenureDays: number;
  lastEventDate: string;
  hasHistoricalIncome: boolean;
}

export type ComparisonRow = PersonKpi;

export interface DashboardAnalytics {
  kpis: PersonKpi[];
  comparisonRows: ComparisonRow[];
  series: PersonSeries[];
  commonTenureDays: number | null;
}
