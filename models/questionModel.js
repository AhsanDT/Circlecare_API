const mongoose = require('mongoose');


const questionnaireSchema = new mongoose.Schema({
    admin_id: { type: mongoose.Schema.Types.ObjectId, required: [true, "User Required"] },
    content_type: { type: String, enum: ["English", "Arabic"], trim: true, required: [true, "Please enter content type"] },
    title: { type: String, required: [true, "Please enter title"], trim: true },
    month: { type: String, enum: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], trim: true, required: [true, "Please enter month"] },
    description: { type: String, default: "", trim: true },
    questions: { type: Array, required: [true, "Please enter questions"], trim: true },
    // questions: [{ 
    //     // type: Array, required: [true, "Please enter questions"], trim: true 
    //     // type: Array, required: [true, "Please enter questions"], trim: true 
    //     // type: Array, required: [true, "Please enter questions"], trim: true 
    //     question: {type: String},
    //     type: {type: String},
    //     is_required: {type: Boolean},
    //     options: [{type: Number}],
    //     isSubOption: {type: Boolean},
    //     options: [{
    //         sub_question: {type: String},
    //         sub_options: [{type: Number}]
    //     }],
    // }],
    status : { type : Number, default : 1 }
}, {
    timestamps: true
});

module.exports = mongoose.model("Questionnaires", questionnaireSchema);