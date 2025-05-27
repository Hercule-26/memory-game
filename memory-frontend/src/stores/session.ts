import { ref } from 'vue'
import { defineStore } from 'pinia'
import { gameStore } from './game';

export const sessionStore = defineStore('session', () => {
  const gameSesion = gameStore();
  const user = ref(null);
  const errorMessage = ref<string>("");
  async function login(userName: string) {
    try {
      const response = await fetch("http://localhost:3000/auth/login", {
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
      const response = await fetch("http://localhost:3000/auth/logout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Error while logout");
      }

      const data = await response.json();
      user.value = null;
      gameSesion.game = null;
    } catch (err) {
      console.error(err);
    }
  }

  async function fetchUser() {
    try {
      const response = await fetch("http://localhost:3000/auth/profile", {
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
      if(data.game) {
        gameSesion.game = data.game;
      }
    } catch (err) {
      console.error(err);
    }
  }

  return { user, errorMessage, login, logout, fetchUser };
});
