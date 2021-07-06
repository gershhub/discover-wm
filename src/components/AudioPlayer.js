import React from "react";
import { connect } from "react-redux";

import { setTrackTime } from "../redux/actions";

const NVOICES = 30;

const mapStateToProps = (state, props) => {
  const { audioTracks, leadTrack } = state.audioPlayer;
  return { audioTracks, leadTrack };
};

class AudioPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: [],
      audible: [],
      playing: {},
      trigger: {},
      loopLength: 10000,
      timestep: 2.5,
      leadTrackPlaying: false,
    };
    this.voices = [];
    this.setTime = this.setTime.bind(this);
    this.stop = this.stop.bind(this);
    this.play = this.play.bind(this);
    this.face = this.fade.bind(this);
    this.update = this.update.bind(this);
    this.stopTrack = this.stopTrack.bind(this);
  }

  componentDidMount() {
    // initialize an audio context
    this.audioCtx = new AudioContext();

    // load a subset of the audio
    for (let i = 0; i < NVOICES; i++) {
      // const file = this.props.files[i];
      const id = undefined;
      let audioElement  = new Audio();
      audioElement.loop = true;
      audioElement.preload = "auto";
      let source = this.audioCtx.createMediaElementSource(audioElement);
      let gain = this.audioCtx.createGain();
      source.connect(gain);
      gain.connect(this.audioCtx.destination);
      const voice = {
        index: i,
        id,
        audioElement,
        source,
        gain,
      };
      this.voices[i] = voice;
    }

    // lead track audio
    this.leadTrackAudioElement = new Audio();
    this.leadTrackAudioElement.loop = true;
    this.leadTrackAudioElement.preload = "auto";
    this.leadTrachSource = this.audioCtx.createMediaElementSource(
      this.leadTrackAudioElement
    );
    this.leadTrackGain = this.audioCtx.createGain();
    this.leadTrachSource.connect(this.leadTrackGain);
    this.leadTrackGain.connect(this.audioCtx.destination);

    // start update loop
    this.fade();
  }

  componentWillUnmount() {
    // Close context on unmount
    this.audioContext.close();
  }

  async play(trackName) {
    // resume audio context
    if (this.audioCtx.state === "suspended") {
      await this.audioCtx.resume();
    }
    // if (trackName === this.props.leadTrack) {
    //   // try {
    //   //   // get track info
    //   //   const file = this.props.files.filter(
    //   //     (item) => item.id === trackName
    //   //   )[0];
    //   //   // update the source property
    //   //   this.leadTrackAudioElement.src = file.filename;
    //   //   await this.leadTrackAudioElement.load();
    //   //   // play track
    //   //   console.log("PLAY TRACK", trackName);
    //   //   await this.leadTrackAudioElement.play();
    //   //   // set gain
    //   //   this.leadTrackGain.gain.value = 1;
    //   //   // add track to playing list
    //   //   this.setState({ ...this.state, leadTrackPlaying: true });
    //   // } catch (e) {
    //   //   console.log(e);
    //   // }
    // } else {

    // check if there are free voice track
    let freeVoices = this.voices.filter((voice) => voice.id === undefined);
    // if there are free voice tracks then proceed
    if (freeVoices.length > 0) {
      try {
        // select voice index
        const index = freeVoices[0].index;
        // update the source property
        this.voices[index].id = trackName; //file.id;
        this.voices[index].audioElement.src = "http://localhost:3000/sample/" + trackName + ".mp3"; //file.filename;
        await this.voices[index].audioElement.load("./assets/demo.m4a");
        // play track
        // console.log("PLAY TRACK", trackName, "Voice", index);
        await this.voices[index].audioElement.play();
        // play sliently
        this.voices[index].gain.gain.value = 0;
        // add track to playing list
        const playing = { ...this.state.playing, [trackName]: index };
        this.setState({ ...this.state, playing });
      } catch (e) {
        console.log(e);
      }
    }
    // }
    // clear loading state
    const loading = this.state.loading.filter((item) => item !== trackName);
    this.setState({ ...this.state, loading });
  }

  async setTime(trackName, currentTimeIndex){ //id) {
    // this.audio[trackName].currentTime = currentTime;
    // loop after x second if still in audioTrack (should play) list
    if (this.state.audible.includes(trackName)) {
      const currentTime = currentTimeIndex * this.state.timestep;
      // console.log("START LOOP", trackName, currentTime);
      
      // go to specified time
      const index = this.state.playing[trackName];
      this.voices[index].audioElement.currentTime = currentTime;

      // setTimeout(() => {
      //   this.setTime(trackName, currentTimeIndex);
      // }, this.state.loopLength + Math.floor(Math.random() * 10));
    }
  }

  async playTrack(trackName) {
    // play track
    console.log("PLAY TRACK FULL", trackName);
    if (!(trackName in this.state.playing)) {
      if (!this.state.loading.includes(trackName)) {
        this.setState({
          ...this.state,
          loading: [...this.state.loading, trackName],
        });
      }
    }
  }

  async stopTrack() {
    console.log("STOP LEAD TRACK");
    if (this.state.leadTrackPlaying) {
      try {
        // pause track
        await this.leadTrackAudioElement.pause();
        this.setState({ ...this.state, leadTrackPlaying: false });
      } catch (e) {
        console.log(e);
      }
    }
  }

  async stop(trackName) {
    console.log("STOP TRACK", trackName);
    try {
      // find the voice index
      const index = this.state.playing[trackName];
      // pause track
      await this.voices[index].audioElement.pause();
      // mark voice as free
      this.voices[index].id = undefined;
      // update the playing list
      let playing = { ...this.state.playing };
      delete playing[trackName];
      this.setState({ ...this.state, playing });
    } catch (e) {
      console.log(e);
    }
  }

  update(trackName, val = 0, currentTime = 0) {
    // if track is not lead track then use loop and gain
    if (trackName !== this.props.leadTrack) {
      // check if track is playing, if not start loading/playing
      if (!(trackName in this.state.playing)) {
        if (!this.state.loading.includes(trackName)) {
          this.setState({
            ...this.state,
            loading: [...this.state.loading, trackName],
          });
        }
      } else {
        // find the voice index
        const index = this.state.playing[trackName];
        
        // set gain
        const oldGain = this.voices[index].gain.gain.value;
        // console.log("SET GAIN", oldGain, val, trackName);
        // EDIT here to change the step size and fade in/out speed
        if (oldGain < val - 0.0001) {
          this.voices[index].gain.gain.value = Math.min(oldGain + 0.01, 1);
        } else if (oldGain > val) {
          this.voices[index].gain.gain.value = Math.max(oldGain - 0.01, 0);
        }
        // this.voices[index].gain.gain.value = val;

        // start/stop looping
        const newGain = this.voices[index].gain.gain.value;
        if (this.state.audible.includes(trackName)) {
          // if track is audible, check if it has become not audible
          if (newGain <= 0.0001 && oldGain > 0.0001) {
            // remove track from audible list which will trigger stop playing
            console.log("STOP LOOPING", trackName, currentTime);
            const audible = this.state.audible.filter(
              (item) => item !== trackName
            );
            this.setState({ ...this.state, audible });
          }
        } else {
          // is track is not audible, check if it has become audible
          if (newGain > 0 && oldGain <= 0) {
            // add track to audible list
            console.log("START LOOPING", trackName, currentTime);
            this.setState({
              ...this.state,
              audible: [...this.state.audible, trackName],
            });
            this.setTime(trackName, currentTime);
          }
        }
      }
    }
  }

  fade() {
    // remove tracks that should not be playing
    Object.entries(this.state.playing).forEach(([trackName, item]) => {
      const shouldPlay =
        trackName in this.props.audioTracks ||
        this.state.audible.includes(trackName);
      if (!shouldPlay) {
        this.stop(trackName);
      }
    });

    // update all tracks that should be playing
    Object.entries(this.props.audioTracks).forEach(([trackName, item]) => {
      this.update(trackName, item.val, item.id.split("-")[1]);
    });

    // update tracks that are audible but should fade out
    this.state.audible.forEach((trackName) => {
      if (!(trackName in this.props.audioTracks)) {
        this.update(trackName, 0);
      }
    });

    // update lead track time state
    if (this.props.leadTrack !== undefined && this.state.leadTrackPlaying) {
      this.props.setTrackTime(Math.floor(this.leadTrackAudioElement.currentTime / 5 / this.state.timestep));
    }

    // loop after 1 second
    setTimeout(() => {
      this.face();
    }, 10);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.props.leadTrack !== prevProps.leadTrack) {
      if (this.props.leadTrack !== undefined) {
        // play track and update state of currentTime
        this.playTrack(this.props.leadTrack);
      } else {
        // stop playing leadTrack
        this.stopTrack();
      }
    } else if (this.state.loading !== prevState.loading) {
      const newTracks = this.state.loading.filter(
        (item) => !prevState.loading.includes(item)
      );
      // start playing
      newTracks.forEach((item) => this.play(item));
    }
  }

  render() {
    return (
      <div id="fileActivity">
        <div>
          audible:
          {this.state.audible.map((item) => {
            const trackName = item.split("-")[0];
            const index = this.state.playing[trackName];
            if (index === undefined) {
              console.log("WARNING audible but not playing");
              return (<div></div>);
            }
            const gain = this.voices[index].gain.gain.value;
            return (
              <div key={item + gain}>
                {item} | gain: {gain}
              </div>
            );
          })}
        </div>
        <div>
          playing:
          {Object.entries(this.state.playing).map((key, item) => {
            return (
              <div key={key}>
                {key} | voice: {item}
              </div>
            );
          })}
        </div>
        <div>
          loading:
          {this.state.loading.map((item) => {
            return <div key={item}>{item}</div>;
          })}
        </div>
      </div>
    );
  }
}

export default connect(mapStateToProps, { setTrackTime })(AudioPlayer);
