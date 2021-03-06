import React from "react";
import "./App.css";
import StartControl from "./StartControl";
import GameControl from "./GameControl";
import io from "socket.io-client";

const socketiohost =
  process.env.NODE_ENV === "development"
    ? "localhost:8000"
    : "redflagsio.herokuapp.com";
console.log(process.env);

const socket = io(socketiohost);

class App extends React.Component {
  constructor() {
    super();
    this.state = {
      response: false,
      socket: socket,
      name: "",
      isHost: false,
      game: false,
      roomcode: "",
    };
  }

  componentDidMount() {
    this.state.socket.on("createGame", (game) => {
      //console.log(game);
      this.setState({ game: game, roomcode: game.code, isHost: true });
    });
    this.state.socket.on("joinGame", (game) => {
      //console.log(this.state.name);
      var hand = findHand(this.state.name, game);
      //console.log("update game from joinGame");
      //console.log(game);
      this.setState({ game: game, roomcode: game.code, hand: hand });
    });
    this.state.socket.on("startGame", (game) => {
      //console.log(this.state.name);
      var hand = findHand(this.state.name, game);
      //console.log(game);
      this.setState({ game: game, roomcode: game.code, hand: hand });
    });
  }

  recieveStart = () => {
    socket.emit("startGame", this.state.roomcode, this.state.name);
  };

  recieveNameRoom = (name, roomcode) => {
    this.setState({ name: name, roomcode: roomcode });
  };

  render() {
    let MenuOrStart;
    if (this.state.game.isActive) {
      MenuOrStart = (
        <GameControl
          name={this.state.name}
          socket={this.state.socket}
          game={this.state.game}
          hand={this.state.hand}
        />
      );
    } else {
      MenuOrStart = (
        <StartControl
          pStartGame={this.recieveStart}
          handleNameRoom={this.recieveNameRoom}
          socket={this.state.socket}
          game={this.state.game}
          roomcode={this.state.roomcode}
          isHost={this.state.isHost}
        />
      );
    }
    return <div>{MenuOrStart}</div>;
  }
}

/*<button name="disconnect" onClick={this.disconnect}>
          X
        </button> */

function findHand(name, game) {
  for (var i = 0; i < game.hands.length; i++) {
    if (name === game.hands[i].name) {
      return game.hands[i];
    }
  }
  //coundlt find hand for this player
  return [];
}

export default App;
