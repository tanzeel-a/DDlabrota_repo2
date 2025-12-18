import { NextResponse } from 'next/server';
import { getData } from '@/lib/store';

export async function GET() {
    try {
        const data = await getData();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        // We need to import saveData dynamically or just import it at top level
        // (It's already imported in the file, just need to use it)
        const { getData, saveData } = await import('@/lib/store');

        const currentData = await getData();

        // Merge updates
        const newData = {
            ...currentData,
            ...body
        };

        await saveData(newData);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
