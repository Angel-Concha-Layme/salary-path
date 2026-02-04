export type CompensationUnit = 'hourly' | 'monthly';

export type PathEventType =
  | 'start'
  | 'raise'
  | 'annual_raise'
  | 'mid_year_raise'
  | 'promotion'
  | 'company_change'
  | 'known_compensation';

export interface CompanyEvent {
  type: PathEventType;
  date: string;
  amount: number;
  title?: string;
  note?: string;
}

export interface CompanyRecord {
  id: number;
  name: string;
  color: string;
  personalScore: number;
  startDate: string;
  endDate?: string;
  compensationUnit: CompensationUnit;
  monthlyHours?: number;
  events: CompanyEvent[];
}

export interface PathProfile {
  id: number;
  name: string;
  companies: CompanyRecord[];
}

export interface PathMeta {
  hoursPerDay: number;
  workingDaysPerYear: number;
  defaultMonthlyHours: number;
  currency: string;
}

export interface PathData {
  meta: PathMeta;
  profile: PathProfile;
}
