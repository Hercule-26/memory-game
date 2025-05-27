<script setup lang="ts">
  import { ref } from "vue";
  import { sessionStore } from "@/stores/session";
  import { useRouter } from 'vue-router';

  const store = sessionStore();
  const router = useRouter();

  const username = ref<string>("");
  const error = ref<string|null>(null);

  async function handleLogin() {
    error.value = null;
    try {
      await store.login(username.value);
      router.push('/');
    } catch (e) {
      error.value = "Error while connection";
    }
  }
</script>
<template>
  <div class="login-container">
    <h2>Connection</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="username" type="text" placeholder="Username" required/>
      <button type="submit"> Connect </button>
    </form>
    <p v-if="store.errorMessage" class="error">{{ store.errorMessage }}</p>
  </div>
</template>

<style scoped>
  .login-container {
    max-width: 300px;
    margin: 2rem auto;
    text-align: center;
  }
  input {
    width: 100%;
    padding: 0.5rem;
    margin-bottom: 1rem;
  }
  button {
    width: 100%;
    padding: 0.5rem;
  }
  .error {
    color: red;
    margin-top: 1rem;
  }
</style>
