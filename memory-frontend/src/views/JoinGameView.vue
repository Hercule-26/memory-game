<script setup lang="ts">
import { ref } from "vue";
import { gameStore } from "@/stores/game";
import { useRouter } from "vue-router";

const gameId = ref<number | null>(null);
const errorMessage = ref<string | null>(null);
const game = gameStore();
game.errorMessage = "";
const router = useRouter();

async function joinGame() {
  if (!gameId.value) {
    game.errorMessage = "The game id must not be blank";
  } else {
    errorMessage.value = null;
    await game.joinGame(gameId.value);
    if (game.game) {
      router.push("/game");
    }
  }
}
</script>

<template>
  <div id="join-form">
    <div>
      <h2>Join a Game</h2>
      <form @submit.prevent="joinGame">
        <label>Game id: </label>
        <input type="number" v-model="gameId" required/>
        <button type="submit">Join game</button>
      </form>
      <span v-if="game.errorMessage" style="color: red">{{ game.errorMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
  #join-form {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 85vh;
  }
</style>
