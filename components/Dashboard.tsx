'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Menu, Check } from 'lucide-react';
import { DBData, Task, TaskState } from '@/lib/store';

interface DashboardProps {
    initialData: DBData;
}

export default function Dashboard({ initialData }: DashboardProps) {
    const [data, setData] = useState<DBData>(initialData);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [rosterText, setRosterText] = useState(initialData.customRoster.join(', '));
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedPerson, setSelectedPerson] = useState<string | null>(null);
    const router = useRouter();

    // Sync roster text if data changes
    useEffect(() => {
        setRosterText(data.customRoster.join(', '));
    }, [data.customRoster]);

    const saveData = async (newData: Partial<DBData>) => {
        // Optimistic update
        const updated = { ...data, ...newData };
        setData(updated);

        try {
            await fetch('/api/data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newData),
            });
        } catch (error) {
            console.error('Failed to save data', error);
        }
    };

    const handleDragStart = (e: React.DragEvent, person: string) => {
        e.dataTransfer.setData('text/plain', person);
        e.dataTransfer.effectAllowed = 'copy';
        setSelectedPerson(person); // Also select on drag
    };

    const assignPerson = (taskIndex: number, personName: string, type: 'blue' | 'red') => {
        const task = data.tasks[taskIndex];
        const personIndex = task.roster.indexOf(personName);

        if (personIndex === -1) {
            alert(`"${personName}" is not in the roster for this task.`);
            return;
        }

        const newState = { ...data.state };
        const currentTaskState = { ...newState[taskIndex] };

        if (type === 'blue') {
            if (currentTaskState.currentIndex === personIndex) return;
            if (!currentTaskState.extras.includes(personIndex)) {
                currentTaskState.extras = [...currentTaskState.extras, personIndex];
            }
            currentTaskState.skips = currentTaskState.skips.filter(i => i !== personIndex);
        } else {
            if (!currentTaskState.skips.includes(personIndex)) {
                currentTaskState.skips = [...currentTaskState.skips, personIndex];
            }
            currentTaskState.extras = currentTaskState.extras.filter(i => i !== personIndex);
            if (currentTaskState.currentIndex === personIndex) {
                // Advance
                let nextIndex = (currentTaskState.currentIndex + 1) % task.roster.length;
                let attempts = 0;
                while (currentTaskState.skips.includes(nextIndex) && attempts < task.roster.length) {
                    currentTaskState.skips = currentTaskState.skips.filter(i => i !== nextIndex);
                    nextIndex = (nextIndex + 1) % task.roster.length;
                    attempts++;
                }
                currentTaskState.currentIndex = nextIndex;
            }
        }

        newState[taskIndex] = currentTaskState;
        saveData({ state: newState });
        setSelectedPerson(null); // Clear selection after assignment
    };

    const handleDrop = (e: React.DragEvent, taskIndex: number, type: 'blue' | 'red') => {
        e.preventDefault();
        const personName = e.dataTransfer.getData('text/plain');
        assignPerson(taskIndex, personName, type);
    };

    const handleCellClick = (taskIndex: number, type: 'blue' | 'red') => {
        if (selectedPerson) {
            assignPerson(taskIndex, selectedPerson, type);
        }
    };

    const removeExtra = (taskIndex: number, personIndex: number) => {
        const newState = { ...data.state };
        newState[taskIndex].extras = newState[taskIndex].extras.filter(i => i !== personIndex);
        saveData({ state: newState });
    };

    const removeSkip = (taskIndex: number, personIndex: number) => {
        const newState = { ...data.state };
        newState[taskIndex].skips = newState[taskIndex].skips.filter(i => i !== personIndex);
        saveData({ state: newState });
    };

    const markDone = (taskIndex: number) => {
        const task = data.tasks[taskIndex];
        const taskState = data.state[taskIndex];

        const currentPerson = task.roster[taskState.currentIndex];
        const extraPeople = taskState.extras.map(i => task.roster[i]);
        const allDoers = [currentPerson, ...extraPeople];

        const timestamp = new Date().toISOString();
        const newHistoryEntry = {
            taskName: task.name,
            people: allDoers,
            timestamp: timestamp
        };

        const newState = { ...data.state };
        const currentTaskState = { ...newState[taskIndex] };

        // Clear extras
        currentTaskState.extras = [];

        // Advance
        let nextIndex = (currentTaskState.currentIndex + 1) % task.roster.length;
        let attempts = 0;
        while (currentTaskState.skips.includes(nextIndex) && attempts < task.roster.length) {
            currentTaskState.skips = currentTaskState.skips.filter(i => i !== nextIndex);
            nextIndex = (nextIndex + 1) % task.roster.length;
            attempts++;
        }
        currentTaskState.currentIndex = nextIndex;

        newState[taskIndex] = currentTaskState;

        saveData({
            state: newState,
            history: [...data.history, newHistoryEntry]
        });
    };

    const saveRoster = () => {
        const newRoster = rosterText.split(',').map(s => s.trim()).filter(s => s.length > 0);
        if (newRoster.length === 0) {
            alert("Roster cannot be empty");
            return;
        }

        const logEntry = {
            timestamp: new Date().toISOString(),
            details: `Roster updated. New count: ${newRoster.length}. Names: ${newRoster.join(', ')}`
        };

        const specialTasks = ["200ul tip filling", "10ul tip filling", "Thrombin", "FPLC column wash with 0.5M NaOH (once/month)", "Computer area cleaning"];

        const newTasks = data.tasks.map(t => {
            if (!specialTasks.includes(t.name)) {
                return { ...t, roster: newRoster };
            }
            return t;
        });

        saveData({
            customRoster: newRoster,
            rosterHistory: [...data.rosterHistory, logEntry],
            tasks: newTasks
        });

        alert("Roster saved!");
    };

    const allPeople = Array.from(new Set(data.tasks.flatMap(t => t.roster))).sort();

    return (
        <div className="flex h-screen overflow-hidden bg-white text-black font-sans">
            {/* Sidebar */}
            <aside
                className={`bg-gray-100 border-r border-gray-200 flex flex-col transition-all duration-300 z-20 ${sidebarCollapsed ? 'w-0 p-0 opacity-0 overflow-hidden' : 'w-64 p-5 absolute md:relative h-full shadow-xl md:shadow-none'
                    }`}
            >
                <div className="flex justify-between items-center mb-5">
                    <div>
                        <h2 className="text-lg font-bold">Team Roster</h2>
                        <p className="text-xs text-gray-500">Tap to select or Drag</p>
                    </div>
                    <button onClick={() => setSidebarCollapsed(true)} className="text-gray-500 hover:text-black">
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto space-y-2 pb-20">
                    {allPeople.map(person => (
                        <div
                            key={person}
                            draggable
                            onDragStart={(e) => handleDragStart(e, person)}
                            onClick={() => setSelectedPerson(selectedPerson === person ? null : person)}
                            className={`p-2 rounded border cursor-pointer transition-all flex justify-between items-center ${selectedPerson === person
                                    ? 'bg-black text-white border-black shadow-md'
                                    : 'bg-white border-gray-200 hover:border-black hover:shadow-sm'
                                }`}
                        >
                            <span>{person}</span>
                            {selectedPerson === person && <Check size={16} />}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="p-4 md:p-6 border-b border-gray-100 flex items-center gap-4 bg-white z-10">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Menu size={16} /> {sidebarCollapsed ? 'Show Roster' : 'Hide'}
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl md:text-2xl font-bold">Lab Task Manager</h1>
                        <p className="text-xs md:text-sm text-gray-500">
                            {selectedPerson
                                ? `Selected: ${selectedPerson} (Tap a box to assign)`
                                : "Tap a name to select, then tap a box to assign."}
                        </p>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6">
                    <div className="border border-gray-200 rounded-lg overflow-x-auto mb-8">
                        <table className="w-full min-w-[800px] border-collapse">
                            <thead>
                                <tr className="bg-white border-b-2 border-gray-100">
                                    <th className="p-4 text-left font-semibold text-sm w-1/4">Task</th>
                                    <th className="p-4 text-left font-semibold text-sm w-1/4">Next In Charge (Blue)</th>
                                    <th className="p-4 text-left font-semibold text-sm w-1/4">Skipped (Red)</th>
                                    <th className="p-4 text-left font-semibold text-sm w-1/4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.tasks.map((task, index) => {
                                    const state = data.state[index];
                                    const currentPerson = task.roster[state.currentIndex];

                                    return (
                                        <tr key={index} className="border-b border-gray-100 last:border-0">
                                            <td className="p-4">
                                                <Link href={`/task/${encodeURIComponent(task.name)}`} className="hover:text-blue-700 hover:underline font-medium">
                                                    {task.name}
                                                </Link>
                                            </td>

                                            {/* Blue Zone */}
                                            <td
                                                className={`p-4 transition-colors cursor-pointer ${selectedPerson ? 'hover:bg-blue-50 ring-inset hover:ring-2 ring-blue-200' : ''}`}
                                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-blue-50'); }}
                                                onDragLeave={(e) => { e.currentTarget.classList.remove('bg-blue-50'); }}
                                                onDrop={(e) => { e.currentTarget.classList.remove('bg-blue-50'); handleDrop(e, index, 'blue'); }}
                                                onClick={() => handleCellClick(index, 'blue')}
                                            >
                                                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm font-semibold mr-2 mb-1">
                                                    {currentPerson}
                                                </span>
                                                {state.extras.map(extraIndex => (
                                                    <span key={extraIndex} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-900 rounded-full text-sm border border-dashed border-blue-900 mr-2 mb-1">
                                                        {task.roster[extraIndex]}
                                                        <button onClick={(e) => { e.stopPropagation(); removeExtra(index, extraIndex); }} className="ml-1 hover:text-red-600">×</button>
                                                    </span>
                                                ))}
                                            </td>

                                            {/* Red Zone */}
                                            <td
                                                className={`p-4 transition-colors cursor-pointer ${selectedPerson ? 'hover:bg-red-50 ring-inset hover:ring-2 ring-red-200' : ''}`}
                                                onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-red-50'); }}
                                                onDragLeave={(e) => { e.currentTarget.classList.remove('bg-red-50'); }}
                                                onDrop={(e) => { e.currentTarget.classList.remove('bg-red-50'); handleDrop(e, index, 'red'); }}
                                                onClick={() => handleCellClick(index, 'red')}
                                            >
                                                {state.skips.length === 0 ? (
                                                    <span className="text-gray-400 text-sm">-</span>
                                                ) : (
                                                    state.skips.map(skipIndex => (
                                                        <span key={skipIndex} className="inline-flex items-center px-3 py-1 bg-red-100 text-red-900 rounded-full text-sm mr-2 mb-1">
                                                            {task.roster[skipIndex]}
                                                            <button onClick={(e) => { e.stopPropagation(); removeSkip(index, skipIndex); }} className="ml-1 hover:text-red-600">×</button>
                                                        </span>
                                                    ))
                                                )}
                                            </td>

                                            <td className="p-4">
                                                <button
                                                    onClick={() => markDone(index)}
                                                    className="px-3 py-1 bg-black text-white rounded-full text-sm font-semibold hover:scale-105 transition-transform"
                                                >
                                                    Mark Done
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Roster Editor */}
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mt-auto">
                        <h3 className="font-semibold mb-2">Roster Configuration</h3>
                        <textarea
                            value={rosterText}
                            onChange={(e) => setRosterText(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded mb-4 text-sm font-sans"
                            rows={4}
                        />
                        <div className="flex gap-3 flex-wrap">
                            <button
                                onClick={saveRoster}
                                className="px-4 py-2 bg-blue-900 text-white rounded hover:bg-blue-800 text-sm font-semibold"
                            >
                                Save Roster
                            </button>
                            <button
                                onClick={() => setShowHistoryModal(true)}
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm font-semibold"
                            >
                                View Change Log
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* History Modal */}
            {showHistoryModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowHistoryModal(false)}>
                    <div className="bg-white p-6 rounded-lg w-full max-w-lg max-h-[80vh] overflow-y-auto m-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Roster Change Log</h2>
                            <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-black text-2xl">×</button>
                        </div>
                        <div className="space-y-4">
                            {data.rosterHistory.length === 0 ? (
                                <p className="text-gray-500">No changes recorded.</p>
                            ) : (
                                [...data.rosterHistory].reverse().map((entry, i) => (
                                    <div key={i} className="border-b border-gray-100 pb-2">
                                        <div className="text-xs font-semibold text-gray-500">
                                            {new Date(entry.timestamp).toLocaleString()}
                                        </div>
                                        <div className="text-sm">{entry.details}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
