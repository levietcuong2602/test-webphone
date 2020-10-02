<template>
  <div class="session">
    <audio ref="localAudio" id="localAudio" controls>
      <p>Your browser doesn't support HTML5 audio.</p>
    </audio>

    <audio ref="remoteAudio" id="remoteAudio" controls>
      <p>Your browser doesn't support HTML5 audio.</p>
    </audio>

    <div class="no-remote-video-info" v-if="noRemoteAudio">{{noRemoteAudio}}</div>
    <div class="controls">
      <el-button @click="handleHangUp">Gác máy</el-button>
      <el-button @click="handleHold">Pause</el-button>
      <el-button @click="handleResume">Resume</el-button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      noRemoteAudio: "",
      localHasVideo: false,
      remoteHasVideo: false,
      localHold: false,
      remoteHold: false,
      canHold: false,
      ringing: false,
      _mounted: false,
    };
  },
  props: {
    session: Object,
  },
  methods: {
    handleHangUp() {
      console.log("handleHangUp()");

      this.session.terminate();
    },

    handleHold() {
      console.log("handleHold()");

      this.session.hold({ useUpdate: true });
    },

    handleResume() {
      console.log("handleResume()");

      this.session.unhold({ useUpdate: true });
    },
    _checkRemoteAudio(stream) {
      if (this._mounted) {
        // const videoTrack = stream.getVideoTracks()[0];
        // this.remoteHasVideo = Boolean(videoTrack);
      }
    },
    _handleRemoteStream(stream) {
      const me = this;
      console.log(`_handleRemoteStream() [stream:${stream}]`);
      const remoteAudio = this.$refs.remoteAudio;
      // Display remote stream
      remoteAudio.srcObject = stream;
      this._checkRemoteAudio(stream);

      stream.addEventListener("addtrack", (event) => {
        const track = event.track;
        if (remoteAudio.srcObject !== stream) return;

        console.log(`remote stream "addtrack" event [track:${track}]`);

        // Refresh remote video
        remoteAudio.srcObject = stream;

        me._checkRemoteAudio(stream);

        track.addEventListener("ended", () => {
          console.log(`remote track "ended" event [track:${track}]`);
        });
      });

      stream.addEventListener("removetrack", () => {
        if (remoteAudio.srcObject !== stream) return;
        console.log('remote stream "removetrack" event');
        // Refresh remote video
        remoteAudio.srcObject = stream;
        me._checkRemoteAudio(stream);
      });
    },
  },
  mounted() {
    console.log({ session: this.session });

    if (this.session.isInProgress() && !this.ringing)
      this.noRemoteAudio = <div class="message">connecting ...</div>;
    else if (this.ringing)
      this.noRemoteAudio = <div class="message">ringing ...</div>;
    else if (this.localHold && this.remoteHold)
      this.noRemoteAudio = <div class="message">both hold</div>;
    else if (this.localHold)
      this.noRemoteAudio = <div class="message">local hold</div>;
    else if (this.remoteHold)
      this.noRemoteAudio = <div class="message">remote hold</div>;
    else if (!this.remoteHasVideo)
      this.noRemoteAudio = <div class="message">no remote video</div>;

    const localAudio = this.$refs.localAudio;
    const session = this.session;
    const peerconnection = session.connection;
    const localStream = peerconnection.getLocalStreams()[0];
    const remoteStream = peerconnection.getRemoteStreams()[0];
    this._mounted = true;

    console.log({ localStream, remoteStream });
    const me = this;
    // Handle local stream
    if (localStream) {
      // Display local stream
      localAudio.srcObject = localStream;
    }

    // If incoming all we already have the remote stream
    if (remoteStream) {
      console.log("already have a remote stream");

      me._handleRemoteStream(remoteStream);
    }

    if (session.isEstablished()) {
      setTimeout(() => {
        me.canHold = true;
      });
    }

    session.on("progress", (data) => {
      console.log('session "progress" event [data:%o]', data);

      if (session.direction === "outgoing") me.ringing = true;
    });

    session.on("accepted", (data) => {
      console.log('session "accepted" event [data:%o]', data);

      if (session.direction === "outgoing") {
        me.$notify({
          type: "success",
          message: "Call answered",
        });
      }

      me.canHold = true;
      me.ringing = false;
    });

    session.on("failed", (data) => {
      console.log('session "failed" event [data:%o]', data);

      me.$notify({
        type: "error",
        message: `call failed Cause: ${data.cause}`,
      });

      if (session.direction === "outgoing") me.ringing = false;
    });

    session.on("ended", (data) => {
      console.log('session "ended" event [data:%o]', data);

      me.$notify({
        type: "error",
        message: `Call ended Cause: ${data.cause}`,
      });

      if (session.direction === "outgoing") me.ringing = false;
    });

    session.on("hold", (data) => {
      const originator = data.originator;

      console.log('session "hold" event [originator:%s]', originator);

      switch (originator) {
        case "local":
          me.localHold = true;
          break;
        case "remote":
          me.remoteHold = true;
          break;
      }
    });

    session.on("unhold", (data) => {
      const originator = data.originator;

      console.log('session "unhold" event [originator:%s]', originator);

      switch (originator) {
        case "local":
          me.localHold = false;
          break;
        case "remote":
          me.remoteHold = false;
          break;
      }
    });

    peerconnection.addEventListener("addstream", (event) => {
      console.log('peerconnection "addstream" event');
      console.log("_handleRemoteStream() | component not mounted");
      me._handleRemoteStream(event.stream);
    });
  },
};
</script>

<style>
</style>