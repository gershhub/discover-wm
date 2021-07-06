import React, { Component } from "react";
import * as d3 from "d3";
import { rgb } from "d3-color";
import { connect } from "react-redux";
import { setAudio, setTrack } from "../redux/actions";
import "react-bootstrap-range-slider/dist/react-bootstrap-range-slider.css";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import RangeSlider from "react-bootstrap-range-slider";
import KeyHandler, { KEYPRESS } from "react-key-handler";

const mapStateToProps = (state, props) => {
  const { leadTrack, leadTrackTime } = state.audioPlayer;
  return { leadTrack, leadTrackTime };
};

class Chart extends Component {
  constructor(props) {
    super(props);
    this.drawChart = this.drawChart.bind(this);
    this.drawMap = this.drawMap.bind(this);
    this.mouseDownHandler = this.mouseDownHandler.bind(this);
    this.mouseMoveHandler = this.mouseMoveHandler.bind(this);
    this.updateSeleted = this.updateSeleted.bind(this);
    this.updateZoom = this.updateZoom.bind(this);
    this.changeComponents = this.changeComponents.bind(this);
    this.mouseOverTooltipHandler = this.mouseOverTooltipHandler.bind(this);
    this.addNodeToPath = this.addNodeToPath.bind(this);
    this.resetPathHandler = this.resetPathHandler.bind(this);
    this.moveAlongPath = this.moveAlongPath.bind(this);
    this.makeButton = this.makeButton.bind(this);
    this.findInRange = this.findInRange.bind(this);
    this.selectTrack = this.selectTrack.bind(this);
    this.makeSlider = this.makeSlider.bind(this);
    this.moveButtonHandler = this.moveButtonHandler.bind(this);
    this.mapMoveHandler = this.mapMoveHandler.bind(this);
    this.getDefaultVisibleRange = this.getDefaultVisibleRange.bind(this);
    this.normalizeEmbeddings = this.normalizeEmbeddings.bind(this);
    this.updateChartScale = this.updateChartScale.bind(this);
    this.updateMapScale = this.updateMapScale.bind(this);
    this.updateSeletedRect = this.updateSeletedRect.bind(this);
    this.updateMap = this.updateMap.bind(this);
    this.addComponentSelector = this.addMapSelector.bind(this);
    this.addSlider = this.addSlider.bind(this);
    this.addKeyNavigator = this.addKeyNavigator.bind(this);
    this.addCoordForm = this.addCoordForm.bind(this);
    this.loggingHandler = this.loggingHandler.bind(this);
    this.loadMap = this.loadMap.bind(this);

    const visibleRange = this.getDefaultVisibleRange();
    const playingRange = visibleRange * 0.05;
    const audibleRange = visibleRange * 0.1;
    // default state
    this.state = {
      map: this.props.files[0],
      xAxisComponent: 0,
      yAxisComponent: 1,
      mode: "MANUAL",
      dragStarted: false,
      playPathSpeed: 1,
      xMap: 0.5,
      yMap: 0.5,
      xSelected: 0,
      ySelected: 0,
      visibleRange: visibleRange,
      playingRange: playingRange,
      audibleRange: audibleRange,
      loggingStarted: false,
    };

    // normalize embeddings
    this.normalizeEmbeddings();

    // update axis scales
    this.updateChartScale();

    // get map scales
    this.updateMapScale();

    // play path mode variables
    this.path = [];
    this.pathCounter = 0;

    // log
    this.loggedData = [];
  }

  normalizeEmbeddings() {
  }

  getDefaultVisibleRange() {
    // limit to maximum ~1000 samples per tile (assume uniform distribution)
    const SAMPLES_PER_TILE = 1000;
    const nEmbeddings = this.props.data.length;
    const nTiles = nEmbeddings / SAMPLES_PER_TILE;
    return 1 / nTiles;
  }

  updateChartScale() {
    const getScale = (pixels, offset, visibleRange) => {
      // get embeddings as list
      const viewMin = offset - visibleRange * 0.5;
      const viewMax = offset + visibleRange * 0.5;
      return d3.scaleLinear().domain([viewMin, viewMax]).range([0, pixels]);
    };

    this.xScale = getScale(
      this.props.width,
      this.state.xMap,
      this.state.visibleRange
    );

    this.yScale = getScale(
      this.props.height,
      this.state.yMap,
      this.state.visibleRange
    );
  }

  updateMapScale() {
    this.MAP_WIDTH = 600;
    this.MAP_HEIGHT = 600;
    this.xMapScale = d3.scaleLinear().domain([0, 1]).range([0, this.MAP_WIDTH]);
    this.yMapScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0, this.MAP_HEIGHT]);
  }

  makeArr(startValue, stopValue, cardinality) {
    var arr = [];
    var step = (stopValue - startValue) / (cardinality - 1);
    for (var i = 0; i < cardinality; i++) {
      arr.push(startValue + (step * i));
    }
    return arr;
  }

  findInRange(data, x, y, dx, dy, xComp, yComp) {
    const [x0, y0] = [x - dx, y - dy];
    const [x1, y1] = [x + dx, y + dy];
    let value = data.filter(
      (d) =>
        x0 <= d.embedding[xComp] &&
        d.embedding[xComp] < x1 &&
        y0 <= d.embedding[yComp] &&
        d.embedding[yComp] < y1
    );
    return value;
  }

  decay(value) {
    // EDIT change the decay function to create a different fade in/out effect
    const gain = Math.exp(-value / (this.state.audibleRange * 0.001));
    if (gain < 0.001) return 0;
    return gain;
  }

  updateSeletedRect() {
    const x = this.state.xSelected;
    const y = this.state.ySelected;
    const halfAudibleRange = this.state.audibleRange * 0.5;
    const halfPlayingRange = this.state.playingRange * 0.5 + halfAudibleRange;

    d3.selectAll("#audibleRange")
      .attr("x", this.xScale(x - halfAudibleRange))
      .attr("y", this.yScale(y - halfAudibleRange))
      .attr("height", this.xScale(this.state.audibleRange) - this.xScale(0))
      .attr("width", this.yScale(this.state.audibleRange) - this.yScale(0));

    d3.selectAll("#playingRange")
      .attr("x", this.xScale(x - halfPlayingRange))
      .attr("y", this.yScale(y - halfPlayingRange))
      .attr(
        "height",
        this.xScale(this.state.audibleRange + this.state.playingRange) -
          this.xScale(0)
      )
      .attr(
        "width",
        this.yScale(this.state.audibleRange + this.state.playingRange) -
          this.yScale(0)
      );
  }

  updateMap() {
    this.map
      .selectAll("#visibleRange")
      .attr("x", this.xMapScale(this.state.xMap))
      .attr("y", this.yMapScale(this.state.yMap))
      .attr("height", this.xMapScale(this.state.visibleRange*0.5))
      .attr("width", this.yMapScale(this.state.visibleRange*0.5));
  }

  updateSeleted() {
    const x = this.state.xSelected;
    const y = this.state.ySelected;
    const halfAudibleRange = this.state.audibleRange * 0.5;
    const halfPlayingRange = this.state.playingRange * 0.5 + halfAudibleRange;
    const xComp = this.state.xAxisComponent;
    const yComp = this.state.yAxisComponent;

    // draw selected area
    this.updateSeletedRect();

    // identify samples that should play
    const shouldPlayList = this.findInRange(
      this.props.data,
      x,
      y,
      halfPlayingRange,
      halfPlayingRange,
      xComp,
      yComp
    );

    // extract ids and distance
    let output = {};
    const [x0, y0] = [x - halfAudibleRange, y - halfAudibleRange];
    const [x1, y1] = [x + halfAudibleRange, y + halfAudibleRange];
    shouldPlayList.forEach((d) => {
      let gain = 0;
      if (
        x0 <= d.embedding[xComp] &&
        d.embedding[xComp] < x1 &&
        y0 <= d.embedding[yComp] &&
        d.embedding[yComp] < y1
      ) {
        // calculate distance
        const dist =
          Math.pow(d.embedding[xComp] - x, 2) +
          Math.pow(d.embedding[yComp] - y, 2);
        gain = this.decay(dist);
      }
      // select that shortest distance sample
      const id = d.id;
      const trackName = id.split("-")[0];
      if (!(trackName in output) || output[trackName].val < gain) {
        output[trackName] = { val: gain, id };
      }
    });

    const audible = Object.entries(output).filter(([key, item]) => item.val > 0)
    console.log("NUMBER OF SELECTED SAMPLES", shouldPlayList.length);
    console.log(
      "NUMBER OF AUDIBLE",
      audible.length
    );

    /*
    // change color
    d3.selectAll(".dot").attr("opacity", 0.2);
    Object.entries(output).forEach(([trackName, item]) => {
      d3.select("#dot" + item.id).attr("opacity", 0.8);
    });
    */

    // log
    this.loggedData.push({x, y, audible})
    // dispatch action
    this.props.setAudio(output);
  }

  updateZoom() {
    // update scale
    this.updateChartScale();

    // update circle position
    this.svg
      .selectAll(".dot")
      .attr("cx", (d) =>
        this.xScale(d.embedding[this.state.xAxisComponent])
      )
      .attr("cy", (d) =>
        this.yScale(d.embedding[this.state.yAxisComponent])
      )
      .attr("r", 2.25-this.state.visibleRange);

    // update audible and plaing range selector
    this.updateSeleted();

    // update map position
    this.updateMap();
  }

  selectTrack(x, y) {
    const value = this.findInRange(
      this.props.data,
      this.xScale.invert(x),
      this.yScale.invert(y),
      this.state.audibleRange,
      this.state.audibleRange,
      this.state.xAxisComponent,
      this.state.yAxisComponent
    );
    console.log("SELECT TRACK", value);
    if (value.length < 1) return;
    this.props.setTrack(value[0].id.split("-")[0]);
  }

  mapMoveHandler(direction) {
    let dx = 0;
    let dy = 0;
    switch (direction) {
      default:
        break;
      case "left":
        dx = -0.5;
        break;
      case "right":
        dx = 0.5;
        break;
      case "up":
        dy = -0.5;
        break;
      case "down":
        dy = 0.5;
        break;
    }
    console.log("MAP MOVE", dx, dy);
    this.setState({
      ...this.state,
      xMap: this.state.xMap + dx * this.state.visibleRange,
      yMap: this.state.yMap + dy * this.state.visibleRange,
    });
  }

  moveButtonHandler(direction) {
    // console.log("BUTTON MOVE")
    let dx = 0;
    let dy = 0;
    switch (direction) {
      default:
        break;
      case "left":
        dx = -0.001;
        break;
      case "right":
        dx = 0.001;
        break;
      case "up":
        dy = -0.001;
        break;
      case "down":
        dy = 0.001;
        break;
    }
    this.setState({
      ...this.state,
      xSelected: this.state.xSelected + dx * this.state.visibleRange,
      ySelected: this.state.ySelected + dy * this.state.visibleRange,
    });
  }

  mouseDownHandler(e) {
    // console.log("MOUSE DOWN", e);
    switch (this.state.mode) {
      case "MANUAL": {
        this.setState({
          ...this.state,
          // dragStarted: !this.state.dragStarted,
          xSelected: this.xScale.invert(e.offsetX),
          ySelected: this.yScale.invert(e.offsetY),
        });
        return;
      }
      case "MAKEPATH": {
        this.addNodeToPath(e.offsetX, e.offsetY);
        return;
      }
      case "PLAYTRACK": {
        this.selectTrack(e.offsetX, e.offsetY);
        return;
      }
      default:
        return;
    }
  }

  mouseMoveHandler(e) {
    // console.log("MOUSE MOVE", e);
    if (this.state.mode === "MANUAL" && this.state.dragStarted) {
      this.setState({
        ...this.state,
        xSelected: this.xScale.invert(e.offsetX),
        ySelected: this.yScale.invert(e.offsetY),
      });
    }
  }

  mouseOverTooltipHandler(d) {
    this.tooltip.transition().duration(200).style("opacity", 0.9);
    this.tooltip.text(
      d.id +
        " (" +
        d.embedding[this.state.xAxisComponent] +
        "," +
        d.embedding[this.state.yAxisComponent] +
        ")"
    );
  }

  loggingHandler() {
    this.setState({
      ...this.state,
      loggingStarted: !this.state.loggingStarted,
    });
  }

  changeComponents() {
    console.log(
      "CHANGE TO COMPONENTS",
      this.state.xAxisComponent,
      this.state.yAxisComponent
    );
    // update circle position
    this.svg
      .selectAll(".dot")
      .attr("cx", (d) => {
        return this.x(d.embedding[this.state.xAxisComponent]);
      })
      .attr("cy", (d) => {
        return this.y(d.embedding[this.state.yAxisComponent]);
      });
  }

  loadMap() {
    console.log("Change map universe: ", this.state.map);
    this.map.selectAll("*").remove();
    document.getElementById("mapContainer").innerHTML = "";
    this.svg.selectAll("*").remove();
    document.getElementById("chartContainer").innerHTML = "";
    // import DATA from "./data/" + this.state.map + ".json";
    // this.props.data = DATA;
    this.componentDidMount();
  }

  addNodeToPath(x, y) {
    // add node
    this.svg
      .append("rect")
      .attr("class", "node")
      .attr("x", x)
      .attr("y", y)
      .attr("height", 5)
      .attr("width", 5)
      .style("stroke", "black")
      .style("fill", "none")
      .style("stroke-width", "1px");
    // add node to list
    this.path.push([x, y]);
    // add line
    const i1 = this.path.length - 1;
    const i2 = this.path.length - 2;
    if (this.path.length > 1) {
      this.svg
        .append("line")
        .attr("class", "line")
        .attr("x1", this.path[i1][0])
        .attr("y1", this.path[i1][1])
        .attr("x2", this.path[i2][0])
        .attr("y2", this.path[i2][1])
        .attr("stroke", "red");
    }
  }

  resetPathHandler() {
    this.setState({
      ...this.state,
      mode: "MAKEPATH",
    });
    this.svg.selectAll(".line").remove();
    this.svg.selectAll(".node").remove();
    this.path = [];
  }

  moveAlongPath() {
    if (this.path.length > 0) {
      const steps = 1000 / this.state.playPathSpeed;
      if (this.pathCounter >= (this.path.length - 1) * steps) {
        this.pathCounter = 0;
      }
      const a = (this.pathCounter % steps) / steps;
      const i = Math.floor(this.pathCounter / steps);
      const [x1, y1] = this.path[i];
      const [x2, y2] = this.path[i + 1];
      const posX = x2 * a + x1 * (1 - a);
      const posY = y2 * a + y1 * (1 - a);
      this.setState({
        ...this.state,
        xSelected: this.xScale.invert(posX),
        ySelected: this.yScale.invert(posY),
      });
      this.pathCounter += 1;
      // loop after 1 second
      setTimeout(() => {
        if (this.state.mode === "PLAYPATH") {
          this.moveAlongPath();
        }
      }, 500);
    }
  }

  drawChart() {
    const data = this.props.data;
    const w = this.props.width;
    const h = this.props.height;

    this.svg = d3
      .select("#chartContainer")
      .append("svg")
      .attr("width", w)
      .attr("height", h)
      .style("style", "outline: thin solid black;")
      .on("mousedown", () => this.mouseDownHandler(d3.event))
      .on("mousemove", () => this.mouseMoveHandler(d3.event));

    this.svg.append("rect")
    .attr("width", "100%")
    .attr("height", "100%")
    .attr("fill", "black");

    this.svg.append("g").attr("id", "makers");

    this.tooltip = this.svg
      .append("text")
      .style("font-size", "10px")
      .style("transform", `translate(4px, 12px)`);

    this.svg
      .select("#makers")
      .selectAll(".dot")
      .data(data)
      .enter()
      .append("circle")
      .attr("class", "dot")
      .attr("id", (d, i) => "dot" + d.id)
      .attr("cx", (d, i) =>
        this.xScale(d.embedding[this.state.xAxisComponent])
      )
      .attr("cy", (d, i) =>
        this.yScale(d.embedding[this.state.yAxisComponent])
      )
      .attr("r", 1.5)
      .attr("fill", (d) => d.colormap) //this.colors[d.id.split("-")[0]])

      .attr("opacity", 0.5)
      .on("mouseover", (d) => {
        this.mouseOverTooltipHandler(d);
      })
      .on("mouseout", (d) => {
        this.tooltip.transition().duration(200).style("opacity", 0);
      });

    this.svg
      .append("rect")
      .attr("id", "chartBorder")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", h)
      .attr("width", w)
      .style("stroke", "black")
      .style("fill", "none")
      .style("stroke-width", "1px");

    this.svg
      .append("rect")
      .attr("id", "audibleRange")
      .style("stroke", "white")
      .style("fill", "none")
      .style("stroke-width", "1px");

    this.svg
      .append("rect")
      .attr("id", "playingRange")
      .style("stroke", "gray")
      .style("fill", "none")
      .style("stroke-width", "1px");

    this.updateSeletedRect();
  }

//   this.svg = d3
//   .select("#chartContainer")
//   .append("svg")
//   .attr("width", w)
//   .attr("height", h)
//   .style("style", "outline: thin solid black;")
//   .on("mousedown", () => this.mouseDownHandler(d3.event))
//   .on("mousemove", () => this.mouseMoveHandler(d3.event));

// this.svg.append("rect")
// .attr("width", "100%")
// .attr("height", "100%")
// .attr("fill", "black");

  drawMap() {
    this.map = d3
      .select("#mapContainer")
      .append("svg")
      .attr("width", this.MAP_WIDTH)
      .attr("height", this.MAP_HEIGHT)
      .style("style", "outline: thin solid black;");

      this.map.append("rect")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("fill", "black");

    this.map
      .append("svg:image")
      .attr("xlink:href", "./assets/" + this.props.map_image + ".png")
      .attr("width", this.MAP_WIDTH*1.05)
      .attr("height", this.MAP_HEIGHT*1.05)
      .attr("x", 0)
      .attr("y", 0);

    this.map
      .append("rect")
      .attr("id", "mapBorder")
      .attr("x", 0)
      .attr("y", 0)
      .attr("height", this.MAP_HEIGHT)
      .attr("width", this.MAP_WIDTH)
      .style("stroke", "black")
      .style("fill", "none")
      .style("stroke-width", "1px");

    this.map
      .append("rect")
      .attr("id", "visibleRange")
      .style("stroke", "white")
      .style("fill", "none")
      .style("stroke-width", "1px");

    this.updateMap();
  }

  makeButton(mode, title) {
    return (
      <Button
        className={this.state.mode === mode ? "selected-button" : "base-button"}
        onClick={() => {
          this.setState({
            ...this.state,
            mode: mode,
          });
        }}
      >
        {title}
      </Button>
    );
  }

  makeSlider(min, max, step, value) {
    return (
      <RangeSlider
        min={min}
        max={max}
        step={step}
        size={"sm"}
        value={this.state[value]}
        onChange={(e) =>
          this.setState({
            ...this.state,
            [value]: parseFloat(e.target.value),
          })
        }
        tooltipLabel={(e) => e.toFixed(4)}
        tooltip='off'
      />
    );
  }

  addComponentSelector() {
    return (
      <Form id={"#componentSelector"} className="row-container">
        <Form.Group controlId="componentSelectorGroup">
          <Form.Label> Select component</Form.Label>
          <Form.Control
            as="select"
            value={this.state.xAxisComponent}
            onChange={(e) => {
              this.setState({ ...this.state, x: e.target.value });
            }}
          >
            {Array.from(Array(10).keys()).map((index) => (
              <option key={index}>{index}</option>
            ))}
          </Form.Control>
          <Form.Label> for x-axis, component</Form.Label>
          <Form.Control
            as="select"
            value={this.state.yAxisComponent}
            onChange={(e) => {
              this.setState({ ...this.state, y: e.target.value });
            }}
          >
            {Array.from(Array(10).keys()).map((index) => (
              <option key={index}>{index}</option>
            ))}
          </Form.Control>
          <Form.Label> for y-axis</Form.Label>
        </Form.Group>
      </Form>
    );
  }

  addMapSelector() {
    return (
      <Form>
        <Form.Label>Map:</Form.Label>
        <Form.Control
          as="select"
          onChange={(e) => {
            this.setState({ ...this.state, map: e.target.value });
          }}
        >
          {Array.from(this.props.files).map(item => (
            <option key={item}>{item}</option>
          ))}
        </Form.Control>
      </Form>
    )}

  addSlider(min, max, step, value, text) {
    return (
      <div className="rangeSlider">
        {text} {this.makeSlider(min, max, step, value)}
      </div>
    );
  }

  addNavigator(handler, text) {
    return (
      <div style={{color:"#c5c5c5"}}>
        {text}
        <Button
          onClick={(e) => {
            handler("left");
          }}
          className="mapmove-button"
        >
          LEFT
        </Button>
        <Button
          onClick={(e) => {
            handler("right");
          }}
          className="mapmove-button"
        >
          RIGHT
        </Button>
        <Button
          onClick={(e) => {
            handler("up");
          }}
          className="mapmove-button"
        >
          UP
        </Button>
        <Button
          onClick={(e) => {
            handler("down");
          }}
          className="mapmove-button"
        >
          DOWN
        </Button>
      </div>
    );
  }

  addKeyNavigator(handler) {
    return (
      <div>
        <KeyHandler
          keyEventName={KEYPRESS}
          keyValue="d"
          onKeyHandle={() => {
            handler("right");
          }}
        />
        <KeyHandler
          keyEventName={KEYPRESS}
          keyValue="a"
          onKeyHandle={() => {
            handler("left");
          }}
        />
        <KeyHandler
          keyEventName={KEYPRESS}
          keyValue="w"
          onKeyHandle={() => {
            handler("up");
          }}
        />
        <KeyHandler
          keyEventName={KEYPRESS}
          keyValue="s"
          onKeyHandle={() => {
            handler("down");
          }}
        />
      </div>
    );
  }

  addCoordForm() {
    return (
      <Form>
        <Form.Group controlId="xCoordInputForm">
          <Form.Label>X</Form.Label>
          <Form.Control
            type="number"
            step={0.01}
            onChange={(e) => {
              this.setState({
                ...this.state,
                xSelected: parseFloat(e.target.value),
              });
            }}
          />
        </Form.Group>
        <Form.Group controlId="yCoordInputForm">
          <Form.Label>Y</Form.Label>
          <Form.Control
            type="number"
            step={0.01}
            onChange={(e) => {
              this.setState({
                ...this.state,
                ySelected: parseFloat(e.target.value),
              });
            }}
          />
        </Form.Group>
      </Form>
    );
  }

  componentDidMount() {
    this.drawChart();
    this.drawMap();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.map !== prevState.map){
      this.loadMap();
    }
    else if (
      this.state.xAxisComponent !== prevState.xAxisComponent ||
      this.state.yAxisComponent !== prevState.yAxisComponent
    ) {
      this.changeComponents();
    } else if (this.state.mode !== prevState.mode) {
      if (this.state.mode === "PLAYPATH") {
        this.pathCounter = 0;
        this.moveAlongPath();
      }
      if (this.state.mode !== "PLAYTRACK") {
        this.props.setTrack(undefined);
      }
    } else if (this.props.leadTrackTime !== prevProps.leadTrackTime) {
      const id =
        this.props.leadTrack + "-" + Math.floor(this.props.leadTrackTime);
      const dot = this.svg.select("#dot" + id);
      this.setState({
        ...this.state,
        xSelected: this.xScale.invert(dot.attr("cx")),
        ySelected: this.yScale.invert(dot.attr("cy")),
      });
    } else if (
      this.state.xSelected !== prevState.xSelected ||
      this.state.ySelected !== prevState.ySelected ||
      this.state.audibleRange !== prevState.audibleRange ||
      this.state.playingRange !== prevState.playingRange
    ) {
      console.log(
        "SELECTED x",
        this.state.xSelected,
        "y",
        this.state.ySelected,
        "audible range",
        this.state.audibleRange,
        "playing range",
        this.state.playingRange
      );
      this.updateSeleted();
      if (
        this.state.xSelected >
          this.state.xMap + this.state.visibleRange * 0.5 ||
        this.state.xSelected < this.state.xMap - this.state.visibleRange * 0.5
      ) {
        this.setState({
          ...this.state,
          xMap: this.state.xSelected,
        });
      }

      if (
        this.state.ySelected >
          this.state.yMap + this.state.visibleRange * 0.5 ||
        this.state.ySelected < this.state.yMap - this.state.visibleRange * 0.5
      ) {
        this.setState({
          ...this.state,
          yMap: this.state.ySelected,
        });
      }
    } else if (
      this.state.xMap !== prevState.xMap ||
      this.state.yMap !== prevState.yMap ||
      this.state.visibleRange !== prevState.visibleRange
    ) {
      this.updateZoom();
    } else if (this.state.loggingStarted !== prevState.loggingStarted) {
      if (this.state.loggingStarted) {
        this.loggedData = [];
      } else {
        const handleSaveToPC = (jsonData) => {
          const fileData = JSON.stringify(jsonData);
          const blob = new Blob([fileData], { type: "text/plain" });
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = "filename.json";
          link.href = url;
          link.click();
        };
        handleSaveToPC(this.loggedData);
      }
    }
  }

  render() {
    return (
      <div id="audioControls">
        <div id="range-control">
          {this.addSlider(
            0,
            1 * this.state.visibleRange,
            0.01 * this.state.visibleRange,
            "audibleRange",
            "Audible Range:"
          )}
          {this.addSlider(
            0,
            1 * this.state.visibleRange,
            0.01 * this.state.visibleRange,
            "playingRange",
            "Playing Range Offset:"
          )}
          {this.addSlider(0, 1, 0.01, "visibleRange", "Visible Range:")}
          <p> <br></br> </p>
          {this.addNavigator(this.mapMoveHandler, "Move area:")}
          {this.addKeyNavigator(this.moveButtonHandler)}
        </div>
        <div id="logging-control" className="row-container">
          <Button onClick={this.loggingHandler}>
            {this.state.loggingStarted ? "Stop Log" : "Start Log"}
          </Button>
        </div>
        <div id="mode-control">
          {/* <p>Play Mode:</p> */}
          <div>
            {/* {this.makeButton("MANUAL", "Manual")} */}
            {/* {this.state.dragStarted
              ? "Move mouse around to hear samples. Click to stop."
              : "Click anywhere to start."} */}
            {/* {this.addNavigator(this.moveButtonHandler, "Move selected area:")} */}
            {/* {this.addCoordForm()} */}
          </div>
          <div>
            {/* {this.makeButton("MAKEPATH", "Make Path")} */}
            {/* {this.makeButton("PLAYPATH", "Play Path")} */}
            {/* <Button onClick={this.resetPathHandler}>Reset</Button> */}
            {/* {this.addSlider(1, 50, 1, "playPathSpeed", "Playing Speed:")} */}
          </div>
          {/* <div>
            {this.makeButton("PLAYTRACK", "Play Track")} {this.props.leadTrack}
          </div> */}
        </div>

        {/* {this.addMapSelector()} */}
      </div>
    );
  }
}

export default connect(mapStateToProps, { setAudio, setTrack })(Chart);
