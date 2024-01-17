const mongoose = require('mongoose')

const userSchema = mongoose.Schema({
    first_name : { type : String, required : [true, "Please enter your first name"], trim: true },
    last_name : { type : String, required : [true, "Please enter your last name"], trim: true },
    email : { type : String, required : [true, "Please enter your email"], trim: true, unique: true },
    password : { type : String, required : [true, "Please enter your password"], trim: true },
    status : { type : Number, default : 1 },
    forgot_password : { type : Array, default : [] },
    update_log : { type : Array, default : [] },
    last_passwords : { type : Array, default : [] },
    avatar : { type : String, default : "https://www.kindpng.com/picc/m/24-248729_stockvader-predicted-adig-user-profile-image-png-transparent.png" },
},{
    timestamps : true
})

module.exports = mongoose.model("Users", userSchema)