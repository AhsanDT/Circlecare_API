const mongoose = require('mongoose');


const pain_assessmentSchema = new mongoose.Schema({
    app_user_id: { type: mongoose.Schema.Types.ObjectId, required: [true, "User Required"] },
    category: { type: String, enum: ["head", "neck", "shoulders", "chest", "back", "legs", "knees", "ankles", "feet"], trim: true, required: [true, "Please enter category"] },
    scale: { type: Number,required: [true, "Please enter blood pressure"], trim: true },
    scale_title: { type: String, enum: ["No Hurt", "Hurts a little bit", "Hurts a little more", "Hurts an even more", "Hurts a whole lot", "Hurts worst"], trim: true, required: [true, "Please enter category"] },
}, {
    timestamps: true
});

module.exports = mongoose.model("Pain_assessments", pain_assessmentSchema);