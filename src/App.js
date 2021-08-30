import React from "react";
import "./App.css";
import Chart from "./components/Chart";
import AudioPlayer from "./components/AudioPlayer";
import { Provider } from "react-redux";
import store from "./redux/store";

import DATA from "./data/umap2_pedion.json";
var MAP_IMAGE = "umap2_pedion";
var STARTING_POINT = [0.66944, 0.8356167];

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: DATA,
      chartWidth: 600,
      chartHeight: 600,
    };
  }

  render() {
    return (
      <Provider store={store}>
        <div id="mainMaps">
        {/* <h2>wandering mind :: map console</h2> */}
          <div id="chartContainer">
          <p>region</p>
          </div>
          <div id="mapContainer">
            <p>universe</p>
          </div>
          <div>
            <Chart
              data={this.state.data}
              // startingpoint={[0.069,0.38]}
              startingpoint={STARTING_POINT}
              map_image={MAP_IMAGE}
              width={this.state.chartWidth}
              height={this.state.chartHeight}
            />
          </div>
        </div>
        <div>
          <AudioPlayer/>
        </div>
      </Provider>
    );
  }
}

export default App;
