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
        <NoticePage title="This invitation link is invalid.">
          Check that the link was copied completely, or ask for a new link.
        </NoticePage>
      )
    case 'not-found':
      return (
        <NoticePage title="Page not found.">
          This address does not exist.
        </NoticePage>
      )
  }
}
