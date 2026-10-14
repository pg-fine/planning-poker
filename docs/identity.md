# Identity in the Browser

Participants do not sign in. On first start the app signs the browser in **anonymously** with
Supabase (`signInAnonymously`). The resulting user ID (`auth.uid()`) is the identity in all
rooms. The display name is just a label and not a login.

## Behavior

| Situation                                        | Result                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| First start in a browser profile                 | New anonymous identity, session in `localStorage`                     |
| Reload, restart the browser                      | Same identity (stored session, token is renewed)                      |
| Second tab or second window, same profile        | Same identity; a lock prevents two parallel first sign-ins            |
| Other profile, other browser, other device       | New identity, i.e. a new participation                                |
| Browser data cleared, private window closed      | New identity. Former membership and vote belong to the old ID         |
| Session invalid (user deleted on the server)     | Stored session is discarded, a new sign-in follows                    |
| Supabase unreachable                             | Error message with "Try again"; existing session is kept              |

A new identity in the same room appears as an additional member. The old entry stays as long
as nobody removes it; but it does not block any vote because there are no mandatory voters
(see `data-and-action-contract.md`).

## Kinds of sign-in errors

| Kind                 | Typical cause                                              | Message points to                             |
| -------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| Configuration missing | `.env.local` is missing or contains placeholders          | Setup notice (before any sign-in)             |
| `anonymous_disabled` | "Allow anonymous sign-ins" is off                          | Switch in the Supabase dashboard              |
| `rate_limited`       | More than 30 sign-ins per hour and IP                      | Wait or raise the limit in the dashboard      |
| `network`            | Offline, paused project, corporate network blocks Supabase | Check connection, reactivate project          |
| `unknown`            | e.g. wrong publishable key                                 | Check URL and key                             |
