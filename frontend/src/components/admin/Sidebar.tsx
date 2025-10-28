import { NavLink } from "react-router-dom";
import { Users, FileText, CalendarDays } from "lucide-react";

export default function Sidebar() {
  const linkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
      isActive
        ? "bg-purple-800 text-white"
        : "text-gray-800 hover:bg-purple-700 hover:text-white"
    }`;

  return (
    <div className="h-screen shadow-xl rounded w-64 bg-purple-100 text-white flex flex-col p-4 shadow-xl">
      <h2 className="text-xl text-gray-800 text-center font-semibold mb-8">
        Admin Dashboard
      </h2>
      <nav className="flex flex-col gap-3">
        <NavLink to="/admin/events" className={linkClasses}>
          <CalendarDays size={20} /> System Events
        </NavLink>

        <NavLink to="/admin/registeredUsers" className={linkClasses}>
          <Users size={20} /> Customers
        </NavLink>

        <NavLink to="/admin/auditTrail" className={linkClasses}>
          <FileText size={20} /> Audit Trail
        </NavLink>
      </nav>

      <div className="mt-auto text-sm text-purple-900 text-center">
        © {new Date().getFullYear()} SecureBank Admin
      </div>
    </div>
  );
}
