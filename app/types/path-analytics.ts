import type { CompensationUnit, PathEventType } from './path';

export type PathMetricMode = 'normalized_rate' | 'income';

export interface PathSeriesPoint {
  time: string;
  value: number;
  label: string;
}

export interface PathAnnotation {
  time: string;
  eventType: PathEventType;
  eventDate: string;
  amount: number;
  normalizedHourly: number;
  fromAmount: number | null;
  fromNormalizedHourly: number | null;
  title?: string;
  note?: string;
}

export interface PathCompanySeries {
  companyId: number;
  companyName: string;
  color: string;
  compensationUnit: CompensationUnit;
  metric: PathMetricMode;
  points: PathSeriesPoint[];
  annotations: PathAnnotation[];
  normalizationEstimated: boolean;
  monthlyHoursUsed: number | null;
}

export interface CompanyComparisonRow {
  companyId: number;
  companyName: string;
  color: string;
  compensationUnit: CompensationUnit;
  startDate: string;
  endDate: string;
  startAmount: number | null;
  endAmount: number | null;
  growthAbsolute: number | null;
  growthPercent: number | null;
  startNormalizedHourly: number | null;
  endNormalizedHourly: number | null;
  growthAbsoluteNormalizedHourly: number | null;
  totalIncome: number | null;
  tenureDays: number;
  personalScore: number;
  normalizationEstimated: boolean;
  monthlyHoursUsed: number | null;
}

export interface PathDashboardAnalytics {
  profileName: string;
  rows: CompanyComparisonRow[];
  series: PathCompanySeries[];
  cutoffDate: string;
  hasEstimatedNormalization: boolean;
}
