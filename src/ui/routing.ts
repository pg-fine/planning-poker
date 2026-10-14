import { useSyncExternalStore } from 'react'

/**
 * Kleines Routing ohne Bibliothek: Startseite `/` und Raum-Link `/r/<token>`.
 * Der Einladungstoken hat 64 Hexadezimalzeichen (siehe docs/daten-und-aktionsvertrag.md).
 */
export type Route =
  | { name: 'home' }
  | { name: 'room'; token: string }
  | { name: 'invalid-link' }
  | { name: 'not-found' }

const TOKEN_PATTERN = /^[0-9a-f]{64}$/

export function parseRoute(pathname: string): Route {
  const path = pathname.replace(/\/+$/, '') || '/'
  if (path === '/') return { name: 'home' }
  const match = /^\/r\/([^/]+)$/.exec(path)
  if (match?.[1]) {
    const token = match[1].toLowerCase()
    return TOKEN_PATTERN.test(token)
      ? { name: 'room', token }
      : { name: 'invalid-link' }
  }
  return { name: 'not-found' }
}

export function roomPath(token: string): string {
  return `/r/${token}`
}

/** Vollständiger, teilbarer Link zu einem Raum. */
export function roomUrl(token: string): string {
  return `${window.location.origin}${roomPath(token)}`
}

const NAVIGATE_EVENT = 'planning-poker:navigate'

export function navigate(path: string): void {
  if (path === window.location.pathname) return
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange)
  window.addEventListener(NAVIGATE_EVENT, onChange)
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(NAVIGATE_EVENT, onChange)
  }
}

const getPathname = () => window.location.pathname

export function usePathname(): string {
  return useSyncExternalStore(subscribe, getPathname)
}
