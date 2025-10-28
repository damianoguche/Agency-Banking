import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../../hooks/useAuth";
import { User } from "@/types/User";

export default function UsersList({
  users,
  refresh
}: {
  users: User[];
  refresh: () => void;
}) {
  const { token } = useAuth();
  const API = import.meta.env.ADM_VITE_API_BASE;

  async function changeRole(id: string, role: string) {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`${API}/customers/${id}/role`, { role }, { headers });
      toast.success("Role updated");
      refresh();
    } catch {
      toast.error("Failed to update role");
    }
  }

  return (
    <div className="rounded-xl bg-purple-50 p-6 shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">Customers</h3>
      <div className="overflow-x-auto rounded">
        <table className="w-full text-sm">
          <thead className="bg-purple-800 text-white uppercase text-xs">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-purple-500 last:border-none"
              >
                <td className="p-3">{u.name}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3 capitalize">{u.role}</td>
                <td
                  className={`p-3 font-medium ${
                    u.status === "active" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {u.status}
                </td>
                <td className="p-3">
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u.id, e.target.value)}
                    className="border border-purple-500 rounded px-2 py-1"
                  >
                    <option value="user">User</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!users.length && (
          <p className="text-gray-500 text-sm mt-2">No users found.</p>
        )}
      </div>
    </div>
  );
}
