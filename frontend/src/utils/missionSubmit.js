import { apiSubmitMission, apiGetUserProfile, apiGetMissionById, apiAutosaveMission } from "./api";

// Simple submit helper
export async function submitMission(payload) {
  try {
    const res = await apiSubmitMission(payload);
    return { ok: true, res };
  } catch (err) {
    console.error("submitMission error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

// Autosave helper
export async function autosaveMission(payload) {
  try {
    const res = await apiAutosaveMission(payload);
    return { ok: true, res };
  } catch (err) {
    console.error("autosaveMission error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}

// Submit + notify app (NO AUTH MUTATION)
export async function submitMissionAndRefresh(payload) {
  try {
    const res = await apiSubmitMission(payload);

    // Optional profile refresh (read-only)
    try {
      await apiGetUserProfile();
    } catch (err) {
      console.error("Profile refresh failed:", err);
    }

    // Notify listeners (Dashboard, Missions)
    window.dispatchEvent(new Event("missionsRefresh"));

    // If possible, fetch updated mission data so UI can reflect stored progress
    let mission = null;
    try {
      if (payload && payload.missionId) {
        mission = await apiGetMissionById(payload.missionId);
      }
    } catch (err) {
      console.error("Failed to fetch mission after submit:", err);
    }

    return { ok: true, res, mission };
  } catch (err) {
    console.error("submitMissionAndRefresh error:", err);
    return { ok: false, error: err?.message || String(err) };
  }
}
