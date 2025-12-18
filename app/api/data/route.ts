import { NextResponse } from 'next/server';
import { getData, saveData, DBData } from '@/lib/store';

export async function GET() {
    try {
        const data = getData();
        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const currentData = getData();

        // Merge updates
        const newData: DBData = {
            ...currentData,
            ...body
        };

        saveData(newData);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
