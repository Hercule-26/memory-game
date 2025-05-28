<script setup lang="ts">
import { ref } from "vue"
import { gameStore } from "@/stores/game";
import { useRouter } from "vue-router";

const gameName = ref<string>("");
const errorMessage = ref<string | null>(null);
const game = gameStore();
game.errorMessage = "";
const router = useRouter();

async function createGame() {
  if (gameName.value === "") {
    errorMessage.value = "The name of the game must not be blank";
  } else if (gameName.value.includes(" ")) {
    errorMessage.value = "The name of the game must not contain spaces";
  } else {
    errorMessage.value = null;
    await game.createGame(gameName.value);
    if(game.game) {
      router.push('/game');
    }
  }
}
</script>

<template>
  <div id="create-form">
    <div>
      <h2>Create a Game</h2>
      <form @submit.prevent="createGame">
        <label for="">Game name : </label>
        <input type="text" v-model="gameName" required />
        <button type="submit">Create game</button>
      </form>
      <span v-if="errorMessage" style="color: red">{{ errorMessage }}</span>
      <span v-if="game.errorMessage" style="color: red">{{ game.errorMessage }}</span>
    </div>
  </div>
</template>

<style scoped>
#create-form {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 85vh;
}
</style>