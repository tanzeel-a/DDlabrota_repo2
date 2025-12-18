import { getData } from '@/lib/store';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TaskHistoryPage({ params }: { params: Promise<{ name: string }> }) {
    const { name } = await params;
    const decodedName = decodeURIComponent(name);
    const data = await getData();

    const history = data.history
        .filter(entry => entry.taskName === decodedName)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="min-h-screen bg-white text-black font-sans p-8">
            <header className="mb-8">
                <Link href="/" className="text-gray-500 hover:text-black mb-4 inline-block">← Back to Dashboard</Link>
                <h1 className="text-3xl font-bold">{decodedName}</h1>
                <p className="text-gray-500">Completion Log</p>
            </header>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="p-4 font-semibold text-sm">Date</th>
                            <th className="p-4 font-semibold text-sm">Time</th>
                            <th className="p-4 font-semibold text-sm">Completed By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="p-8 text-center text-gray-500">No history found for this task.</td>
                            </tr>
                        ) : (
                            history.map((entry, i) => {
                                const date = new Date(entry.timestamp);
                                return (
                                    <tr key={i} className="border-b border-gray-100 last:border-0">
                                        <td className="p-4">{date.toLocaleDateString()}</td>
                                        <td className="p-4">{date.toLocaleTimeString()}</td>
                                        <td className="p-4 text-gray-600">{entry.people.join(', ')}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
