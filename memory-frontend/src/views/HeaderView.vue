<script setup lang="ts">
  import { onMounted } from 'vue';
  import { sessionStore } from '@/stores/session';
  import { useRouter } from 'vue-router';

  const store = sessionStore();
  const router = useRouter();

  async function handleLogin() {
    router.push('/login');
  }

  async function handleLogout() {
    await store.logout();
    router.push('/login');
  }

  onMounted(async () => {
    await store.fetchUser();
    router.push('/');
  });
</script>

<template>
  <header class="header">
    <div id="menu">
      <nav>
        <RouterLink to="/">Home</RouterLink>
      </nav>
    </div>

    <div v-if="!store.user">
      <button @click="handleLogin">Login</button>
    </div>

    <template v-else>
      <h3>Username : {{ store.user }}</h3>
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
