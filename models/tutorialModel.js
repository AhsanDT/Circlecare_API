const mongoose = require('mongoose');


const tutorialSchema = new mongoose.Schema({
    text: { type: String,required: [true, "Please enter text "], trim: true },
    admin_id: { type: mongoose.Schema.Types.ObjectId, required: [true, "Admin User Required"] },
}, {
    timestamps: true
});

module.exports = mongoose.model("tutorials", tutorialSchema);