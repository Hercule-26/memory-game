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
  <div class="flex items-center justify-center min-h-80 from-pink-50 via-fuchsia-100 to-violet-100 px-4">
    <div class="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
      <h2 class="text-2xl font-bold text-violet-700 mb-6 text-center">
        Connection
      </h2>
      <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
        <input v-model="username" type="text" placeholder="Username" required
          class="px-4 py-2 border border-purple-300 rounded focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-purple-500 placeholder-purple-400"/>
        <button type="submit"
          class="bg-fuchsia-600 text-white py-2 rounded hover:bg-fuchsia-700 transition font-semibold">
          Connect
        </button>
      </form>
      <p v-if="store.errorMessage"
        class="mt-4 text-rose-600 text-sm text-center font-medium">
        {{ store.errorMessage }}
      </p>
    </div>
  </div>
</template>

