/* @flow */
if (process.env.NODETIME_ACCOUNT_KEY) {
  require('nodetime').profile({
    accountKey: process.env.NODETIME_ACCOUNT_KEY,
    appName: 'Zocket'
  });
}

var express = require('express');
var app = express();
var users = {};

app.set('port', (process.env.PORT || 80));
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/home', function(req, res){
  res.sendFile(__dirname + '/public/home.html');
});

app.get('/bub', function(req, res){
  res.sendFile(__dirname + '/public/bub.html');
});

app.get('/wheel', function(req, res){
  res.sendFile(__dirname + '/public/wheel.html');
});

app.get('/vor', function(req, res){
  res.sendFile(__dirname + '/public/vor.html');
});


var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');

var bub = io.of('/bub');
var vor = io.of('/vor');

bub.on('connection', function(socket) {
  console.log("Connected to BUB nsp");

  socket.on('disconnect', function() {
    console.log("Disconnected from BUB");
  });
});

var imgURL = "eye.png";

io.on('connection', function(socket) {

  var id = socket.id.substring(4, 0);
  io.to(socket.id).emit('initUser', users, id);

  console.log("USER CONNECTED:", users, id);

  socket.on('userDidInit', function(userid, user) {
    console.log("USERDID INIT:", userid, user);
    socket.broadcast.emit('userDidInit', userid, user);
    users[userid] = user;
  });

  socket.on('userDidUpdate', function(userid, user) {
    console.log("USERDID UPDATE:", userid, user);
    socket.broadcast.emit('userDidUpdate', userid, user);
    users[userid] = user;
  });

  socket.on('userDidUploadImage', function(user, index, img) {
    socket.broadcast.emit('userDidUploadImage', user, index, img);
    // fs.writeFile(__dirname + '/public/img/' + user.id + ".png", img);
    users[index].img = true;
  });

  // fs.readFile(__dirname + '/img/' + imgURL, function(err, buf){
  //   if (err) throw err;
  //   socket.emit('image', { image: true, buffer: buf });
  // });

  socket.on('disconnect', function() {
    socket.broadcast.emit("userDidDisconnect", socket.id.substring(4, 0));
    delete users[socket.id.substring(4, 0)];
  });
});

http.listen(app.get('port'), function() {
  console.log("Node app is running at port:" + app.get('port'));
});