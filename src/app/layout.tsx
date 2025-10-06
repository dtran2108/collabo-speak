import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/sonner'
import { Navbar } from '@/components/nav-bar'
import { Analytics } from '@vercel/analytics/next'
import NextTopLoader from 'nextjs-toploader'
import { GlobalErrorHandler } from '@/components/GlobalErrorHandler'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'CollaboSpeak',
  description:
    'Practice your collaborative problem-solving skills with by engaging in realistic role-play discussions with AI-powered personas',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextTopLoader
          color="#3b82f6"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px #3b82f6,0 0 5px #3b82f6"
        />
        <AuthProvider>
          <GlobalErrorHandler />
          <Navbar />
          <div className="pt-16">{children}</div>
          <Toaster />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
