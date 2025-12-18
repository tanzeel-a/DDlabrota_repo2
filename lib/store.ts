import fs from 'fs';
import path from 'path';
import { kv } from '@vercel/kv';

const DB_PATH = path.join(process.cwd(), 'db.json');

export interface Task {
    name: string;
    roster: string[];
}

export interface TaskState {
    currentIndex: number;
    skips: number[];
    extras: number[];
}

export interface HistoryEntry {
    taskName: string;
    people: string[];
    timestamp: string;
}

export interface RosterHistoryEntry {
    timestamp: string;
    details: string;
}

export interface DBData {
    tasks: Task[];
    state: Record<string, TaskState>;
    history: HistoryEntry[];
    rosterHistory: RosterHistoryEntry[];
    customRoster: string[];
}

// Helper to get initial data from local file
function getInitialData(): DBData {
    if (fs.existsSync(DB_PATH)) {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
    return { tasks: [], state: {}, history: [], rosterHistory: [], customRoster: [] };
}

export async function getData(): Promise<DBData> {
    // Check if Vercel KV is configured
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        try {
            const data = await kv.get<DBData>('lab_data');
            if (data) {
                return data;
            }
            // If no data in KV yet, seed it from local file
            const initial = getInitialData();
            await kv.set('lab_data', initial);
            return initial;
        } catch (error) {
            console.error("KV Error:", error);
            return getInitialData();
        }
    }

    // Local File Fallback (for development)
    return getInitialData();
}

export async function saveData(data: DBData) {
    // Vercel KV
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        await kv.set('lab_data', data);
        return;
    }

    // Local File Fallback
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
