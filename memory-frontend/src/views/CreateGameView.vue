<script setup lang="ts">
import { ref, onMounted } from "vue";
import { gameStore } from "@/stores/game";
import { useRouter } from "vue-router";

const gameName = ref<string>("");
const game = gameStore();
const router = useRouter();

async function createGame() {
  if (gameName.value === "") {
    game.errorMessage = "The name of the game must not be blank";
  } else if (gameName.value.includes(" ")) {
    game.errorMessage = "The name of the game must not contain spaces";
  } else {
    game.errorMessage = "";
    await game.createGame(gameName.value);
    if (game.game) {
      router.push("/game");
    }
  }
}

onMounted(() => {
  game.errorMessage = "";
});
</script>

<template>
  <div class="flex items-center justify-center h-80 from-pink-50 via-fuchsia-50 to-violet-50 px-4">
    <div class="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
      <h2 class="text-2xl font-bold text-violet-700 mb-6 text-center">Create a Game</h2>

      <form @submit.prevent="createGame" class="flex flex-col gap-4">
        <input type="text" v-model="gameName" required placeholder="Game name"
          class="border border-purple-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 text-purple-500 placeholder-purple-400"/>

        <button
          type="submit"
          class="bg-fuchsia-600 text-white py-2 rounded hover:bg-fuchsia-700 transition font-semibold">
          Create game
        </button>
      </form>

      <p v-if="game.errorMessage" class="text-pink-600 mt-4 text-center font-medium">
        {{ game.errorMessage }}
      </p>
    </div>
  </div>
</template>

