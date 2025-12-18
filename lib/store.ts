import fs from 'fs';
import path from 'path';
import { get } from '@vercel/edge-config';

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
    // Check if Edge Config is available
    if (process.env.EDGE_CONFIG) {
        try {
            const data = await get<DBData>('lab_data');
            if (data) {
                return data;
            }
            // If no data in Edge Config yet, return initial data
            return getInitialData();
        } catch (error) {
            console.error("Edge Config Error:", error);
            return getInitialData();
        }
    }

    // Local File Fallback (for development)
    return getInitialData();
}

export async function saveData(data: DBData) {
    // Note: Edge Config is read-only from the app
    // We need to use the Vercel API to update it
    if (process.env.EDGE_CONFIG && process.env.VERCEL_API_TOKEN) {
        try {
            const edgeConfigId = process.env.EDGE_CONFIG.split('/').pop()?.split('?')[0];

            const response = await fetch(
                `https://api.vercel.com/v1/edge-config/${edgeConfigId}/items`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${process.env.VERCEL_API_TOKEN}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        items: [
                            {
                                operation: 'upsert',
                                key: 'lab_data',
                                value: data,
                            },
                        ],
                    }),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to update Edge Config');
            }
            return;
        } catch (error) {
            console.error("Edge Config Save Error:", error);
            // Fall back to local file
        }
    }

    // Local File Fallback
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
