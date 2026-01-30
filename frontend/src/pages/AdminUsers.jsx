import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import AdminNavbar from "../components/AdminNavbar";
import { apiGetUsers } from "../utils/api";

export default function AdminUsers(){
  const [users, setUsers] = useState([]);
  useEffect(()=> {
    (async ()=> {
      setUsers(await apiGetUsers());
    })();
  }, []);
  return (
    <>
      <AdminNavbar />
      <div style={{ paddingTop: 72, display:"flex" }}>
        <Sidebar />
        <div style={{ padding:12, flex:1 }}>
          <h2>Users</h2>
          {users.map(u => (
            <div key={u._id} style={{ border:"1px solid #eee", padding:8, marginBottom:8 }}>
              <b>{u.name}</b> — {u.email} — {u.score} pts — {u.role === "admin" ? "Admin" : "User"}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
