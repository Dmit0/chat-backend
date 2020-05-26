const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    nickName:{
        type:String,
        required:true,
        unique:true
    },
    fullname:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    last_seen:{
        type:Date,
        default:new Date()
    },
    online:{
        type:Boolean,
        default:false
    }
    
},{
    timestamps:true
});

const User=mongoose.model('User',UserSchema);
module.exports={User};
//export default User;