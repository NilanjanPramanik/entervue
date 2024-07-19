const {createServer} = require("http");
const { Server } = require("socket.io");
// const { CLIENT_URL } = require("./constant");
const CLIENT_URL='https://hire-huddle-hrkjpe4n9-nilanjan-pramaniks-projects.vercel.app';

const server = createServer();

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL
  }
});

const nameToSocketIdMap = new Map();
const socketIdToNameMap = new Map();
const port=process.env.PORT || 3001;

io.on('connection', (socket) => {
  console.log("Socked connected ", socket.id);
  socket.on('room:join', (data) => {
    const {name, room} = data;
    nameToSocketIdMap.set(name, socket.id);
    socketIdToNameMap.set(socket.id, name);
    io.to(room).emit("user:joined", { name, id: socket.id });
    socket.join(room);
    io.to(socket.id).emit('room:join', data);
  })

  socket.on("user:call", ({to, offer}) => {
    io.to(to).emit("incomming:call", { from: socket.id, offer });
  })

  socket.on("call:accepted", ({to, ans}) => {
    io.to(to).emit("call:accepted", { from: socket.id, ans });
  })

  socket.on('peer:nego:needed', ({to, offer}) => {
    io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
  })
  
  socket.on("peer:nego:done", ({to, ans}) => {
    io.to(to).emit("peer:nego:final", { from: socket.id, ans });
  })

  socket.on("code-share", ({room, code, language, output}) => {
    // console.log(output)
    io.to(room).emit("code-recieve", {from: socket.id, code, language, output});
  })
})

server.listen(port, () => console.log(`Socket Server running on ${port}...`))