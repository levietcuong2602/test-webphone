// import { SimpleUser, SimpleUserOptions } from "sip.js/lib/platform/web";

export function getAudioElement(id) {
  const el = document.getElementById(id);
  if (!(el instanceof HTMLAudioElement)) {
    throw new Error(`Element "${id}" not found or not an audio element.`);
  }
  return el;
}

// Helper function to wait
export async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// Main function
export async function initPhone() {
  const server = process.env.VUE_APP_WS_SERVER;
  const options = {
    aor: process.env.VUE_APP_AOR,
    media: {
      remote: {
        audio: getAudioElement("remoteAudio")
      }
    },
    userAgentOptions: {
      authorizationPassword: process.env.VUE_APP_PASS,
      authorizationUsername: process.env.VUE_APP_USER
    }
  };

  // Construct a SimpleUser instance
  const simpleUser = new SimpleUser(server, options);

  // Supply delegate to handle inbound calls (optional)
  simpleUser.delegate = {
    onCallReceived: async () => {
      await simpleUser.answer();
    }
  };

  // Connect to server
  await simpleUser.connect();

  // Register to receive inbound calls (optional)
  await simpleUser.register();

  // Place call to the destination
  // await simpleUser.call(destination);

  // Wait some number of milliseconds
  await wait(5000);

  // Hangup call
  await simpleUser.hangup();

  return simpleUser;
}
