<script setup lang="ts">
  import { RouterLink } from 'vue-router'
</script>

<template>
  <main>
    <nav>
      <RouterLink to="/game/create">Create game</RouterLink>
      <RouterLink to="/game/join">Join game</RouterLink>
    </nav>
  </main>
</template>

<style>
  main {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 85vh;
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
</style>