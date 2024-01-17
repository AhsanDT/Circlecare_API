const mongoose = require('mongoose');


const dailyreflectionsSchema = new mongoose.Schema({
    app_user_id: { type: mongoose.Schema.Types.ObjectId, required: [true, "App User Required"] }, 
    dated: { type: Date, required: [true, "Date is Required"] },
    thoughts: { type: String, required: [true, "Please enter thoughts"], trim: true },
}, {
    timestamps: true
});

module.exports = mongoose.model("DailyReflections", dailyreflectionsSchema);