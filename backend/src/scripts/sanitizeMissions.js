// One-off script to sanitize existing missions in the DB
// Usage: from backend folder: node src/scripts/sanitizeMissions.js

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { Mission } = require('../models/Mission');

const sanitize = (str) => {
  if (!str) return str;
  return str.toString().replace(/\bmcq\b/ig, '').replace(/\bmultiple choice\b/ig, 'multiple-choice').replace(/\s{2,}/g, ' ').trim();
};

(async () => {
  try {
    await connectDB();
    console.log('Connected to DB, starting mission sanitization...');

    const missions = await Mission.find({ $or: [ { title: /mcq/i }, { topic: /mcq/i }, { description: /mcq/i } ] });
    console.log('Found', missions.length, 'missions to sanitize');

    for (const m of missions) {
      const updates = {};
      const cleanedTitle = sanitize(m.title);
      const cleanedTopic = sanitize(m.topic) || 'Security';
      const cleanedDesc = sanitize(m.description);

      if (cleanedTitle && cleanedTitle !== m.title) updates.title = cleanedTitle;
      if (cleanedTopic && cleanedTopic !== m.topic) updates.topic = cleanedTopic;
      if (cleanedDesc && cleanedDesc !== m.description) updates.description = cleanedDesc;

      if (Object.keys(updates).length > 0) {
        await Mission.updateOne({ _id: m._id }, { $set: updates });
        console.log('Sanitized mission', m._id, updates);
      }
    }

    console.log('Sanitization complete');
    process.exit(0);
  } catch (err) {
    console.error('Sanitization error:', err);
    process.exit(1);
  }
})();