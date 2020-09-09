const FILES = require("./sounds.json");
const SOUNDS = new Map([
  ["ringback", { audio: new Audio(FILES["ringback"]), volume: 1.0 }],
  ["ringing", { audio: new Audio(FILES["ringing"]), volume: 1.0 }],
  ["answered", { audio: new Audio(FILES["answered"]), volume: 1.0 }],
  ["rejected", { audio: new Audio(FILES["rejected"]), volume: 0.5 }]
]);

let initialized = false;

module.exports = {
  /**
   * Play all the sounds so they will play in mobile browsers at any time
   */
  initialize() {
    if (initialized) return;

    console.log("initialize()");

    for (const sound of SOUNDS.values()) {
      sound.audio.volume = 0;

      try {
        const playPromise = sound.audio.play();

        if (playPromise !== undefined) {
          playPromise
            .then(function() {
              // Automatic playback started!
            })
            .catch(function(error) {
              // Automatic playback failed.
              // Show a UI element to let the user manually start playback.
            });
        }
      } catch (error) {}
    }

    initialized = true;
  },

  /**
   * Play a sound
   * @param {String} name - Sound name
   * @param {[Float]} relativeVolume - Relative volume (0.0 - 1.0)
   */
  play(name, relativeVolume) {
    this.initialize();

    if (typeof relativeVolume !== "number") relativeVolume = 1.0;

    console.log(`play() [name:${name}, relativeVolume:${relativeVolume}]`);

    const sound = SOUNDS.get(name);

    if (!sound) throw new Error(`unknown sound name "${name}"`);

    try {
      sound.audio.pause();
      sound.audio.currentTime = 0.0;
      sound.audio.volume = (sound.volume || 1.0) * relativeVolume;
      const playPromise = sound.audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(function() {
            // Automatic playback started!
          })
          .catch(function(error) {
            // Automatic playback failed.
            // Show a UI element to let the user manually start playback.
          });
      }
    } catch (error) {
      console.log("play() | error: ", error);
    }
  },

  stop(name) {
    console.log(`stop() [name:${name}]`);

    const sound = SOUNDS.get(name);

    if (!sound) throw new Error(`unknown sound name "${name}"`);

    sound.audio.pause();
    sound.audio.currentTime = 0.0;
  }
};
