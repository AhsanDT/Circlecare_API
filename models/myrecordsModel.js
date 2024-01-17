const mongoose = require('mongoose');


const myrecordsSchema = new mongoose.Schema({
    app_user_id: { type: mongoose.Schema.Types.ObjectId, required: [true, "User Required"] },
    blood_pressure_systole: { type: Number,required: [true, "Please enter blood pressure systole"], trim: true },
    blood_pressure: { type: Number,required: [true, "Please enter blood pressure"], trim: true },
    sugar_level: { type: Number,required: [true, "Please enter sugar level"], trim: true },
    sleeping_hours: { type: Number,required: [true, "Please enter sleeping hours"], trim: true },
    weight: { type: Number,required: [true, "Please enter weight"], trim: true }
}, {
    timestamps: true
});

module.exports = mongoose.model("Myrecords", myrecordsSchema);