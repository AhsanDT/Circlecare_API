const mongoose = require("mongoose");
const validator = require("validator");

const notificationSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  app_user_id: { type: String },
  is_all_users: { type: Boolean },
  sender: { type: String },
  content: { type: String },
  route: { type: String },
  createdAt: { type: Date, default: Date.now },
  read: { type: Array, default: false },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
