const mongoose = require("mongoose");

const activeSchema = mongoose.Schema({
  isActive: {
    type: Boolean,
  },
  appUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Appusers",
    unique:true
  },
});
module.exports = mongoose.model("activeUsers", activeSchema);
