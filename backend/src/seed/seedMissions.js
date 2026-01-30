require("dotenv").config();
const connectDB = require("../config/db");
const { Mission } = require("../models/Mission");

const missions = [
  {
    title: "Identify the Phishing Email",
    description: "Choose the email that looks suspicious.",
    type: "phishing",
    difficulty: "easy",
    topic: "phishing",
    points: 100,
    content: {
      scenarios: [
        {
          subject: "Payroll Update Required",
          sender: "hr@company-support.com",
          content: "Please update your payroll info immediately.",
          isPhishing: true,
          indicators: ["weird sender", "urgent pressure"]
        }
      ]
    }
  }
];

const seed = async () => {
  await connectDB();
  await Mission.deleteMany({});
  await Mission.insertMany(missions);
  console.log("Seed complete");
  process.exit();
};

seed();
