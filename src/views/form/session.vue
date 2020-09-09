<template>
  <div class="session">
    <video ref="localVideo" :class="{'local-video': localHasVideo}" autoplay muted />
    <video ref="remoteVideo" :class="{'remote-video': !noRemoteVideo}" autoplay />

    <div v-if="noRemoteVideo" class="no-remote-video-info">{{ noRemoteVideo }}</div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      noRemoteVideo: "",
      localHasVideo: false,
      remoteHasVideo: false,
      localHold: false,
      remoteHold: false,
      canHold: false,
      ringing: false,
    };
  },
  props: {
    session: Object,
  },
  methods: {
    _checkRemoteVideo(stream) {
      const videoTrack = stream.getVideoTracks()[0];
      this.remoteHasVideo = Boolean(videoTrack);
    },
    _handleRemoteStream(stream) {
      const me = this;
      console.log("_handleRemoteStream() [stream:%o]", stream);
      const remoteVideo = this.refs.remoteVideo;
      // Display remote stream
      remoteVideo.srcObject = stream;
      this._checkRemoteVideo(stream);

      stream.addEventListener("addtrack", (event) => {
        const track = event.track;
        if (remoteVideo.srcObject !== stream) return;
        console.log('remote stream "addtrack" event [track:%o]', track);

        // Refresh remote video
        remoteVideo.srcObject = stream;
        me._checkRemoteVideo(stream);
        track.addEventListener("ended", () => {
          console.log('remote track "ended" event [track:%o]', track);
        });
      });

      stream.addEventListener("removetrack", () => {
        if (remoteVideo.srcObject !== stream) return;
        console.log('remote stream "removetrack" event');
        // Refresh remote video
        remoteVideo.srcObject = stream;
        me._checkRemoteVideo(stream);
      });
    },
  },
  created() {
    if (this.session.isInProgress() && !this.ringing)
      this.noRemoteVideo = <div class="message">connecting ...</div>;
    else if (this.ringing)
      this.noRemoteVideo = <div class="message">ringing ...</div>;
    else if (this.localHold && this.remoteHold)
      this.noRemoteVideo = <div class="message">both hold</div>;
    else if (this.localHold)
      this.noRemoteVideo = <div class="message">local hold</div>;
    else if (this.remoteHold)
      this.noRemoteVideo = <div class="message">remote hold</div>;
    else if (!this.remoteHasVideo)
      this.noRemoteVideo = <div class="message">no remote video</div>;
  },
  mounted() {
    const localVideo = this.refs.localVideo;
    const session = this.session;
    const peerconnection = session.connection;
    const localStream = peerconnection.getLocalStreams()[0];
    const remoteStream = peerconnection.getRemoteStreams()[0];

    const me = this;
    // Handle local stream
    if (localStream) {
      // Clone local stream
      me._localClonedStream = localStream.clone();

      // Display local stream
      localVideo.srcObject = me._localClonedStream;

      setTimeout(() => {
        if (localStream.getVideoTracks()[0]) {
          me.localHasVideo = true;
        }
      }, 1000);
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