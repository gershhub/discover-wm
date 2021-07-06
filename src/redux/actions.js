export const SET_AUDIO = "SET_AUDIO";
export const SET_TRACK = "SET_TRACK";
export const SET_TRACK_TIME = "SET_TRACK_TIME";

export const setAudio = payload => ({
  type: SET_AUDIO,
  payload: payload
});

export const setTrack = payload => ({
  type: SET_TRACK,
  payload: payload
});

export const setTrackTime = payload => ({
  type: SET_TRACK_TIME,
  payload: payload
})