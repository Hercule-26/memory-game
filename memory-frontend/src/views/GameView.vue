<script setup lang="ts">
  import { gameStore } from '@/stores/game';
  import GameComponent from '@/components/GameComponent.vue';
  import { computed, onMounted, onUnmounted } from 'vue';
  import { sessionStore } from '@/stores/session';

  const gameSession = gameStore();
  const userSession = sessionStore();

  const showAlert = computed(() => gameSession.opponentLeft);
  const showReconnecting = computed(() => !!gameSession.gameId && !gameSession.isConnected);

  onMounted(async () => {
    if (!userSession.user) {
      await userSession.fetchUser();
    }
    gameSession.connect();
  });

  onUnmounted(() => {
    gameSession.disconnect();
  });

  function handleCardClick(rowIndex: number, colIndex: number) {
    gameSession.revealCard(rowIndex, colIndex);
  }
</script>

<template>
  <div class="flex flex-col justify-center items-center h-80 px-4">
    <h1 v-if="showAlert" class="text-xl font-semibold text-pink-600 mb-4 drop-shadow-md">
      ⚠️ Player disconnected
    </h1>

    <h1 v-else-if="showReconnecting" class="text-xl font-semibold text-pink-600 mb-4 drop-shadow-md">
      ⏳ Reconnecting...
    </h1>

    <h1 v-if="gameSession.game && gameSession.game.gameIsOver" class="text-xl font-bold text-violet-900 mb-4 drop-shadow-md">
      🎉 Game Is Over!
    </h1>

    <div
      v-if="gameSession.game && gameSession.game.players.length < 2"
      class="text-center bg-white bg-opacity-90 p-6 rounded-lg shadow-lg max-w-md w-full"
    >
      <div v-if="gameSession.gameId" class="mb-2 text-purple-800 font-semibold">
        Game ID: {{ gameSession.gameId }}
      </div>
      <div class="text-lg font-semibold text-purple-900">
        Waiting for player to join...
      </div>
      <button @click="gameSession.quitGame()" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 mt-3 rounded shadow-md transition">
        Cancel
      </button>
    </div>
    <template v-else>
      <GameComponent v-if="gameSession.game" @card-clic="handleCardClick" />
    </template>
  </div>
</template>
