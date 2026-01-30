import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

// Get token from localStorage
const getToken = () => localStorage.getItem("token");

// Create axios instance with auth headers
const createAxiosInstance = () => {
  const token = getToken();
  return axios.create({
    baseURL: API_BASE_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json"
    }
  });
};

// ============== USER MANAGEMENT ==============

export const apiGetAllUsers = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/admin/users");
    return res.data;
  } catch (err) {
    console.error("Error fetching users:", err.message);
    throw err;
  }
};

export const apiGetUserById = async (userId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get(`/admin/users/${userId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching user:", err.message);
    throw err;
  }
};

export const apiUpdateUser = async (userId, data) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.patch(`/admin/users/${userId}`, data);
    return res.data;
  } catch (err) {
    console.error("Error updating user:", err.message);
    throw err;
  }
};

export const apiDeleteUser = async (userId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.delete(`/admin/users/${userId}`);
    return res.data;
  } catch (err) {
    console.error("Error deleting user:", err.message);
    throw err;
  }
};

// ============== REPORTS & ANALYTICS ==============

export const apiGetReports = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/admin/reports");
    return res.data;
  } catch (err) {
    console.error("Error fetching reports:", err.message);
    throw err;
  }
};

export const apiGetSystemStats = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/admin/stats");
    return res.data;
  } catch (err) {
    console.error("Error fetching system stats:", err.message);
    throw err;
  }
};

export const apiGetContentStats = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/admin/content-stats");
    return res.data;
  } catch (err) {
    console.error("Error fetching content stats:", err.message);
    throw err;
  }
};

// ============== MISSION MANAGEMENT ==============

export const apiGetAllMissions = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/missions");
    return res.data;
  } catch (err) {
    console.error("Error fetching missions:", err.message);
    throw err;
  }
};

export const apiGetUserGeneratedMissions = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/admin/missions");
    return res.data;
  } catch (err) {
    console.error("Error fetching user-generated missions:", err.message);
    throw err;
  }
};

export const apiGetMissionsByCreator = async (creatorId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get(`/admin/missions/creator/${creatorId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching missions by creator:", err.message);
    throw err;
  }
};

export const apiGetMissionById = async (missionId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get(`/missions/${missionId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching mission:", err.message);
    throw err;
  }
};

export const apiCreateMission = async (missionData) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.post("/missions/create", missionData);
    return res.data;
  } catch (err) {
    console.error("Error creating mission:", err.message);
    throw err;
  }
};

export const apiUpdateMission = async (missionId, missionData) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.patch(`/missions/${missionId}`, missionData);
    return res.data;
  } catch (err) {
    console.error("Error updating mission:", err.message);
    throw err;
  }
};

export const apiReviewMission = async (missionId, isApproved) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.patch(`/admin/missions/${missionId}/review`, { isApproved });
    return res.data;
  } catch (err) {
    console.error("Error reviewing mission:", err.message);
    throw err;
  }
};

export const apiDeleteMission = async (missionId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.delete(`/admin/missions/${missionId}`);
    return res.data;
  } catch (err) {
    console.error("Error deleting mission:", err.message);
    throw err;
  }
};

export const apiGetUnpublishedMissions = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/missions/admin/unpublished");
    return res.data;
  } catch (err) {
    console.error("Error fetching unpublished missions:", err.message);
    throw err;
  }
};

// ============== ADMIN MISSION PROGRESS ==============
// (apiGetMissionsByCreator already defined earlier)


export const apiGetMissionProgress = async (missionId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get(`/admin/missions/${missionId}/progress`);
    return res.data;
  } catch (err) {
    console.error("Error fetching mission progress:", err.message);
    throw err;
  }
};

export const apiGetUserProgressAdmin = async (userId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get(`/admin/users/${userId}/progress`);
    return res.data;
  } catch (err) {
    console.error("Error fetching user progress:", err.message);
    throw err;
  }
};

// ============== RECOMMENDATIONS & ROADMAPS ==============
export const apiRecommendForRole = async (role, skillLevel) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.post(`/learn/recommend`, { role, skillLevel });
    return res.data;
  } catch (err) {
    console.error("Error fetching recommendations:", err.message);
    throw err;
  }
};

export const apiAssignRoadmapToUser = async (roadmapId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.put(`/learn/assign-roadmap`, { roadmapId });
    return res.data;
  } catch (err) {
    console.error("Error assigning roadmap:", err.message);
    throw err;
  }
};

// ============== TOPICS (LEARN CONTENT) ==============

export const apiGetAllTopics = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/learn/topics");
    return res.data;
  } catch (err) {
    console.error("Error fetching topics:", err.message);
    throw err;
  }
};

export const apiGetTopicById = async (topicId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get(`/learn/topics/${topicId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching topic:", err.message);
    throw err;
  }
};

export const apiCreateTopic = async (topicData) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.post("/admin/topics", topicData);
    return res.data;
  } catch (err) {
    console.error("Error creating topic:", err.message);
    throw err;
  }
};

export const apiUpdateTopic = async (topicId, topicData) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.patch(`/admin/topics/${topicId}`, topicData);
    return res.data;
  } catch (err) {
    console.error("Error updating topic:", err.message);
    throw err;
  }
};

export const apiDeleteTopic = async (topicId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.delete(`/admin/topics/${topicId}`);
    return res.data;
  } catch (err) {
    console.error("Error deleting topic:", err.message);
    throw err;
  }
};

// ============== LESSONS ==============

export const apiAddLessonToTopic = async (topicId, lessonData) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.post(`/admin/topics/${topicId}/lessons`, lessonData);
    return res.data;
  } catch (err) {
    console.error("Error adding lesson:", err.message);
    throw err;
  }
};

export const apiUpdateLesson = async (topicId, lessonId, lessonData) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.patch(`/admin/topics/${topicId}/lessons/${lessonId}`, lessonData);
    return res.data;
  } catch (err) {
    console.error("Error updating lesson:", err.message);
    throw err;
  }
};

export const apiDeleteLesson = async (topicId, lessonId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.delete(`/admin/topics/${topicId}/lessons/${lessonId}`);
    return res.data;
  } catch (err) {
    console.error("Error deleting lesson:", err.message);
    throw err;
  }
};

// ============== ROADMAPS ==============

export const apiGetAllRoadmaps = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/learn/roadmaps");
    return res.data;
  } catch (err) {
    console.error("Error fetching roadmaps:", err.message);
    throw err;
  }
};

export const apiGetRoadmapById = async (roadmapId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get(`/learn/roadmaps/${roadmapId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching roadmap:", err.message);
    throw err;
  }
};

export const apiCreateRoadmap = async (roadmapData) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.post("/admin/roadmaps", roadmapData);
    return res.data;
  } catch (err) {
    console.error("Error creating roadmap:", err.message);
    throw err;
  }
};

export const apiUpdateRoadmap = async (roadmapId, roadmapData) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.patch(`/admin/roadmaps/${roadmapId}`, roadmapData);
    return res.data;
  } catch (err) {
    console.error("Error updating roadmap:", err.message);
    throw err;
  }
};

export const apiDeleteRoadmap = async (roadmapId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.delete(`/admin/roadmaps/${roadmapId}`);
    return res.data;
  } catch (err) {
    console.error("Error deleting roadmap:", err.message);
    throw err;
  }
};

// ============== LEADERBOARD ==============

export const apiGetLeaderboard = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/leaderboard");
    return res.data;
  } catch (err) {
    console.error("Error fetching leaderboard:", err.message);
    throw err;
  }
};

// ============== PROGRESS & USER STATS ==============

export const apiGetUserProgress = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/progress");
    return res.data;
  } catch (err) {
    console.error("Error fetching user progress:", err.message);
    throw err;
  }
};

export const apiUpdateUserPoints = async (data) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.post("/progress/update-points", data);
    return res.data;
  } catch (err) {
    console.error("Error updating user points:", err.message);
    throw err;
  }
};

// ============== CONTACT MESSAGES (ADMIN) ==============

export const apiGetAllContactMessages = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/contact/messages");
    return res.data;
  } catch (err) {
    console.error("Error fetching contact messages:", err.message);
    throw err;
  }
};

export const apiGetUnreadMessageCount = async () => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.get("/contact/messages/unread-count");
    return res.data;
  } catch (err) {
    console.error("Error fetching unread count:", err.message);
    throw err;
  }
};

export const apiUpdateMessageStatus = async (messageId, status) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.patch(`/contact/messages/${messageId}/status`, { status });
    return res.data;
  } catch (err) {
    console.error("Error updating message status:", err.message);
    throw err;
  }
};

export const apiReplyToMessage = async (messageId, replyMessage) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.post(`/contact/messages/${messageId}/reply`, { replyMessage });
    return res.data;
  } catch (err) {
    console.error("Error replying to message:", err.message);
    throw err;
  }
};

export const apiDeleteContactMessage = async (messageId) => {
  try {
    const axiosInstance = createAxiosInstance();
    const res = await axiosInstance.delete(`/contact/messages/${messageId}`);
    return res.data;
  } catch (err) {
    console.error("Error deleting contact message:", err.message);
    throw err;
  }
};
