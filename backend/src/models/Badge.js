const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema({
  name: String,
  description: String,
  icon: String,
  requirement: String
});

module.exports = mongoose.model("Badge", badgeSchema);
