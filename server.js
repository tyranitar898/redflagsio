//module imports
const express = require("express");
const path = require("path");

const Game = require("./app/game");
const Player = require("./app/player");

var games = [];

//App setup
const app = express();

//RedFlags server vars
var server = require("http").Server(app);
var io = require("socket.io")(server, {
  pingInterval: 20000,
  pingTimeout: 60000,
});

const port = process.env.PORT || 8000;

// Serve any static files
app.use(express.static(path.join(__dirname, "client/build")));
// Handle React routing, return all requests to React app
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

io.on("connection", function (socket) {
  //pull game from each subsection to the top here. every time a connect is made ithandles a diff game

  console.log("socket connection made " + socket.id);
  var game;
  var name;
  //creating a game
  socket.on("createGame", (data) => {
    name = data.playerName;
    host = new Player(data.playerName, true, socket.id);
    game = new Game(generateCode(), host, 4, 3);
    games.push(game);

    logToServer(
      socket.id,
      " " + host.name + " created a game with code : " + game.getCode()
    );

    socket.join(game.getCode());
    io.to(game.getCode()).emit("createGame", game);
  });
  //Join a game
  socket.on("joinGame", (data) => {
    //create the player and game. add player to game

    //for some odd reason cant pass the socket itself????
    name = data.playerName;
    player = new Player(name, false, socket.id);
    gameCode = data.roomCode;

    game = findGame(gameCode);
    if (game === undefined || game === null) {
      return;
    }

    if (game) {
      if (game.joinPlayer(player)) {
        logToServer(
          socket.id,
          " " + player.name + " joined game " + game.getCode()
        );

        socket.join(game.getCode());
        io.to(game.getCode()).emit("joinGame", game);
      } else {
        //trying to join existsing game(which you cant)
        //should tell them
      }
    } else {
      //console.log("(Server): Couldnt find game");
      socket.emit("joinError", {});
    }
  });

  socket.on("startGame", (gameCode, name) => {
    game = findGame(gameCode);
    if (game === undefined || game === null) {
      return;
    }
    logToServer(socket.id, gameCode + " has started game " + gameCode);

    game.isActive = true;
    player = game.getPlayer(name);
    game.updateHands();

    io.to(game.getCode()).emit("startGame", game);
  });

  socket.on("sendMatch", (gameCode, playerName, cards) => {
    game = findGame(gameCode);
    if (game === undefined || game === null) {
      return;
    }
    game.addDate(playerName, cards);
    io.to(game.getCode()).emit("joinGame", game);
  });

  socket.on("roundOver", (gameCode, roundWinnerName) => {
    game = findGame(gameCode);
    if (game === undefined || game === null) {
      return;
    }
    game.endRound(roundWinnerName);
    game.updateHands();
    io.to(game.getCode()).emit("joinGame", game);
  });

  socket.on(
    "attachRFtoMatch",
    (RFtoBeAttached, gameCode, dateCreatorStr, dateRuinerStr) => {
      game = findGame(gameCode);
      if (game === undefined || game === null) {
        return;
      }
      game.addRedFlagToDate(dateCreatorStr, RFtoBeAttached, dateRuinerStr);
      //console.log(game);
      io.to(game.getCode()).emit("joinGame", game);
    }
  );

  socket.on("disconnect", (reason) => {
    if (game !== undefined && game !== null) {
      game.disconnectPlayer(name);

      if (!endGame(game)) {
        socket.join(game.getCode());
        io.to(game.getCode()).emit("joinGame", game);
      } else {
        logToServer(socket.id, " ended game");
      }
    }
    logToServer(socket.id, " disconnected with reason " + reason);
  });
});

function logToServer(socketid, msg) {
  let soc = socketid || "";
  console.log("(Server): " + soc + msg);
}

/**
 * true if everyone disconnected.
 * if true it will also remove it from list of games on server
 * @param {game} object
 * @returns {boolean}
 */
function endGame(game) {
  var numDisconnectedPlayers = 0;
  for (var i = 0; i < game.players.length; i++) {
    if (!game.players[i].active) {
      numDisconnectedPlayers += 1;
    }
  }

  if (numDisconnectedPlayers === game.players.length) {
    for (i = 0; i < games.length; i++) {
      if (games[i].getCode() === game.getCode()) {
        games.splice(i, 1);
        return true;
      }
    }
  }
  return false;
}

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
