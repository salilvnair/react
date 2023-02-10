/** @jsx React.createReactElement */

class App extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        color: "blue"
      }
    }
    render() {
      return (
        <div>
          <h2 style={{color : this.state.color}}>{this.props.title.toString()}</h2>
          <button onClick={this.update}>Show me your true color</button>
        </div>
      );
    }
    update = () => {
        this.setState({color: 'red'})
      }
  }
  
 
  
  

  