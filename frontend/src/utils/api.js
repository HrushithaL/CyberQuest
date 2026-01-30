import axios from "axios";

const API = "http://localhost:5000/api";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Create axios instance with default headers
const createAxiosInstance = () => {
  const token = getToken();
  return axios.create({
    baseURL: API,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json"
    }
  });
};

/* ---------------- AUTH ---------------- */

export const apiLogin = async (data) => {
  const res = await axios.post(`${API}/auth/login`, data);
  return res.data;
};

export const apiRegister = async (data) => {
  const res = await axios.post(`${API}/auth/register`, data);
  return res.data;
};

export const apiGetUserProfile = async () => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.get(`/auth/profile`);
  return res.data;
};

export const apiUpdateUserProfile = async (data) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.put(`/auth/profile`, data);
  return res.data;
};

/* ---------------- MISSIONS ---------------- */

export const apiGetMissions = async () => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.get(`/missions`);
  return res.data;
};

export const apiGetMissionById = async (id) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.get(`/missions/${id}`);
  return res.data;
};

export const apiGenerateMission = async (data) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/missions/generate`, data);
  return res.data;
};

export const apiCreateMission = async (data) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/missions/create`, data);
  return res.data;
};

export const apiDeleteMission = async (id) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.delete(`/missions/${id}`);
  return res.data;
};

/* ---------------- USERS (Admin) ---------------- */

export const apiGetUsers = async () => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.get(`/admin/users`);
  return res.data;
};

/* ---------------- LEADERBOARD ---------------- */

export const apiGetLeaderboard = async () => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.get(`/leaderboard`);
  return res.data;
};

/* ---------------- SUBMISSIONS ---------------- */

export const apiSubmitMission = async (data) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/missions/submit`, data);
  return res.data;
};

// Autosave mission progress (draft save, does not award points)
export const apiAutosaveMission = async (data) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/missions/autosave`, data);
  return res.data;
};

export const apiEvaluateChallenge = async (data, options = { force: false }) => {
  const axiosInstance = createAxiosInstance();
  // Only set force when explicitly requested via options to avoid unnecessary AI calls
  const res = await axiosInstance.post(`/missions/evaluate-challenge`, { ...data, force: options.force === true });
  return res.data;
};

export const apiValidateSection = async (data) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/missions/validate-section`, data);
  return res.data;
};

export const apiUpdateUserPoints = async (data) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/progress/update-points`, data);
  return res.data;
};

/* ---------------- LEARN / TOPICS ---------------- */

export const apiGetTopics = async () => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.get(`/learn/topics`);
  return res.data;
};

// Admin-only: generate lessons + starter mission for a topic
export const apiGenerateTopicContent = async (topicId) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/admin/topics/${topicId}/generate-content`);
  return res.data;
};

/* ---------------- LEARN ROADMAP ---------------- */
export const apiGenerateRoadmap = async (payload) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/learn/generate`, payload);
  return res.data;
};

export const apiSaveRoadmap = async (payload) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/learn/save`, payload);
  return res.data;
};

export const apiGetMyProgress = async () => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.get(`/learn/my-progress`);
  return res.data;
};

export const apiCompleteMission = async (payload) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/learn/complete-mission`, payload);
  return res.data;
};

// Generate a mission for a topic (user-triggered)
export const apiGenerateMissionForTopic = async (topicId) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/learn/topics/${topicId}/generate-mission`);
  return res.data;
};

/* ---------------- CONTACT ---------------- */

// Submit contact message (uses auth token if available)
export const apiSubmitContactMessage = async (data) => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.post(`/contact/submit`, data);
  return res.data;
};

// Get user's own contact messages and admin responses
export const apiGetUserContactMessages = async () => {
  const axiosInstance = createAxiosInstance();
  const res = await axiosInstance.get(`/contact/my-messages`);
  return res.data;
};
