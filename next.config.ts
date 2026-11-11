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
  redirects() {
    return [
      {
        source: '/',
        destination: '/calculator',
        permanent: true,
      },
      {
        source: '/settings',
        destination: '/settings/groups',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
