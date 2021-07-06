import { combineReducers } from "redux";

import { SET_AUDIO, SET_TRACK, SET_TRACK_TIME } from "./actions";

const initialState = {
  audioTracks: {},
  leadTrack: undefined,
  leadTrackTime: 0,
};

const audioPlayer = (state = initialState, action) => {
  switch (action.type) {
    case SET_AUDIO: {
      return {
        ...state,
        audioTracks: action.payload
      };
    }
    case SET_TRACK: {
      console.log("SET LEAD TRACK", action.payload)
      return {
        ...state,
        leadTrack: action.payload
      };
    }
    case SET_TRACK_TIME: {
      return {
        ...state,
        leadTrackTime: action.payload
      };
    }
    default:
      return state;
  }
};

export default combineReducers({ audioPlayer });
