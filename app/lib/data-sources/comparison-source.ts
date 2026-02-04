import ratesData from '../../../data/rates.json';
import type { RatesData } from '../../types/rates';

export function getComparisonRatesData(): RatesData {
  return ratesData as RatesData;
}
