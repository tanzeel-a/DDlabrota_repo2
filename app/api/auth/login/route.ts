import { NextResponse } from 'next/server';
import { getData } from '@/lib/store';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        const data = await getData();

        const allPeople = new Set<string>();
        data.customRoster.forEach(p => allPeople.add(p));
        data.tasks.forEach(t => t.roster.forEach(p => allPeople.add(p)));

        if (!allPeople.has(name)) {
            return NextResponse.json({ error: 'Name not found in roster' }, { status: 401 });
        }

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set('auth_session', name, {
            httpOnly: true,
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Login failed' }, { status: 500 });
    }
}
