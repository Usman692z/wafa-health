import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'mediGO – Telemedicine Platform Pakistan',
    short_name: 'mediGO',
    description:
      'Connect with certified doctors online. Book consultations, chat, video calls, and get e-prescriptions. Supporting JazzCash and Easypaisa.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    scope: '/',
    lang: 'en',
    categories: ['health', 'medical'],
    icons: [
      {
        src: '/favicon.ico',
        sizes: '256x256',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
    screenshots: [],
  };
}
