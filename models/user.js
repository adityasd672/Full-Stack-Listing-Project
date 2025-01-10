const mongoose = require("mongoose")
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose'); // passport-local-mongoose => automatically defines username and password, therefore we're not adding in userSchema

const userSchema = new Schema({
    email: {
        type: String, 
        required: true
    }
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);