import { Outlet } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar />

      <main className="flex-1 p-6 md:p-10 overflow-y-auto bg-white">
        <Outlet /> {/* This is where nested routes render */}
      </main>
    </div>
  );
}
