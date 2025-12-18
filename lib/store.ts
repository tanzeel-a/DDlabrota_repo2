import fs from 'fs';
import path from 'path';
import clientPromise from './mongodb';

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
    // Check if MongoDB is configured
    if (process.env.MONGODB_URI) {
        try {
            const client = await clientPromise;
            const db = client.db('lab_task_manager');
            const collection = db.collection('app_data');

            const data = await collection.findOne({ _id: 'main' });

            if (data) {
                // Remove MongoDB _id field before returning
                const { _id, ...cleanData } = data;
                return cleanData as DBData;
            }

            // If no data in MongoDB yet, seed it from local file
            const initial = getInitialData();
            await collection.insertOne({ _id: 'main', ...initial });
            return initial;
        } catch (error) {
            console.error("MongoDB Error:", error);
            return getInitialData();
        }
    }

    // Local File Fallback (for development without MongoDB)
    return getInitialData();
}

export async function saveData(data: DBData) {
    // MongoDB
    if (process.env.MONGODB_URI) {
        try {
            const client = await clientPromise;
            const db = client.db('lab_task_manager');
            const collection = db.collection('app_data');

            await collection.updateOne(
                { _id: 'main' },
                { $set: data },
                { upsert: true }
            );
            return;
        } catch (error) {
            console.error("MongoDB Save Error:", error);
            throw error;
        }
    }

    // Local File Fallback
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
