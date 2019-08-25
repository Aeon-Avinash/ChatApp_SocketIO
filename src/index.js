const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const Filter = require("bad-words");

const app = express();
const PORT = process.env.PORT || 8000;
const server = http.createServer(app);
const io = socketio(server);

const { generateMessage, generateLocationMsg } = require("./utils/messages");
const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
} = require("./utils/user");

app.use(express.json());
app.use(express.static("public"));

io.on("connection", socket => {
  socket.on("join", (options, callback) => {
    const { error, user } = addUser({ id: socket.id, ...options });
    if (error) {
      return callback(error);
    }

    socket.join(user.room);

    socket.emit(
      "message",
      generateMessage("Welcome to the ChatRoom!", "Admin")
    );
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        generateMessage(`${user.username} has joined!`, "Admin")
      );

    io.to(user.room).emit("roomData", {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on("sendMessage", ({ message }, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback("No user found!");
    }
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback("Profanity is not allowed!");
    }
    io.to(user.room).emit("message", generateMessage(message, user.username));

    callback();
  });

  socket.on("sendLocation", ({ location }, callback) => {
    const user = getUser(socket.id);
    if (!user) {
      return callback("No user found!");
    }
    const locationMsg = `${location.latitude},${location.longitude}`;
    io.to(user.room).emit(
      "locationMsg",
      generateLocationMsg(locationMsg, user.username)
    );
    callback();
  });

  socket.on("disconnect", () => {
    const user = removeUser(socket.id);
    if (user) {
      io.to(user.room).emit(
        "message",
        generateMessage(`${user.username} has left!`, "Admin")
      );

      io.to(user.room).emit("roomData", {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Chat-App Server is listening on Port ${PORT}...`);
});
