import React from "react";

class CreateWindow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      socket: this.props.socket,
      name: "",
      roomcode: "",
      optionalPerkNum: 4,
      optionalRfNum: 3,
    };
  }
  handleInputChange = (event) => {
    let target = event.target;
    let value = target.value;
    let name = target.name;
    this.setState({ [name]: value });
  };

  sendUserInfo = () => {
    this.props.pCallBack(this.state.name, "");
    this.props.socket.emit("createGame", {
      playerName: this.state.name,
      optionalPerkNum: this.state.optionalPerkNum,
      optionalRfNum: this.state.optionalRfNum,
    });
  };

  render() {
    return (
      <div>
        <div id="createInput">
          <input
            id="hostName"
            type="text"
            placeholder="Enter your name"
            onChange={this.handleInputChange}
            name="name"
          />
          <input
            id="hostName"
            type="text"
            placeholder="Enter # of perks (4 by default)"
            onChange={this.handleInputChange}
            name="optionalPerkNum"
          />
          <input
            id="hostName"
            type="text"
            placeholder="Enter # of red flags (3 by default)"
            onChange={this.handleInputChange}
            name="optionalRfNum"
          />
          <button className="starterButtons" onClick={this.sendUserInfo}>
            Create
          </button>
        </div>
      </div>
    );
  }
}
export default CreateWindow;

/*
<input
            id=""
            type="text"
            placeholder="Number of perks each round"
            onChange={this.handleInputChange}
            name="optionalPerkNum"
          />
          <input
            id=""
            type="text"
            placeholder="Number of red flags each round"
            onChange={this.handleInputChange}
            name="optionalRfNum"
          />*/
