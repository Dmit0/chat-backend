//import mongoose from 'mongoose';

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const {User} = require ('./schemas/User');
const {Room} = require ('./schemas/Room');
const mongoose = require('mongoose');
const updateLastSeen=require('./middleWare/updateLastSeen.js');


const userIO=new Map()

mongoose.connect("mongodb://localhost:27017/chat",{
  useNewUrlParser:true,
  useCreateIndex:true,
  useFindAndModify:false,
  useUnifiedTopology: true });

app.use(express.json());
app.post('/user/registration',(req, res) => {
  const postdata={
    nickName:req.body.Login,
    fullname:req.body.FullName,
    password:req.body.Password
  }
  User.findOne({nickname:postdata.nickName},(err,users)=>{
    if(users){
      res.json('this uther is already exist')
      
  } 
  else{
      const user = new User(postdata);
      user.save().then((obj)=>{
      res.json(obj);
  }).catch(reason=>{ 
    res.json(reason);
  });
}
})
  //console.log(postdata)
  
})

  
app.post('/user/login',(req, res)=>{
   
  const postData = {
  nickName:req.body.Login,
  password:req.body.Password
}
console.log()

User.findOne({nickName:postData.nickName},(err,user)=>{
if  (err || !user || user.online==true) {
  console.log(err)
  return res.status(404).json({
    message: 'User not found'
  });
}

if(postData.password == user.password){
  res.json({
    status: 'success'
  });
  
  
}
else{
  res.status(403).json({
    status: 'error',
    message: 'Incorrect password'
  });
}
}) 
})
  
app.get('/user/:Login', (req, res) => {
    
  Room.find({},function(err,room){
    if (err){console.log(err)};
  User.findOne({nickName:req.params.Login},(err,user)=>{
    if  (err || !user) {
      console.log(err)
      return res.status(404).json({
        message: 'User not found'
      });
    }
    const obj ={
      user : user,
      rooms:room,
    }
    
    res.json(obj);
  });
});
});

app.get('/roomUserInfo/:id',(req,res)=>{
  const { id: roomid } = req.params;
  Room.findOne({roomId : roomid},function(err,room){
    if (err || !room){
      console.log(err);
    }
    let usernames=[];
    const NumOfUsers=room.users.length;
    for(let i=0;i<NumOfUsers;i++){
      User.findOne({_id:room.users[i]},(err,user)=>{
       usernames.push(user.nickName);
    
       if(i==NumOfUsers-1){
         obj = {
           users: usernames,
           };
        
         res.json(obj);

          }})}})})
       



app.get('/rooms/:id', (req, res) => {
  const { id: roomId } = req.params;
  //console.log(roomId)
  let obj;
  
  let usernames=[];
  
  Room.findOne({roomId : roomId},function(err,room){
  if (err || !room){
  console.log(err);
  obj = {users:[],messages:[]};
  }
   
        obj = {
          messages:room.messages,
          };
        res.json(obj);
      })})

  app.post('/rooms', (req, res) => {
    
    const { roomId} = req.body;
    
    Room.findOne({roomId:roomId}, function(err,room) {
    if (err || !room) {
    const room = new Room({roomId:roomId});
    room.save().then(() => console.log('RoomCreated'));
      }
    });
  
  res.send();
    
});


  io.on('connection', (socket) => {
  socket.on('APP:JOIN', ({ Login }) => {
    User.findOneAndUpdate({nickName:Login},{online:true},{new:true}, ()=>{});
    console.log('user connected', socket.id);  
  });
  
  socket.on('ROOM:JOIN', ({ roomId,NickName }) => {
   // console.log(roomId,NickName);
   socket.join(roomId);
    let _users=[];
    userIO.set(socket.id,NickName);
    User.findOne({nickName:NickName},function(err,user){
    if (err || !user){
    console.log(err);
    }
      Room.findOneAndUpdate({roomId:roomId},{$push:{users:user._id}},{new: true},(err, room) => {
        if (err) {
        console.log("Something wrong when updating data!");
        }
  }
);
})});

 
  
   socket.on('ROOM:NEW_MESSAGE', ({ roomid, nickName, text }) => {
    //console.log(roomid);
    //console.log(nickName);
   // console.log(text);
    const obj = {
      nickName,
      text,
    };
    Room.findOneAndUpdate({roomId:roomid},{$push:{messages:text}},{new: true},(err, doc) => {
      if (err) {
          console.log("Something wrong when updating data!");
      }  
    });
    //console.log(obj)
    socket.to(roomid).broadcast.emit('ROOM:NEW_MESSAGE', obj);
 }); 
 socket.on('disconnect', () => {
  if(userIO.has(socket.id)){

  User.findOne({nickName:userIO.get(socket.id)},function(err,userfordel){
    if (err ||!userfordel){
      console.log(err);
    }
    User.findOneAndUpdate({nickName:userfordel.nickName},{online:false},{new:true}, ()=>{});
    Room.findOne({users:userfordel._id},function(err,room){ 
    if (err || !room){
    console.log(err);
    }
    for(let i=0;i<room.users.length;i++){
      if(userfordel._id.equals(room.users[i])){
        Room.findOneAndUpdate({roomId:room.roomId},{$pull:{users:room.users[i]}},(err,doc)=>{
            if (err){}
        })
    }
        
        }
  })});userIO.delete(socket.id);}})

});

server.listen(8888, (err) => {
  if (err) {
    throw Error(err);
  }
  console.log(`Сервер запущен!`);
});