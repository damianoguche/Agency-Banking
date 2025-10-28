import { useEffect, useState } from "react";
import UsersList from "../../components/admin/UsersList.tsx";
import axios from "axios";
import { User } from "@/types/User.js";
import { useAuth } from "@/hooks/useAuth.tsx";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const API = import.meta.env.VITE_ADM_API_BASE;
  const { token } = useAuth();

  const fetchUsers = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API}/customers`, { headers });

      const data = Array.isArray(res.data.customers) ? res.data.customers : [];
      setUsers(data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  return (
    <div>
      <UsersList users={users} refresh={fetchUsers} />
    </div>
  );
}
