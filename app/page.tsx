import { getData } from '@/lib/store';
import Dashboard from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const data = await getData();
  return <Dashboard initialData={data} />;
}
