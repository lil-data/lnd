/* @flow */
if (process.env.NODETIME_ACCOUNT_KEY) {
  require('nodetime').profile({
    accountKey: process.env.NODETIME_ACCOUNT_KEY,
    appName: 'Zocket'
  });
}

// express app setup
var express = require('express');
var app     = express();
app.set('port', (process.env.PORT || 80)); // use sudo for port 80
app.use(express.static(__dirname + '/public'));

// pages
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/home', function(req, res){
  res.sendFile(__dirname + '/public/home.html');
});

app.get('/bub', function(req, res){
  res.sendFile(__dirname + '/public/bub.html');
});

app.get('/chat', function(req, res){
  res.sendFile(__dirname + '/public/chat.html');
});

app.get('/read', function(req, res){
  res.sendFile(__dirname + '/public/read.html');
});

app.get('/touch', function(req, res){
  res.sendFile(__dirname + '/public/touch.html');
});

app.get('/vor', function(req, res){
  res.sendFile(__dirname + '/public/vor.html');
});

app.get('/quiz', function(req, res){
  res.sendFile(__dirname + '/public/quiz.html');
});

app.get('/test', function(req, res){
  res.sendFile(__dirname + '/public/test.html');
});

// socket.io setup
var http  = require ('http').Server(app);
var io    = require ('socket.io')(http);
var fs    = require ('fs');

// namespaces
var home  =  io.of ('/home');
var bub   =  io.of ('/bub');
var chat  =  io.of ('/chat');
var read  =  io.of ('/read');
var quiz  =  io.of ('/quiz');
var touch =  io.of ('/touch');
var vor   =  io.of ('/vor');

// ===========================================
//     Bub
// ===========================================

var bubs = {};

// bub namespace
bub.on('connection', function (socket) {
  
  var id = socket.id.substring(4, 0);
  bub.to(socket.id).emit('initUser', bubs, id);
  console.log("[BUB] Connected:", bubs, id);

  socket.on('userDidInit', function (userid, user) {
    socket.broadcast.emit('userDidInit', userid, user);
    bubs[userid] = user;
    console.log("[BUB] Did init:", userid, user);
  });

  socket.on('userDidUpdate', function (userid, user) {
    socket.broadcast.emit('userDidUpdate', userid, user);
    bubs[userid] = user;
    console.log("[BUB] Did update:", userid, user);
  });

  socket.on('disconnect', function() {
    socket.broadcast.emit("userDidDisconnect", socket.id.substring(4, 0));
    delete bubs[socket.id.substring(4, 0)];
    console.log("[BUB] Disconnected", socket.id.substring(4, 0));
  });

});

// ===========================================
//     Chat
// ===========================================

var messengers = {};

// chat namespace
chat.on('connection', function (socket) {

  var id = socket.id.substring(4, 0);
  // chat.to(socket.id).emit('initUser', users, id);
  console.log("[CHT] Connected:", messengers, id);

  socket.on('chat message', function (msg) {
    console.log('[CHT] msg:', msg);
    socket.broadcast.emit('chat message', msg);
  });

  socket.on('disconnect', function() {
    console.log('[CHT] Disconnected:', socket.id.substring(4, 0));
  });

});

// ===========================================
//     Touch
// ===========================================

var touches = {};

// bub namespace
touch.on('connection', function (socket) {
  
  var id = socket.id.substring(4, 0);
  touch.to(socket.id).emit('initUser', touches, id);
  console.log("[TCH] Connected:", touches, id);

  socket.on('userDidInit', function (userid, user) {
    socket.broadcast.emit('userDidInit', userid, user);
    touches[userid] = user;
    console.log("[TCH] Did init:", userid, user);
  });

  socket.on('userDidUpdate', function (userid, user) {
    socket.broadcast.emit('userDidUpdate', userid, user);
    touches[userid] = user;
    console.log("[TCH] Did update:", userid, user);
  });

  socket.on('disconnect', function() {
    socket.broadcast.emit("userDidDisconnect", socket.id.substring(4, 0));
    delete touches[socket.id.substring(4, 0)];
    console.log("[TCH] Disconnected", socket.id.substring(4, 0));
  });

});

var imgURL = "eye.png";

io.on('connection', function (socket) {

  // var id = socket.id.substring(4, 0);
  // io.to(socket.id).emit('initUser', users, id);

  // console.log("USER CONNECTED:", users, id);

  // socket.on('userDidInit', function(userid, user) {
  //   console.log("USERDID INIT:", userid, user);
  //   socket.broadcast.emit('userDidInit', userid, user);
  //   users[userid] = user;
  // });

  // socket.on('userDidUpdate', function(userid, user) {
  //   console.log("USERDID UPDATE:", userid, user);
  //   socket.broadcast.emit('userDidUpdate', userid, user);
  //   users[userid] = user;
  // });

  // socket.on('userDidUploadImage', function(user, index, img) {
  //   socket.broadcast.emit('userDidUploadImage', user, index, img);
  //   // fs.writeFile(__dirname + '/public/img/' + user.id + ".png", img);
  //   users[index].img = true;
  // });

  // // fs.readFile(__dirname + '/img/' + imgURL, function(err, buf){
  // //   if (err) throw err;
  // //   socket.emit('image', { image: true, buffer: buf });
  // // });

  // socket.on('disconnect', function() {
  //   socket.broadcast.emit("userDidDisconnect", socket.id.substring(4, 0));
  //   delete users[socket.id.substring(4, 0)];
  // });
});

http.listen(app.get('port'), function() {
  console.log("Node app is running at port:" + app.get('port'));
});