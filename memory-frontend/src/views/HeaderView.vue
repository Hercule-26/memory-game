<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { counterStore } from '@/stores/counter';
  import { useRouter } from 'vue-router';

  const store = counterStore();
  const router = useRouter();

  async function handleLogin() {
    router.push('/login');
  }

  async function handleLogout() {
    await store.logout();
  }

  onMounted(() => {
    store.fetchUser();
  });
</script>

<template>
  <header class="header">
    <div id="menu">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink v-if="store.user" to="/game/create">Create game</RouterLink>
      </nav>
    </div>

    <div v-if="!store.user">
      <button @click="handleLogin">Login</button>
    </div>

    <template v-else>
      <h3>Welcome, {{ store.user.username }}</h3>
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
</style>
