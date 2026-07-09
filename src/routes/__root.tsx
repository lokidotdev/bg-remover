import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import type { ReactNode } from 'react'
import appCss from '../styles/app.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      { title: 'OpenBG — Free & Open Source Background Remover' },
      {
        name: 'description',
        content:
          'OpenBG is a free, open source background remover that runs completely in your browser. Remove image backgrounds instantly — no sign-up, no server, your photos never leave your device.',
      },
      {
        name: 'keywords',
        content:
          'background remover, remove background, free background remover, open source background remover, remove image background, transparent background, bg remover, OpenBG, browser background removal, no upload',
      },
      { name: 'author', content: 'OpenBG' },
      { name: 'robots', content: 'index, follow' },
      { name: 'theme-color', content: '#000000' },
      // Open Graph
      { property: 'og:type', content: 'website' },
      { property: 'og:site_name', content: 'OpenBG' },
      {
        property: 'og:title',
        content: 'OpenBG — Free & Open Source Background Remover',
      },
      {
        property: 'og:description',
        content:
          'Remove image backgrounds instantly, right in your browser. Free, open source, and completely private — your photos never leave your device.',
      },
      // Twitter
      { name: 'twitter:card', content: 'summary_large_image' },
      {
        name: 'twitter:title',
        content: 'OpenBG — Free & Open Source Background Remover',
      },
      {
        name: 'twitter:description',
        content:
          'Remove image backgrounds instantly, right in your browser. Free, open source, and completely private.',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'canonical', href: 'https://openbg.vercel.app/' },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: 'OpenBG',
          applicationCategory: 'MultimediaApplication',
          operatingSystem: 'Any',
          description:
            'Free and open source background remover that runs completely in your browser. Your photos never leave your device.',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          isAccessibleForFree: true,
        }),
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
