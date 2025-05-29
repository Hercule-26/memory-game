<script setup lang="ts">
  import { gameStore } from '@/stores/game';
  import { sessionStore } from '@/stores/session';
  import { onMounted, onUnmounted, ref } from 'vue';
  import { useRouter } from 'vue-router';

  const gameSession: any = gameStore();
  const session = sessionStore();
  const router = useRouter();
  const showAlert = ref<boolean>(false);
  let socket: WebSocket | null = null;


  onMounted(async () => {
    if(!session.user) {
        await session.fetchUser();
    }

    if(!gameSession.game) {
        router.push('/');
    }

    socket = new WebSocket("ws://localhost:3000");

    socket.onopen = () => {
      const payload = {
        type: "registerSocket",
        username: session.user,
        gameId: gameSession.gameId,
      };
      socket!.send(JSON.stringify(payload));
      console.log("WebSocket connected");
    };

    socket.onmessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if(data.type === "playerJoined") {
        const player = data.player;
        gameSession.game.players.push(player);
      } else if (data.type === "playerDisconnected") {
        showAlert.value = true;
        setTimeout(async () => {
          showAlert.value = false;
          await gameSession.quitGame(session.user);
          router.push('/');
        }, 5000); // 5 sec
      }
    };

    socket.onerror = (event: Event) => {
      console.error("WebSocket error:", event);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
    };
  });

  onUnmounted(async () => {
    if (socket) {
      socket.close();
    }
  });

  function send(): void {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload = {
        type: "message",
        gameName: gameSession.game.partyName,
      };
      socket.send(JSON.stringify(payload));
      console.log("Sent to server:", payload);
    } else {
      console.error("WebSocket not connected");
    }
  }
</script>

<template>
  <div id="content">
      <h1 v-if="showAlert">Player disconnected</h1>
      <button @click="send">Send message</button>
      <template v-if="gameSession.game && gameSession.game.players.length < 2">
        <div v-if="gameSession.gameId"> Game id : {{ gameSession.gameId }}</div>
        <div v-if="gameSession.game" class="waiting-message">
            Waiting for player...
        </div>
        <div v-else> {{ gameSession.game }} </div>
      </template>
  </div>
</template>

<style scoped>
  #content {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 85vh;
  }
</style>
