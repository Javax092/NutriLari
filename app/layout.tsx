import { Analytics } from '@vercel/analytics/next'
import { DM_Sans, Cormorant_Garamond } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import { LeadTracker } from '@/components/lead-tracker'
import './globals.css'

const sans = DM_Sans({ subsets: ['latin'], variable: '--font-sans' })
const serif = Cormorant_Garamond({ subsets: ['latin'], variable: '--font-serif', weight: ['500', '600', '700'] })

export const metadata: Metadata = {
  title: 'Larissa Vital | Alimentação que funciona quando a vida acontece',
  description: 'Nutrição para quem já sabe que precisa se alimentar melhor, mas quer entender o que impede isso de funcionar na rotina.',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="bg-background">
      <body className={`${sans.variable} ${serif.variable} antialiased`}>
        {children}
        <LeadTracker />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
