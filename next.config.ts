import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typedRoutes: true,
  reactCompiler: true,
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
  redirects: () => [
    {
      source: '/',
      destination: '/calculator',
      // permanent: true -> HTTP 308 (Permanent Redirect). Browsers and search engines cache it,
      // so later visits to "/" may go straight to "/calculator" without asking the server.
      // Only use it when the target will not change; otherwise a stale cached redirect is hard to undo.
      permanent: true,
    },
    {
      source: '/settings',
      destination: '/settings/groups',
      // permanent: false -> HTTP 307 (Temporary Redirect). Not cached long-term, so the browser
      // asks the server on every visit. Safe choice when the default tab may change later.
      permanent: false,
    },
  ],
};

export default nextConfig;
