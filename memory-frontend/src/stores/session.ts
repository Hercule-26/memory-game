import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const sessionStore = defineStore('session', () => {
  const user = ref(null);

  async function login(userName: string) {
    try {
      const response = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userName }),
      });

      if (!response.ok) {
        throw new Error("Error while login");
      }

      const data = await response.json();
      user.value = data || null;
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
      console.log(data);
      user.value = null;
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
      user.value = data;
    } catch (err) {
      console.error(err);
    }
  }

  return { user, login, logout, fetchUser };
});
