import Dashboard from '@/components/Dashboard';

// Mock data for frontend-only application
const mockData = {
  customRoster: [
    "Alice", "Bob", "Charlie", "Diana", "Eve",
    "Frank", "Grace", "Henry", "Ivy", "Jack"
  ],
  tasks: [
    {
      name: "200ul tip filling",
      roster: ["Alice", "Bob", "Charlie"]
    },
    {
      name: "10ul tip filling",
      roster: ["Diana", "Eve", "Frank"]
    },
    {
      name: "Thrombin",
      roster: ["Grace", "Henry", "Ivy"]
    },
    {
      name: "FPLC column wash with 0.5M NaOH (once/month)",
      roster: ["Jack", "Alice", "Bob"]
    },
    {
      name: "Computer area cleaning",
      roster: ["Charlie", "Diana", "Eve"]
    },
    {
      name: "Weekly maintenance",
      roster: ["Frank", "Grace", "Henry"]
    }
  ],
  state: {
    "0": { currentIndex: 0, extras: [], skips: [] },
    "1": { currentIndex: 1, extras: [], skips: [] },
    "2": { currentIndex: 2, extras: [], skips: [] },
    "3": { currentIndex: 0, extras: [], skips: [] },
    "4": { currentIndex: 1, extras: [], skips: [] },
    "5": { currentIndex: 2, extras: [], skips: [] }
  },
  history: [],
  rosterHistory: []
};

export default function Home() {
  return <Dashboard initialData={mockData} />;
}
