<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header>
    <div>
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <br>
        <RouterLink to="/game/create">Create game</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>
