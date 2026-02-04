import { SalaryDashboard } from '../components/salary-dashboard';
import { getComparisonRatesData } from '../lib/data-sources/comparison-source';

export default function ComparisonPage() {
  const ratesData = getComparisonRatesData();

  return <SalaryDashboard initialData={ratesData} />;
}
