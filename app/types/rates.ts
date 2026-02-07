export type CareerEventType = 'start' | 'annual_raise' | 'known_rate' | 'mid_year_raise' | 'promotion' | 'raise';

export interface CareerEvent {
  type: CareerEventType;
  date: string;
  rate: number;
  roleTitle?: string;
  note?: string;
}

export interface BonusRule {
  year: number;
  amount: number;
  months?: number[];
}

export interface Person {
  id: number;
  name: string;
  color: string;
  startDate: string;
  careerEvents: CareerEvent[];
  bonuses?: BonusRule[];
}

export interface RatesMeta {
  hoursPerDay: number;
  workingDaysPerYear: number;
  marketCeilingRate: number;
}

export interface RatesData {
  meta: RatesMeta;
  people: Person[];
}
