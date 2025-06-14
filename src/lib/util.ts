import { clsx, type ClassValue } from "clsx"
import { atom } from "jotai"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const categoryAtom = atom("")
export const currentTabAtom = atom("followed")
export const platformAtom = atom("twitch")
export const searchQueryAtom = atom("")
export const followedLiveFilterAtom = atom<"Kick" | "Twitch" | "All">("All")
