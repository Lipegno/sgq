import { api } from "./axios";
import type { AuthResponse } from "@/types.ts";

export const login = async (data: { email: string; password: string }) => {
  const res = await api.post("/auth/login", data);
  return res.data;
};

export const apiLogout = async () => {
  return api.post("/auth/logout");
};

export const register = async (data: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  return api.post("/users", data);
};

export const refresh: () => Promise<AuthResponse> = async () => {
  const res = await api.post("/auth/refresh");
  return res.data;
};
