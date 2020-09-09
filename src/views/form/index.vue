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
      },
      sipPhone: "",
      session: null,
      incomingSession: null,
    };
  },
  mounted() {
    this.registerUserAgent();
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
      const server = process.env.VUE_APP_WS_SERVER + "/ws";

      console.log({ server });
      const socket = new JsSIP.WebSocketInterface(server);
      console.log({ socket });
      const config = {
        sockets: [socket],
        uri: process.env.VUE_APP_AOR,
        password: process.env.VUE_APP_PASS,
        username: process.env.VUE_APP_USER,
        register: true,
        session_timers: false,
        use_preloaded_route: false,
      };

      console.log({ config });
      if (!config.username || !config.password) return;
      JsSIP.debug.enable("JsSIP:*");
      try {
        this.sipPhone = new JsSIP.UA(config);
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

      this.sipPhone.start();
    },
    onConnecting() {
      const me = this;
      this.sipPhone.on("connecting", () => {
        console.log("UA connecting event");
        me.statusCall = "UA connecting event";
      });
    },
    onConnected() {
      const me = this;
      this.sipPhone.on("connected", function () {
        console.log('UA "connected" event');
        me.statusCall = 'UA "connected" event';
      });
    },
    onRegistered() {
      const me = this;
      this.sipPhone.on("registered", function () {
        console.log('UA "registered" event');
        me.statusCall = 'UA "registered" event';
      });
    },
    onUnregistered() {
      const me = this;
      this.sipPhone.on("unregistered", function () {
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
      const remoteAudio = me.$refs.remoteAudio;
      const localAudio = me.$refs.localAudio;
      this.sipPhone.on("newRTCSession", function (data) {
        console.log('UA "newRTCSession" event');
        me.statusCall = 'UA "newRTCSession" event';

        const { session } = data;
        if (data.originator === "local") return;
        if (me.session || me.incomingSession) {
          console.log('incoming call replied with 486 "Busy Here"');
          session.terminate({
            status_code: 486,
            reason_phrase: "Busy Here",
          });

          return;
        }

        me.handleRinging();
        console.log("Đang đổ chuông ...");

        me.incomingSession = session;
        session.on("failed", () => {
          audioPlayer.stop("ringing");

          console.log("Cuộc gọi thất bại");
          me.session = null;
          me.incomingSession = null;
        });

        session.on("ended", () => {
          console.log("Cuộc gọi kết thúc");
          me.session = null;
          me.incomingSession = null;
        });

        session.on("accepted", () => {
          audioPlayer.stop("ringing");
          console.log("Đã bắt máy");

          me.session = session;
          me.incomingSession = null;
        });

        session.on("confirmed", () => {
          console.log("incoming confirmed");
          var localStream = session.connection.getLocalStreams()[0];
          var dtmfSender = session.connection.createDTMFSender(
            localStream.getAudioTracks()[0]
          );
          session.sendDTMF = function (tone) {
            dtmfSender.insertDTMF(tone);
          };

          console.log({ incommingStream: localStream });
          localAudio.srcObject = localStream;
          const playPromise = localAudio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(function () {
                // Automatic playback started!
              })
              .catch(function (error) {
                // Automatic playback failed.
                // Show a UI element to let the user manually start playback.
              });
          }
        });

        session.on("peerconnection", (e) => {
          console.log("inbound incomming peerconnection: ", e);
          const peerconnection = e.peerconnection;

          peerconnection.onaddstream = function (e) {
            // set remote audio stream (to listen to remote audio)
            // remoteAudio is <audio> element on pag
            console.log("incomming addstream: ", e.stream);

            remoteAudio.srcObject = e.stream;
            const playPromise = remoteAudio.play();

            if (playPromise !== undefined) {
              playPromise
                .then(function () {
                  // Automatic playback started!
                })
                .catch(function (error) {
                  // Automatic playback failed.
                  // Show a UI element to let the user manually start playback.
                });
            }
          };
        });

        // show popup
        console.log({ data });
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
      });
    },
    onDisConnected() {
      const me = this;
      this.sipPhone.on("disconnected", function (e) {
        console.log('UA "disconnected" event');
        me.statusCall = 'UA "disconnected" event';
      });
    },
    // event outbound
    makeCall() {
      // var fixed = this.phoneNumber.replace(/[^a-zA-Z0-9*#/.@]/g, "");
      const me = this;
      console.log("handle out going call ...");
      const remoteAudio = me.$refs.remoteAudio;
      const localAudio = me.$refs.localAudio;
      this.statusCode = "call out to uri: " + this.phoneNumber;
      const uri = this.phoneNumber;
      const outgoingSession = this.sipPhone.call(uri, {
        pcConfig: this.setting,
        mediaConstraints: {
          audio: true,
          video: false,
        },
      });

      outgoingSession.on("connecting", () => {
        me.session = outgoingSession;

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
        me.session = null;

        console.log("Khởi tạo cuộc gọi ra thất bại");
        me.statusCall = "Khởi tạo cuộc gọi ra thất bại";

        me.$notify({
          type: "error",
          message: data.cause,
        });
      });

      outgoingSession.on("ended", () => {
        audioPlayer.stop("ringback");
        me.session = null;

        console.log("Cuộc gọi kết thúc");
        me.statusCall = "Cuộc gọi kết thúc";
      });

      outgoingSession.on("accepted", () => {
        audioPlayer.stop("ringback");
        audioPlayer.play("answered");

        console.log("Đang nghe máy");
        me.statusCall = "Đang nghe máy";
      });

      outgoingSession.on("confirmed", () => {
        console.log("outbound confirmed");

        const localStream = outgoingSession.connection.getLocalStreams()[0];
        console.log({ outgoingStream: localStream });

        localAudio.srcObject = localStream;
        const playPromise = localAudio.play();

        if (playPromise !== undefined) {
          playPromise
            .then(function () {
              // Automatic playback started!
            })
            .catch(function (error) {
              // Automatic playback failed.
              // Show a UI element to let the user manually start playback.
            });
        }
      });

      if (outgoingSession) {
        outgoingSession.connection.addEventListener("addstream", (e) => {
          console.log("outbound addstream: ", e.stream);
          remoteAudio.srcObject = e.stream;
          const playPromise = remoteAudio.play();

          if (playPromise !== undefined) {
            playPromise
              .then(function () {
                // Automatic playback started!
              })
              .catch(function (error) {
                // Automatic playback failed.
                // Show a UI element to let the user manually start playback.
              });
          }
        });
      }
    },
    rejectCall() {
      console.log("Reject call incoming");
      console.log({ incomingSession: this.incomingSession });
      this.incomingSession.terminate();
    },
    answerCall() {
      console.log("Anwser call incoming");
      console.log({ incomingSession: this.incomingSession });
      this.incomingSession.answer({ pcConfig: this.setting });
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
