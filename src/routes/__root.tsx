import { HeadContent, Link, Scripts, createRootRoute } from '@tanstack/react-router'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Joeys — Workout planner',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <nav className="topnav" aria-label="Main">
          <b className="brand">Joey's</b>
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: 'on' }}>
            Planner
          </Link>
          <Link to="/workouts" activeProps={{ className: 'on' }}>
            Catalogue
          </Link>
        </nav>
        {children}

        <Scripts />
      </body>
    </html>
  )
}
