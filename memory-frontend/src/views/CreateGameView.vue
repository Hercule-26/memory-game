<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue"

const gameName = ref("");
const errorMessage = ref<string | null>(null);

let socket: WebSocket | null = null;

// onMounted(() => {
//   socket = new WebSocket("ws://localhost:3000");

//   socket.onopen = () => {
//     console.log("WebSocket connected");
//   };

//   socket.onmessage = (event: MessageEvent) => {
//     console.log("Server message:", event.data);
//   };

//   socket.onerror = (event: Event) => {
//     console.error("WebSocket error:", event);
//   };

//   socket.onclose = () => {
//     console.log("🔌 WebSocket closed");
//   };
// });

// onUnmounted(() => {
//   if (socket) {
//     socket.close();
//   }
// });

function createGame(): void {
  if (gameName.value === "") {
    errorMessage.value = "The name of the game must not be blank";
  } else if (gameName.value.includes(" ")) {
    errorMessage.value = "The name of the game must not contain spaces";
  } else {
    errorMessage.value = null;
    console.log(gameName.value);


    // if (socket && socket.readyState === WebSocket.OPEN) {
    //   const payload = {
    //     type: "createGame",
    //     gameName: gameName.value,
    //   };

    //   socket.send(JSON.stringify(payload));
    //   console.log("Sent to server:", payload);
    // } else {
    //   console.error("WebSocket not connected");
    // }
  }
}
</script>

<template>
  <div id="create-form">
    <h2>Create a Game :</h2>
    <form @submit.prevent="createGame">
      <input type="text" v-model="gameName" required />
      <button type="submit">Create game</button>
    </form>
    <span v-if="errorMessage" style="color: red">{{ errorMessage }}</span>
  </div>
</template>

<style>
#create-form {
  
}
</style>