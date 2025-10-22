interface Event {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

export default function SystemEvents({ events }: { events: Event[] }) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-md overflow-y-auto">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        System Events
      </h3>
      <ul className="space-y-3 max-h-[400px] overflow-y-auto">
        {events.map((e) => (
          <li
            key={e.id}
            className="border-b last:border-none pb-2 text-sm text-gray-700"
          >
            <div className="font-medium">{e.type}</div>
            <div className="text-gray-500">{e.message}</div>
            <div className="text-xs text-gray-400">
              {new Date(e.timestamp).toLocaleString()}
            </div>
          </li>
        ))}
        {!events.length && (
          <p className="text-gray-500 text-sm">No recent events found.</p>
        )}
      </ul>
    </div>
  );
}
