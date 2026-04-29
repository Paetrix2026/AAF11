import type { User } from "@/types";

export function setAuthCookie(token: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`;
}

export function clearAuthCookie(): void {
  if (typeof document === "undefined") return;
  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "user=; path=/; max-age=0";
}

export function setUserCookie(user: User): void {
  if (typeof document === "undefined") return;
  document.cookie = `user=${encodeURIComponent(JSON.stringify(user))}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`;
}

export function getUserFromCookie(): User | null {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split("; user=");
  if (parts.length === 2) {
    try {
      return JSON.parse(decodeURIComponent(parts.pop()?.split(";").shift() ?? ""));
    } catch {
      return null;
    }
  }
  return null;
}
