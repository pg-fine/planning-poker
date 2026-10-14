import type { SupabaseConfigResult } from '../supabase/config.ts'

type Props = {
  result: Exclude<SupabaseConfigResult, { status: 'ok' }>
}

export function SetupNotice({ result }: Props) {
  return (
    <section className="card card--notice" aria-labelledby="setup-title">
      <h2 id="setup-title">Setup required</h2>

      {result.status === 'missing' ? (
        <p>
          The app is not connected to a Supabase project yet. The following
          settings are missing:{' '}
          {result.missing.map((name, index) => (
            <span key={name}>
              {index > 0 ? ', ' : ''}
              <code>{name}</code>
            </span>
          ))}
          .
        </p>
      ) : (
        <p>The Supabase configuration is invalid: {result.reason}</p>
      )}

      <ol>
        <li>
          Copy <code>.env.example</code> to <code>.env.local</code>.
        </li>
        <li>
          Enter the project URL and the public publishable/anon key of your
          Supabase project there.
        </li>
        <li>
          Restart the development server with <code>npm run dev</code>.
        </li>
      </ol>
      <p className="hint">
        Never use a service role or secret key in the frontend.
      </p>
    </section>
  )
}
