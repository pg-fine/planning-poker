import type { MouseEvent, ReactNode } from 'react'
import { navigate } from './routing.ts'

/** Interner Link, der ohne Neuladen navigiert, aber normale Browser-Gesten erhält. */
export function Link({ to, children }: { to: string; children: ReactNode }) {
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return
    }
    event.preventDefault()
    navigate(to)
  }
  return (
    <a href={to} onClick={onClick}>
      {children}
    </a>
  )
}
