<template>
  <div id="app">
    <router-view />
    <audio id="remoteAudio">
      <p>Your browser doesn't support HTML5 audio.</p>
    </audio>
  </div>
</template>

<script>
export default {
  name: "App",
};
</script>
