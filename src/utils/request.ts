import axios from "axios";
import { currentUser } from "@/firebase/auth";

const request = axios.create({
  baseURL: import.meta.env.VITE_CLOUD_FUNCTION_URL,
  timeout: 10000
});

// Add a request interceptor to include the ID token in headers
request.interceptors.request.use(
  async (config) => {
    try {
      const idToken = await currentUser.value?.getIdToken();
      if (idToken) config.headers.Authorization = "Bearer " + idToken;
    } catch (err) {
      console.error("Error getting ID token:", err);
    } finally {
      return config;
    }
  },
  (err) => {
    return Promise.reject(err);
  }
);

export default request;
