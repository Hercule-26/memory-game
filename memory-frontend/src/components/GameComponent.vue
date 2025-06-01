<script setup lang="ts">
import { gameStore } from '@/stores/game';

const emits = defineEmits(['cardClic']);
const gameSession: any = gameStore();

</script>

<template>
  <div class="game-container" v-if="gameSession.game">
    <h1>🎮 Party : {{ gameSession.game.partyName }}</h1>

    <div class="players">
      <h2>👥 Players</h2>
      <ul>
        <li v-for="(player, index) in gameSession.game.players" :key="index" :class="{ current: index === gameSession.game.currentPlayerIndex }">
          {{ player.name }} — {{ player.score }} pts
          <span v-if="index === gameSession.game.currentPlayerIndex"> 🔥</span>
        </li>
      </ul>
    </div>

    <h2>🧠 Board</h2>
    <div class="board">
      <div v-for="(row, rowIndex) in gameSession.game.board" :key="rowIndex" class="row">
        <div v-for="(card, colIndex) in row" :key="colIndex" @click="emits('cardClic', rowIndex, colIndex)" class="card">
          <span v-if="card.isMatched || card.isRevealed">{{ card.value }}</span>
          <span v-else>❓</span>
        </div>
      </div>
    </div>

    <p>✅ Pairs found : {{ gameSession.game.matchedPairs }} / {{ gameSession.game.totalPairs }}</p>

  </div>
</template>

<style scoped>
.game-container {
  max-width: 600px;
  margin: auto;
  font-family: Arial, sans-serif;
  text-align: center;
}
.players ul {
  list-style: none;
  padding: 0;
}
.players li {
  padding: 4px 0;
}
.players li.current {
  font-weight: bold;
  color: #007bff;
}
.board {
  display: grid;
  gap: 8px;
  margin: 16px 0;
}
.row {
  display: flex;
  gap: 8px;
  justify-content: center;
}
.card {
  width: 40px;
  height: 40px;
  background: #f0f0f0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.1);
}
</style>
