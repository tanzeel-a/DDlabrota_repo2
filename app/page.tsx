import { getData } from '@/lib/store';
import Dashboard from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

export default function Home() {
  const data = getData();
  return <Dashboard initialData={data} />;
}
