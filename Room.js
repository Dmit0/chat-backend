const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
    users:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    messages: [{ type: String}],
    roomId: { type: String },
});

const Room = mongoose.model('Room', RoomSchema);

module.exports={Room};