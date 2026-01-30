import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import AdminNavbar from "../components/AdminNavbar";
import { apiGetMissions, apiCreateMission, apiDeleteMission, apiUpdateMission } from "../utils/api";

export default function AdminMissions(){
  const [missions, setMissions] = useState([]);
  const [title, setTitle] = useState("");

  useEffect(()=> { (async ()=> setMissions(await apiGetMissions()) )(); }, []);

  const create = async () => {
    const m = await apiCreateMission({ title, description:"admin created", type:"phishing", difficulty:"easy", rewardPoints:10, questions:[] });
    setMissions(prev => [m, ...prev]); setTitle("");
  };

  return (
    <>
      <AdminNavbar />
      <div style={{ paddingTop: 72, display:"flex" }}>
        <Sidebar />
        <div style={{ padding:12, flex:1 }}>
          <h2>Missions</h2>
          <div className="mb-3">
            <input className="form-control" placeholder="Mission title" value={title} onChange={e=>setTitle(e.target.value)} />
            <button className="btn btn-primary mt-2" onClick={create}>Add Mission</button>
          </div>

          {missions.map(m => (
            <div className="card mb-2 p-2" key={m._id}>
              <div className="d-flex justify-content-between">
                <div><b>{m.title}</b> — {m.difficulty}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
