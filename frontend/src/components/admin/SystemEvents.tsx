import type { SystemEvent } from "@/types/SystemEvent";

export default function SystemEvents({ events }: { events: SystemEvent[] }) {
  return (
    <div>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="p-2 border border-purple-500">Type</th>
            <th className="p-2 border border-purple-500">Message</th>
            <th className="p-2 border border-purple-500">Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td className="p-2 border">{e.type}</td>
              <td className="p-2 border">{e.message}</td>
              <td className="p-2 border">
                {new Date(e.timestamp).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
