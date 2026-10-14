import { Link } from './Link.tsx'

type Props = { title: string; children: string }

/** Simple notice page (e.g. invalid link) with a way back to the home page. */
export function NoticePage({ title, children }: Props) {
  return (
    <section className="card card--notice" role="alert">
      <h2>{title}</h2>
      <p>{children}</p>
      <p>
        <Link to="/">Back to home</Link>
      </p>
    </section>
  )
}
