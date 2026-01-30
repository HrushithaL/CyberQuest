import React from "react";
import Navbar from "../components/Navbar";

export default function Simulation(){
  return (
    <>
      <Navbar />
      <div className="container py-4">
        <h3>AI Simulation</h3>
        <p>Simulation area — when AI engine is ready, this page will host real-time generated scenarios and visualizations.</p>
      </div>
    </>
  );
}
