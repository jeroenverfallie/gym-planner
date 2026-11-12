import {
  HeadContent,
  Link,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Gym — Workout planner",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <nav className="topnav" aria-label="Main">
          <b className="brand">Gym planner</b>
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "on" }}
          >
            Planner
          </Link>
          <Link to="/workouts" activeProps={{ className: "on" }}>
            Catalogue
          </Link>
          <Link to="/templates" activeProps={{ className: "on" }}>
            Templates
          </Link>
          <Link to="/create" activeProps={{ className: "on" }}>
            Generate
          </Link>
          <Link to="/settings" activeProps={{ className: "on" }}>
            Settings
          </Link>
        </nav>
        {children}

        <Scripts />
      </body>
    </html>
  );
}
