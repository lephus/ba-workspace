import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date string to HH:mm dd/MM/yyyy (local time).
 * Backend returns UTC without timezone suffix, so we append "Z" when missing.
 */
export function formatDate(dateString: string): string {
  const normalized = /[Z+\-]\d{0,2}:?\d{0,2}$/.test(dateString)
    ? dateString
    : dateString + "Z";
  const date = new Date(normalized);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${hours}:${minutes} ${day}/${month}/${year}`;
}
