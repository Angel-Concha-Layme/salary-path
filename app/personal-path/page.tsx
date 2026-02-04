import { PathDashboard } from '../components/path/path-dashboard';
import { getPathData } from '../lib/data-sources/path-source';

export default function MyPathPage() {
  const pathData = getPathData();

  return <PathDashboard initialData={pathData} />;
}
