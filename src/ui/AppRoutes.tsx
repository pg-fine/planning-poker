import type { AppSupabaseClient } from '../supabase/client.ts'
import { HomePage } from './HomePage.tsx'
import { NoticePage } from './NoticePage.tsx'
import { RoomPage } from './RoomPage.tsx'
import { parseRoute, usePathname } from './routing.ts'

export function AppRoutes({ client }: { client: AppSupabaseClient }) {
  const route = parseRoute(usePathname())

  switch (route.name) {
    case 'home':
      return <HomePage client={client} />
    case 'room':
      return <RoomPage key={route.token} client={client} token={route.token} />
    case 'invalid-link':
      return (
        <NoticePage title="Dieser Einladungslink ist ungültig.">
          Prüfe, ob der Link vollständig kopiert wurde, oder bitte um einen neuen Link.
        </NoticePage>
      )
    case 'not-found':
      return (
        <NoticePage title="Seite nicht gefunden.">
          Diese Adresse gibt es nicht.
        </NoticePage>
      )
  }
}
