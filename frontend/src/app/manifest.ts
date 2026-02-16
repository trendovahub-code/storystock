import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Trendova Hub',
    short_name: 'Trendova',
    description: 'Trendova Hub delivers institutional-grade stock analysis and market insights.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#1d4ed8',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}
