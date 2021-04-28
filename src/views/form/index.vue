<template>
  <div class="dashboard-container">
    <div class="status">
      <p class="text-center">{{ statusCall }}</p>
    </div>
    <div class="phone-number">
      <el-input v-model="phoneNumber">
        <el-button slot="append" @click="makeCall">Gọi</el-button>
      </el-input>
    </div>
    <div class="action">
      <el-button @click="answerCall">Nghe máy</el-button>
      <el-button @click="rejectCall">Gác máy</el-button>
      <el-button @click="exitPhone">Thoát</el-button>
      <el-button @click="setMute">setMute</el-button>
      <el-button @click="setHold">setHold</el-button>
    </div>
    <div class="test-audio">
      <el-button @click="handleRinging">Ringing</el-button>
      <el-button @click="handleRingback">Ringback</el-button>
      <el-button @click="handleAnswer">Answered</el-button>
      <el-button @click="handleReject">Rejected</el-button>
    </div>

    <audio ref="localAudio" id="localAudio" controls>
      <p>Your browser doesn't support HTML5 audio.</p>
    </audio>

    <audio ref="remoteAudio" id="remoteAudio" controls>
      <p>Your browser doesn't support HTML5 audio.</p>
    </audio>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import JsSIP from "jssip";
import audioPlayer from "@/utils/audioPlayer";

export default {
  name: "Dashboard",
  computed: {
    ...mapGetters(["name"]),
  },
  data() {
    return {
      statusCall: "Start",
      phoneNumber: "",
      setting: {
        rtcpMuxPolicy: "negotiate",
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
        iceTransportPolicy: "all",
      },
      sipPhone: "",
      outgoingSession: null,
      incomingSession: null,
      _mounted: false,
    };
  },
  mounted() {
    this._mounted = true;
    try {
      this.registerUserAgent();
    } catch (error) {
      console.log({ errorMessage: error.message });
    }

    // event out going session
    // this.eventHandlers();
  },
  methods: {
    // tesst audio player
    handleRinging() {
      audioPlayer.play("ringing");
    },
    handleRingback() {
      audioPlayer.play("ringback");
    },
    handleAnswer() {
      audioPlayer.play("answered");
    },
    handleReject() {
      audioPlayer.play("rejected");
    },

    // init call
    registerUserAgent() {
      // eslint-disable-next-line
      // const server = process.env.VUE_APP_WS_SERVER + "/ws";
      const domain = "dev-sip.aicallcenter.vn";
      // const domain = "devsip.vbeecore.com";
      const server = `wss://${domain}:7443/ws`;

      const socket = new JsSIP.WebSocketInterface(server);
      const config = {
        sockets: [socket],
        uri: `sip:1001@${domain}`,
        password: "1234",
        username: "1001",
        register: true,
        session_timers: false,
        use_preloaded_route: false,
      };

      console.log({ socket, config });
      if (!config.username || !config.password) return;
      JsSIP.debug.enable("JsSIP:*");

      try {
        this.sipPhone = new JsSIP.UA(config);
        this.sipPhone.start();
      } catch (error) {
        console.error({ error: error.message });
        this.statusCode = error.message;
        alert("ERROR:" + error.message);
        throw error;
      }

      this.onConnecting();
      this.onConnected();
      this.onRegistered();
      this.onUnregistered();
      this.onRegistrationFailed();
      this.onNewRTCSession();
      this.onDisConnected();
    },
    onConnecting() {
      const me = this;
      this.sipPhone.on("connecting", () => {
        if (!me._mounted) return;

        console.log("UA connecting event");
        me.statusCall = "UA connecting event";
      });
    },
    onConnected() {
      const me = this;
      this.sipPhone.on("connected", function () {
        if (!me._mounted) return;

        console.log('UA "connected" event');
        me.statusCall = 'UA "connected" event';
      });
    },
    onRegistered() {
      const me = this;
      this.sipPhone.on("registered", function () {
        if (!me._mounted) return;

        console.log('UA "registered" event');
        me.statusCall = 'UA "registered" event';
      });
    },
    onUnregistered() {
      const me = this;
      this.sipPhone.on("unregistered", function () {
        if (!me._mounted) return;

        console.log('UA "unregistered" event');

        if (me.sipPhone.isConnected()) {
          me.statusCall = "connected";
        } else {
          me.statusCall = "disconnected";
        }
      });
    },
    onRegistrationFailed() {
      const me = this;
      this.sipPhone.on("registrationFailed", function (data) {
        if (!me._mounted) return;
        console.log('UA "registrationFailed" event');

        if (me.sipPhone.isConnected()) {
          me.statusCall = "connected";
        } else {
          me.statusCall = "disconnected";
        }

        console.log("onRegistrationFailed with case: " + data.cause);
        me.$notify({
          type: "error",
          message: "Registration failed" + data.cause,
        });
      });
    },
    onNewRTCSession() {
      // inbound
      const me = this;
      const localAudio = me.$refs.localAudio;
      const remoteAudio = me.$refs.remoteAudio;
      this.sipPhone.on("newRTCSession", function (data) {
        if (!me._mounted) return;

        console.log('UA "newRTCSession" event');
        me.statusCall = 'UA "newRTCSession" event';

        const { session } = data;
        if (data.originator === "local") return;
        if (me.outgoingSession || me.incomingSession) {
          console.log('incoming call replied with 486 "Busy Here"');
          session.terminate({
            status_code: 486,
            reason_phrase: "Busy Here",
          });

          return;
        }

        me.incomingSession = session;
        console.log({ session });

        if (session.direction === "incoming") {
          me.handleRinging();

          console.log("Đang đổ chuông ...");

          session.on("accepted", () => {
            console.log("Sự kiện accepted gọi vào");
            audioPlayer.stop("ringing");
            console.log("Đã bắt máy");
          });

          session.on("confirmed", function () {
            console.log("Sự kiện confirmed gọi vào");
            //the call has connected, and audio is playing
            const localStream = session.connection.getLocalStreams()[0];
            console.log({ localStream });
            if (localStream) {
              localAudio.srcObject = localStream;

              const dtmfSender = session.connection.createDTMFSender(
                localStream.getAudioTracks()[0]
              );
              console.log({ dtmfSender });
            }
          });

          session.on("ended", () => {
            console.log("Sự kiện ended gọi vào");
            console.log("Cuộc gọi kết thúc");
            me.incomingSession = null;
            me.outgoingSession = null;
          });

          session.on("failed", () => {
            console.log("Sự kiện failed gọi vào");
            audioPlayer.stop("ringing");
            console.log("Cuộc gọi thất bại");

            me.incomingSession = null;
            me.outgoingSession = null;
          });

          session.on("addstream", function (e) {
            console.log("Sự kiện addstream gọi vào");
            me.handleRemoteStream(e.stream);
          });
          // stream
          session.on("peerconnection", function (event) {
            console.log("Sự kiện peerconnection gọi vào");
            event.peerconnection.addEventListener("addstream", function (e) {
              console.log('peerconnection "addstream" event');
              console.log({ mounted: me._mounted });
              if (!me._mounted) {
                console.log("_handleRemoteStream() | component not mounted");
                return;
              }

              me.handleRemoteStream(e.stream);
            });
            event.peerconnection.addEventListener("removeStream", function (e) {
              console.log('peerconnection "removeStream" event', event.stream);
              if (!me._mounted) {
                console.log("_handleRemoteStream() | component not mounted");
                return;
              }

              remoteAudio.srcObject = e.stream;
              remoteAudio.stop();
            });
          });

          console.log({ data });

          // show popup
          const {
            request: {
              from: { _display_name },
            },
          } = data;

          me.$confirm(
            `${_display_name} đang thực hiện cuộc gọi đến ...`,
            "Đổ chuông",
            {
              confirmButtonText: "Bắt máy",
              cancelButtonText: "Hủy",
              type: "warning",
            }
          )
            .then(() => {
              me.$message({
                type: "success",
                message: "Đã bắt máy",
              });

              me.answerCall();
            })
            .catch(() => {
              me.$message({
                type: "error",
                message: "Đã từ chối cuộc gọi",
              });

              me.rejectCall();
            });
        }
      });
    },
    onDisConnected() {
      const me = this;
      this.sipPhone.on("disconnected", function (e) {
        if (!me._mounted) return;

        console.log('UA "disconnected" event');
        me.statusCall = 'UA "disconnected" event';
      });
    },
    // event outbound
    handleRemoteStream(remoteStream) {
      console.log("handleRemoteStream: ", remoteStream);
      // play audio remote
      const me = this;
      const remoteAudio = me.$refs.remoteAudio;

      remoteAudio.srcObject = remoteStream;
      const playPromise = remoteAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(function () {
            console.log("play audio remote stream successfull!");
          })
          .catch(function (error) {
            console.log(`play audio remote stream error with ${error.message}`);
          });
      }

      remoteStream.addEventListener("addtrack", (event) => {
        const track = event.track;
        if (remoteAudio.srcObject !== remoteStream) return;

        console.log('remote stream "addtrack" event [track:%o]', track);
        // Refresh remote audio
        remoteAudio.srcObject = remoteStream;
        const playPromise = remoteAudio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("play audio remote stream successfull!");
            })
            .catch((error) => {
              console.log(
                `play audio remote stream error with ${error.message}`
              );
            });
        }

        track.addEventListener("ended", () => {
          console.log('remote track "ended" event [track:%o]', track);
        });
      });

      remoteStream.addEventListener("removetrack", () => {
        if (remoteAudio.srcObject !== remoteStream) return;
        console.log('remote stream "removetrack" event');

        // Refresh remote audio
        remoteAudio.srcObject = remoteStream;
      });
    },

    makeCall() {
      // var fixed = this.phoneNumber.replace(/[^a-zA-Z0-9*#/.@]/g, "");
      const me = this;
      console.log("handle out going call ...");
      const localAudio = me.$refs.localAudio;

      this.statusCode = "call out to uri: " + this.phoneNumber;
      const uri = this.phoneNumber;
      const outgoingSession = this.sipPhone.call(uri, {
        pcConfig: this.setting,
        mediaConstraints: {
          audio: true,
          video: false,
        },
        rtcOfferConstraints: {
          offerToReceiveAudio: 1,
          offerToReceiveVideo: 0,
        },
      });

      me.outgoingSession = outgoingSession;
      outgoingSession.on("connecting", () => {
        me.outgoingSession = outgoingSession;

        console.log(`Đang kết nối tới ${uri}`);
        me.statusCall = `Đang kết nối tới ${uri}`;
      });

      outgoingSession.on("progress", () => {
        audioPlayer.play("ringback");
        console.log("Đang đổ chuông");
        me.statusCall = "Đang đổ chuông";
      });

      outgoingSession.on("failed", (data) => {
        audioPlayer.stop("ringback");
        audioPlayer.play("rejected");
        me.outgoingSession = null;

        console.log("Khởi tạo cuộc gọi ra thất bại");
        me.statusCall = "Khởi tạo cuộc gọi ra thất bại";

        me.$notify({
          type: "error",
          message: data.cause,
        });
      });

      outgoingSession.on("ended", () => {
        audioPlayer.stop("ringback");
        me.outgoingSession = null;

        console.log("Cuộc gọi kết thúc");
        me.statusCall = "Cuộc gọi kết thúc";
      });

      outgoingSession.on("accepted", () => {
        audioPlayer.stop("ringback");
        audioPlayer.play("answered");

        console.log("Đang nghe máy");
        me.statusCall = "Đang nghe máy";
      });

      outgoingSession.on("confirmed", function () {
        //the call has connected, and audio is playing
        console.log("outgoing confirmed");
        const localStream = outgoingSession.connection.getLocalStreams()[0];
        if (localStream) {
          localAudio.srcObject = localStream;
          const playPromise = localAudio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(function () {
                console.log("play audio local stream successfull!");
              })
              .catch(function (error) {
                console.log(
                  `play audio local stream error with ${error.message}`
                );
              });
          }
        }
      });

      outgoingSession.on("addstream", function (e) {
        console.log("outgoing addstream");
        me.handleRemoteStream(e.stream);
      });

      if (outgoingSession) {
        outgoingSession.connection.addEventListener("addstream", (e) => {
          console.log("outgoing outgoingSession.connection.addstream");

          me.handleRemoteStream(e.stream);
        });
      }

      outgoingSession.on("peerconnection", function (data) {
        console.log("outgoing on peerconnection");
        data.peerconnection.addEventListener("addstream", function (event) {
          console.log('peerconnection "addstream" event');
          me.handleRemoteStream(event.stream);
        });
      });
    },
    eventHandlers() {
      const me = this;
      if (!me.outgoingSession) return;

      const remoteAudio = me.$refs.remoteAudio;
      const localAudio = me.$refs.localAudio;

      const session = me.outgoingSession;
      const peerconnection = session.connection;
      if (peerconnection) {
        const localStream = peerconnection.getLocalStreams()[0];
        const remoteStream = peerconnection.getRemoteStreams()[0];

        // Handle local stream
        if (localStream) {
          // Display local stream
          localAudio.srcObject = localStream;
          const playPromise = localAudio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(function () {
                console.log("play audio local stream successfull!");
              })
              .catch(function (error) {
                console.log(
                  `play audio local stream error with ${error.message}`
                );
              });
          }
        }

        // If incoming all we already have the remote stream
        if (remoteStream) {
          console.log("already have a remote stream");

          me.handleRemoteStream(remoteStream);
        }

        if (session.isEstablished()) {
          console.log({ isEstablished: true });
        }

        session.on("progress", (data) => {
          if (!me._mounted) return;

          console.log(`session "progress" event [data:${data}]`);

          if (session.direction === "outgoing") {
            console.log("ringing ...");
          }
        });

        session.on("accepted", (data) => {
          if (!me._mounted) return;

          console.log(`session "accepted" event [data:${data}]`);

          if (session.direction === "outgoing") {
            me.$notify({ type: "error", message: "Call answered" });
          }

          console.log(`both holding...`);
        });

        session.on("failed", (data) => {
          if (!me._mounted) return;
          console.log(`session "failed" event [data:${data}]`);

          me.$notify({
            type: "error",
            message: `Call failed Call Cause: ${data.cause}`,
          });

          if (session.direction === "outgoing") {
            console.log("failed");
          }
        });

        session.on("ended", (data) => {
          if (!me._mounted) return;

          console.log(`session "ended" event [data:${data}]`);
          me.$notify({
            type: "error",
            message: `Call ended Call Cause: ${data.cause}`,
          });

          if (session.direction === "outgoing") {
            console.log("ended");
          }
        });

        peerconnection.addEventListener("addstream", (event) => {
          console.log('peerconnection "addstream" event');

          me.handleRemoteStream(event.stream);
        });
      }

      session.on("peerconnection", function (data) {
        data.peerconnection.addEventListener("addstream", function (e) {
          console.log('peerconnection "addstream" event');

          // if (!me._mounted) {
          //   console.log("_handleRemoteStream() | component not mounted");
          //   return;
          // }

          me.handleRemoteStream(e.stream);
        });
      });
    },
    rejectCall() {
      console.log("Reject call incoming");
      console.log({
        incomingSession: this.incomingSession,
        outgoingSession: this.outgoingSession,
      });
      if (this.incomingSession) {
        this.incomingSession.terminate();
      }
      if (this.outgoingSession) {
        this.outgoingSession.terminate();
      }
    },
    answerCall() {
      console.log("Anwser call incoming");
      console.log({ incomingSession: this.incomingSession });
      const callOptions = {
        mediaConstraints: {
          audio: true, // only audio calls
          video: false,
        },
        pcConfig: {
          iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
          iceTransportPolicy: "all",
          rtcpMuxPolicy: "negotiate",
        },
      };
      this.incomingSession.answer(callOptions);

      // this.incomingSession.connection.addEventListener("addstream", (event) => {
      //   console.log(event.stream);
      //   const remoteAudio = this.$refs.remoteAudio;
      //   remoteAudio.srcObject = event.stream;
      // });
    },
    setMute(value) {
      if (value) {
        this.sipPhone.mute();
      } else {
        this.unmute();
      }
    },
    setHold(value) {
      if (value) {
        this.sipPhone.hold();
      } else {
        this.unhold();
      }
    },
    exitPhone() {
      console.log("exit phone()");

      this.sipPhone.stop();
    },
  },
};
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  .text-center {
    text-align: center;
  }
  .diapad-key {
    width: 30%;
    margin-top: 10px;
  }
}
</style>
