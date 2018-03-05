var cocketio = require('socket.io');
var io;
var guestNumber = 1;
var nickNames = {};
var namesUsed = {};
var currentRoom = {};
//啟用socket.io伺服器
exports.listen = function(server) {
 io = socketio.listen(server);
 io.set('log level', 1);

 io.sockets.on('connection', function (socket) {
    guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed);
    joinRoom(socket, 'ChatRoom');
    handleMessageBroadcasting(socket,nickNames);
    handleNameChangeAttempts(socket,nickNames,namesUsed);
    handleRoomJoining(socket);
    socket.on('rooms',function() {
	socket.emit('rooms', io.sockets.manager.rooms);
    });
    handleClientDisconnection(socket, nickNames, namesUsed);
 });
};

//指定訪客暱稱
function assignGuestName(socket, guestNumber,nickNames, namesUsed) {
var name = 'Guest' + guestNumber;
nickNames[socket.id] = name;
socket.emit('nameResult', {
	success:true,
	name:name
});
nameUsed.push(name);
return guestNumber + 1;
}

//加入聊天室的相關邏輯
function joinRoom(socket,room){
	socket.join(room);
	currentRoom[room);
	socket.emit('joinResult', {room:room});
	socket.broadcast.to(room).emit('message', {
		text:nickNames[socket.id] + ' has joined ' + room + '.'
	});
var usersInRoom = io.sockets.clients(room);
if (usersInRoom.length > 1) {
	var usersInRoomSummary = 'Users currently in ' + room + ': ';
	for (var index in usersInRoom) {
		var userSocketId = usersInRoom[index].id;
		if(userSocketId !=socket.id){
			if (index>0) {
				usersInRoomSummary += ', ';
			}
			usersInRoomSummary += nickNames[userSocketId];
		}
	}
	usersInRoomSummary += '.';
	socket.emit('message', {text:usersInRoomSummary});
}
}
//處理暱稱變更請求的邏輯
function handleNameChangeAttempts(socket, nickNames,namesUsed) {
	socket.on('nameAttempt', function(name) {
		if(name.indexOf('Guest') == 0) {
			socket.emit('nameResult',{
				success:false,
				message:'Names cannot begin with "Guest".'
			});
		} else {
			if(namesUsed.indexOf(name) == -1) {
				var previousName = nickNames[socket.id];
				var previousNameIndes = namesUsed.indexOf(previousName);
				namesUsed.push(name);
				nickNames[socket.id] = name;
				delete namesUsed[previousNameIndex];
				socket.emit('nameResult', {
					success:true,
					name:name
				});
				socket.broadcast.to(currentRoom[socket.id]).emit('message', {
					text:previousName + ' is now known as ' + name + '.'
				});
				} else {
				socket.emit('nameResult',{
					success:false,
					message:'That name is already in use.'
				});
			}
		}
	});
}
function handleMessageBroadcasting(socket){
	socket.on('message',function(message) {
		socket.broadcast.to(message.room).emit('message',{
			text:nickNames[socket.id]+': ' + message.text
		});
	});
}
//建立聊天室
function handleRoomJoining(socket){
	socket.on('join',function(room){
		socket.leave(currentRoom[socket.id]);
		joinRoom(socket, room.newRoom);
	});
}
//處理使用者斷線或離開
function handleClient() {
	socket.on('disconnect',function(){
		var nameIndex = namesUsed.indexOf(nickNames[socket.id]);
		delete namesUsed[nameIndex];
		delete nickNames[socket.id];
	});
}

