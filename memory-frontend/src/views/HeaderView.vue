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
  <header class="header">
    <div id="menu">
      <nav>
        <RouterLink to="/">Home</RouterLink>
      </nav>
    </div>

    <div v-if="!userStore.user">
      <button @click="handleLogin">Login</button>
    </div>

    <template v-else>
      <div id="session-info">
        <h3>Username : {{ userStore.user }}</h3>
        <h4 v-if="gameSession.game && gameSession.game.players.length === 2"> Game Id : {{ gameSession.gameId }} </h4>
      </div>
      <button @click="handleLogout">Logout</button>
    </template>
  </header>
</template>

<style scoped>
  .header {
    display: flex;
    gap: 1rem;
    align-items: center;
    padding: 1rem;
    justify-content: space-between;
    background-color: #f0f0f0;
  }

  #menu nav {
    display: flex;
    gap: 10px;
  }

  #session-info {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.25rem;
    text-align: start;
    font-size: 0.9rem;
    color: #333;
  }

  #session-info h3, #session-info h4 {
    margin: 0;
  }
</style>
