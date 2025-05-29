<script setup lang="ts">
  import { gameStore } from '@/stores/game';
  import GameComponent from '@/components/GameComponent.vue';
  import { useRouter } from 'vue-router';
  import { onMounted, onUnmounted, ref } from 'vue';
  import { sessionStore } from '@/stores/session';

  const gameSession: any = gameStore();
  const userSession = sessionStore();
  const showAlert = ref(false);

  let socket: WebSocket | null = null;
  const router = useRouter();

  onMounted(async () => {
    if(!userSession.user) {
      await userSession.fetchUser();
    }

    socket = new WebSocket("ws://localhost:3000");

    socket.onopen = () => {
      const payload = {
        type: "registerSocket",
        username: userSession.user,
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
          await gameSession.quitGame(userSession.user);
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

</script>

<template>
  <div id="content">
      <h1 v-if="showAlert">Player disconnected</h1>
      <div v-if="gameSession.game && gameSession.game.players.length < 2">
        <div v-if="gameSession.gameId"> Game id : {{ gameSession.gameId }}</div>
        <div class="waiting-message">
            Waiting for player...
        </div>
      </div>
      <GameComponent v-else/>
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
