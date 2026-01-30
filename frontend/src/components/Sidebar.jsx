import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar(){
  return (
    <div style={{ width: 240, background: "#0b1220", color:"#fff", minHeight:"100vh", padding:16 }}>
      <h4>Admin</h4>
      <ul style={{ listStyle:"none", padding:0 }}>
        <li><Link to="/admin" style={{ color:"#fff" }}>Dashboard</Link></li>
        <li><Link to="/admin/missions" style={{ color:"#fff" }}>Missions</Link></li>
        <li><Link to="/admin/users" style={{ color:"#fff" }}>Users</Link></li>
      </ul>
    </div>
  );
}
