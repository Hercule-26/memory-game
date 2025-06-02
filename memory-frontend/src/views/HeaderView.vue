<script setup lang="ts">
  import { onMounted } from 'vue';
  import { sessionStore } from '@/stores/session';
  import { gameStore } from '@/stores/game'
  import { useRouter } from 'vue-router';

  const userStore = sessionStore();
  const gameSession = gameStore();
  const router = useRouter();

  async function handleLogin() {
    router.push('/login');
  }

  async function handleLogout() {
    await userStore.logout();
    router.push('/login');
  }
</script>

<template>
  <header class="flex justify-between items-center gap-4 p-4 bg-gradient-to-r from-fuchsia-100 via-violet-100 to-pink-100 shadow-md">
    <div id="menu">
      <nav class="flex gap-3">
        <RouterLink to="/" class="text-purple-700 font-semibold hover:underline">Home</RouterLink>
      </nav>
    </div>

    <div v-if="!userStore.user">
      <button @click="handleLogin"
        class="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition">
        Login
      </button>
    </div>

    <template v-else>
      <div id="session-info" class="flex flex-col items-end gap-1 text-purple-800 text-sm text-right">
        <h3 class="m-0">Username : {{ userStore.user }}</h3>
        <h4 v-if="gameSession.game && gameSession.game.players.length === 2" class="m-0">
          Game Id : {{ gameSession.gameId }}
        </h4>
      </div>
      <button @click="handleLogout"
        class="ml-4 px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700 transition">
        Logout
      </button>
    </template>
  </header>
</template>

