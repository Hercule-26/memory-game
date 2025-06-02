<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import HeaderView from './views/HeaderView.vue'
</script>

<template>
<div class="min-h-screen flex flex-col bg-gradient-to-b from-fuchsia-300 via-violet-400 to-purple-600 text-teal-100">
  <HeaderView />
  <main class="flex-grow p-6 flex flex-col items-center justify-center">
    <RouterView />
  </main>
</div>
</template>
