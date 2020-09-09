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
    <div class="wrap-diapad mt-10">
      <div v-for="(row, index) in keypads" :key="'row-'+index" class="diapad-row">
        <el-button v-for="keypad in row" :key="keypad.diapad" class="diapad-key">
          <span class="Text diapad-key-number">{{ keypad.diapad }}</span>
          <span class="Text diapad-key-text">{{ keypad.text }}</span>
        </el-button>
      </div>
    </div>

    <div class="sction">
      <el-button @click="answerCall">Nghe máy</el-button>
      <el-button @click="rejectCall">Gác máy</el-button>
      <!-- <el-button @click="exitPhone">Thoát</el-button> -->
    </div>
    <audio ref="remoteAudio" id="remoteAudio" controls>
      <p>Your browser doesn't support HTML5 audio.</p>
    </audio>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import * as SIP from "sip.js";
import { getAudioElement, wait } from "@/utils/sip";

export default {
  name: "Dashboard",
  computed: {
    ...mapGetters(["name"]),
  },
  data() {
    return {
      statusCall: "Start",
      phoneNumber: "",
      keypads: [
        [
          { diapad: 1, text: "" },
          { diapad: 2, text: "A B C" },
          { diapad: 3, text: "D E F" },
        ],
        [
          { diapad: 4, text: "G H I" },
          { diapad: 5, text: "J K L" },
          { diapad: 6, text: "M N O" },
        ],
        [
          { diapad: 7, text: "P Q R S" },
          { diapad: 8, text: "T U V" },
          { diapad: 9, text: "W X Y Z" },
        ],
        [
          { diapad: "*", text: "" },
          { diapad: 0, text: "" },
          { diapad: "#", text: "" },
        ],
      ],
      sipPhone: "",
    };
  },
  created() {
    this.registerUserAgent();
  },
  methods: {
    registerUserAgent() {
      // eslint-disable-next-line
      const config = {
        uri: process.env.VUE_APP_AOR,
        wsServers: [process.env.VUE_APP_WS_SERVER], // +':7443'
        authorizationUser: process.env.VUE_APP_USER,
        password: process.env.VUE_APP_PASS,
        userAgentString: "WebPhone/0.0.1",
      };

      console.log({ config });
      try {
        this.sipPhone = new SIP.WebRTC.Simple({
          media: {
            remote: {
              audio: getAudioElement("remoteAudio"),
            },
          },
          ua: config,
        });
      } catch (error) {
        console.error({ error: error.message });
        this.statusCode = error.message;
        alert("ERROR:" + error.message);
        return;
      }

      this.onConnected();
      this.onRegistered();
      this.onUnregistered();
      this.onRegistrationFailed();
      this.onRinging();
      this.onDisConnected();
      this.onEnded();

      // WebSocket events
      const me = this;
      this.sipPhone.ua.on("disconnected", function (e) {
        me.statusCall = "WS disconnected";
      });
      this.sipPhone.ua.on("connecting", function (e) {
        me.statusCall = "WS connecting";
      });

      this.statusCall = "connecting ...";
    },
    onConnected() {
      const me = this;
      this.sipPhone.on("connected", function () {
        console.log("connected");
        me.statusCall = "connected";
      });
    },
    onRegistered() {
      const me = this;
      this.sipPhone.on("registered", function () {
        console.log("registered");
        me.statusCall = "registered";
        // eslint-disable-next-line
        // SIP.WebRTC.isSupported();
        // // eslint-disable-next-line
        // SIP.WebRTC.getUserMedia(
        //   this.audioConstraints,
        //   function (stream) {
        //     console.log(stream);
        //     this.mediaStream = stream;
        //   },
        //   function (e) {
        //     console.error(e);
        //   }
        // );
      });
    },
    onUnregistered() {
      const me = this;
      this.sipPhone.on("unregistered", function () {
        console.log("unregistered");
        me.statusCall = "unregistered";
      });
    },
    onRegistrationFailed() {
      const me = this;
      this.sipPhone.on("registrationFailed", function () {
        console.log("registrationFailed");
        me.statusCall = "registrationFailed";
      });
    },
    onRinging() {
      const me = this;
      this.sipPhone.on("ringing", function (e) {
        console.log("receiving call");
        me.statusCall = "ringing";
      });
    },
    onDisConnected() {
      const me = this;
      this.sipPhone.on("disconnected", function (e) {
        console.log("disconnected");
        me.statusCall = "disconnected";
      });
    },
    onEnded() {
      const me = this;
      this.sipPhone.on("ended", function (e) {
        console.log("call ended with cause " + e.data.cause);
        me.statusCall = "ended";
      });
    },
    // event client
    makeCall() {
      // var fixed = this.phoneNumber.replace(/[^a-zA-Z0-9*#/.@]/g, "");
      this.sipPhone.call(this.phoneNumber, (e) => {
        console.log("calling: ", e);
      });

      this.statusCode = "call out to " + this.phoneNumber;
    },
    rejectCall() {
      if (!this.sipPhone) return;

      if (this.sipPhone.state === 1) {
        this.sipPhone.reject();
      } else {
        this.sipPhone.hangup();
      }
    },
    answerCall() {
      if (this.sipPhone) return this.sipPhone.answer();
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
