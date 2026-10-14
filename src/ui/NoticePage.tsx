import { Link } from './Link.tsx'

type Props = { title: string; children: string }

/** Einfache Hinweisseite (z. B. ungültiger Link) mit Rückweg zur Startseite. */
export function NoticePage({ title, children }: Props) {
  return (
    <section className="card card--notice" role="alert">
      <h2>{title}</h2>
      <p>{children}</p>
      <p>
        <Link to="/">Zur Startseite</Link>
      </p>
    </section>
  )
}
