//module imports
const express = require("express");
const path = require("path");

const Game = require("./app/game");
const Player = require("./app/player");

//testing game room.
var tester = new Player("tester", true, 1);

var testGame = new Game("aaaa", tester);
//RedFlags server vars
var games = [testGame];

//App setup
const app = express();

var server = require("http").Server(app);
var io = require("socket.io")(server, {
  pingInterval: 10000,
  pingTimeout: 30000,
});

const port = process.env.PORT || 8000;

// Serve any static files
app.use(express.static(path.join(__dirname, "client/build")));
// Handle React routing, return all requests to React app
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

//TODO : handle disconnection.

io.on("connection", function (socket) {
  console.log("socket connection made " + socket.id);

  //creating a game
  socket.on("createGame", (data) => {
    host = new Player(data.playerName, true, socket.id);
    game = new Game(generateCode(), host);
    games.push(game);
    console.log(
      "(Server):" + host.name + " created a game with code : " + game.getCode()
    );

    socket.join(game.getCode());
    io.to(game.getCode()).emit("createGame", game);
  });
  //Join a game
  socket.on("joinGame", (data) => {
    //create the player and game. add player to game

    //for some odd reason cant pass the socket itself????
    player = new Player(data.playerName, false, socket.id);
    gameCode = data.roomCode;

    var game = findGame(gameCode);

    if (game) {
      if (game.addPlayer(player)) {
        console.log(
          "(Server): " + player.name + " joined game " + game.getCode()
        );
        socket.join(game.getCode());
        io.to(game.getCode()).emit("joinGame", game);
      } else {
        //trying to join existsing game(which you cant)
        //should tell them
      }
    } else {
      console.log("(Server): Couldnt find game");
      socket.emit("joinError", {});
    }
  });

  socket.on("startGame", (gameCode, name) => {
    var game = findGame(gameCode);
    game.isActive = true;

    console.log(gameCode + " has started");
    player = game.getPlayer(name);
    var hands = game.getHands(player);

    io.to(game.getCode()).emit("startGame", game, hands);
  });

  socket.on("disconnect", (data) => {
    console.log(socket.id + " disconnected");
  });
});

function findGame(gameCode) {
  for (i = 0; i < games.length; i++) {
    if (games[i].getCode() === gameCode) {
      return games[i];
    }
  }
  return null;
}

function generateCode() {
  var code = "";
  const length = 4;
  do {
    for (var i = 0; i < length; i++) {
      code += String.fromCharCode(97 + Math.random() * 26);
    }
  } while (games.includes(code));
  return code;
}

server.listen(port, () => console.log(`Listening on port ${port}`));
