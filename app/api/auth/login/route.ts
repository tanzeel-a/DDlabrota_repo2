import { NextResponse } from 'next/server';
import { getData } from '@/lib/store';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { name, password } = await request.json();

        if (password !== 'DDLAB') {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const data = getData();
        // Check if name is in any roster or the custom roster
        // We can check the customRoster first, or iterate through all tasks.
        // The user said "authenticate if the user is someone from the roster".
        // Let's check the customRoster (Standard Team) + any unique names in tasks.

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
