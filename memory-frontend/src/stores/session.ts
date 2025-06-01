import { ref } from 'vue'
import { defineStore } from 'pinia'
import { gameStore } from './game';

export const sessionStore = defineStore('session', () => {
  const gameSesion = gameStore();
  const user = ref<string|null>(null);
  const errorMessage = ref<string>("");
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

  async function login(userName: string) {
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName }),
      });

      const data = await response.json();

      if (!response.ok) {
        errorMessage.value = data;
      }

      user.value = data.username || null;
    } catch (err) {
      console.error(err);
    }
  }

  async function logout() {
    try {
      await gameSesion.quitGame(user.value);
      const response = await fetch(`${apiUrl}/auth/logout`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Error while logout");
      }
      user.value = null;
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchUser() {
    try {
      const response = await fetch(`${apiUrl}/auth/profile`, {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (response.status === 401) {
        user.value = null;
        return;
      }

      if (!response.ok) {
        throw new Error("Error while fetching user");
      }

      const data = await response.json();
      user.value = data.username || null;
      if(data.gameId) {
        gameSesion.gameId = data.gameId;
      }
    } catch (err) {
      console.error(err);
    }
  }

  return { user, errorMessage, login, logout, fetchUser };
});
