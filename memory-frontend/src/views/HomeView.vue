<script setup lang="ts">
  import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="flex flex-col gap-6">
    <RouterLink to="/game/create"
      class="block px-8 py-3 bg-violet-500 text-white rounded shadow-md hover:bg-violet-600 focus:outline-none focus:ring-2 focus:ring-violet-400 transition text-center font-medium">
      Create Game
    </RouterLink>
    <RouterLink to="/game/join"
      class="block px-8 py-3 bg-fuchsia-500 text-white rounded shadow-md hover:bg-fuchsia-600 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 transition text-center font-medium">
      Join Game
    </RouterLink>
  </nav>
</template>
