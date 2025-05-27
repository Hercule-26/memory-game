      <script setup lang="ts">
      import { ref } from "vue";
      import { counterStore } from "@/stores/counter";

      const store = counterStore();

      const username = ref("");
      const loading = ref(false);
      const error = ref(null);

      async function handleLogin() {
        error.value = null;
        loading.value = true;
        try {
          await store.login(username.value);

        } catch (e) {
          error.value = "Erreur lors de la connexion";
        } finally {
          loading.value = false;
        }
      }
      </script>
<template>
  <div class="login-container">
    <h2>Connection</h2>
    <form @submit.prevent="handleLogin">
      <input v-model="username" type="text" placeholder="Username" required/>
      <button type="submit" :disabled="loading">
        {{ loading ? "Connexion..." : "Connect" }}
      </button>
    </form>

    <p v-if="error" class="error">{{ error }}</p>
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
