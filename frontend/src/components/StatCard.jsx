import React from "react";

export default function StatCard({ title, value }) {
  return (
    <div className="p-3 border rounded bg-dark text-light">
      <h6>{title}</h6>
      <h3>{value}</h3>
    </div>
  );
}
