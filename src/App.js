import React from "react";
import "./App.css";
import Chart from "./components/Chart";
import AudioPlayer from "./components/AudioPlayer";
import { Provider } from "react-redux";
import store from "./redux/store";

import DATA from "./data/umap_sixteenth.json"
var MAP_IMAGE = "umap_sixteenth"

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
              files={["nime","umap_eighth"]}
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
