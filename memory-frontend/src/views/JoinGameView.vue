<script setup lang="ts">
import { ref } from "vue";
import { gameStore } from "@/stores/game";
import { useRouter } from "vue-router";

const gameName = ref<string>("");
const errorMessage = ref<string | null>(null);
const game = gameStore();
game.errorMessage = "";
const router = useRouter();

async function joinGame() {
  if (gameName.value === "") {
    game.errorMessage = "The name of the game must not be blank";
  } else if (gameName.value.includes(" ")) {
    game.errorMessage = "The name of the game must not contain spaces";
  } else {
    errorMessage.value = null;
    await game.joinGame(gameName.value);
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
        <label>Game name: </label>
        <input type="text" v-model="gameName" required/>
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
