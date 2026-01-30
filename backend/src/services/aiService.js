const axios = require("axios");

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "http://127.0.0.1:5000";

exports.generateMissionAI = async (payload) => {
  try {
    const res = await axios.post(`${AI_ENGINE_URL}/generate-mission`, payload);
    return res.data;
  } catch (err) {
    console.error("AI Engine Error:", err.response?.data || err.message);
    throw new Error("AI mission generation failed");
  }
};
