const mongoose = require('mongoose');


const dailytasksassignSchema = new mongoose.Schema({
    task_id: { type: mongoose.Schema.Types.ObjectId, required: [true, "Admin User Required"] },
    app_user_id: { type: mongoose.Schema.Types.ObjectId, required: [true, "App User Required"] }, 
    status: { type: Number, default: 1 },
    is_completed: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model("Dailytaskassigns", dailytasksassignSchema);