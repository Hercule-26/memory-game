<script setup lang="ts">
import { RouterView } from 'vue-router'
import HeaderView from './views/HeaderView.vue'

document.title = "Memory Game";
</script>

<template>
<div class="min-h-screen flex flex-col bg-gradient-to-b from-fuchsia-300 via-violet-400 to-purple-600 text-teal-100">
  <HeaderView />
  <main class="flex-grow p-6 flex flex-col items-center justify-center">
    <RouterView />
  </main>
</div>
</template>
