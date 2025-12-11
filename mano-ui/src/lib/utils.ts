import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Check if the application is running in Tauri environment
 * @returns true if running in Tauri, false otherwise
 */
export const isTauri = () => {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Detect Chrome (includes Edge/Chromium variants, but used for FS Access support).
 */
export const isChrome = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  const isChromium = ua.includes('chrome') || ua.includes('crios') || ua.includes('chromium')
  const isEdge = ua.includes('edg/')
  const isOpera = ua.includes('opr/') || ua.includes('opera')
  return isChromium && !ua.includes('safari') && !isEdge && !isOpera
}

/**
 * Detect Safari (excludes Chrome on iOS which reports "crios").
 */
export const isSafari = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent.toLowerCase()
  const isSafariKeyword = ua.includes('safari')
  const isNotChrome = !ua.includes('chrome') && !ua.includes('crios') && !ua.includes('chromium')
  const isNotEdge = !ua.includes('edg/')
  const isNotOpera = !ua.includes('opr/') && !ua.includes('opera')
  return isSafariKeyword && isNotChrome && isNotEdge && isNotOpera
}
