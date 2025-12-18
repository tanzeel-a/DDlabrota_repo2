import fs from 'fs';
import path from 'path';

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

function getInitialData(): DBData {
    if (fs.existsSync(DB_PATH)) {
        return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
    }
    return { tasks: [], state: {}, history: [], rosterHistory: [], customRoster: [] };
}

export async function getData(): Promise<DBData> {
    return getInitialData();
}

export async function saveData(data: DBData) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}
