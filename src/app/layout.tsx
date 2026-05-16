import type { Metadata, Viewport } from 'next'
import './globals.css'
import { CartProvider } from '@/context/CartContext'
import CartBar from '@/components/CartBar'

export const metadata: Metadata = {
  title: '家庭点餐',
  description: '家庭自用点餐应用',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '家的菜单',
  },
  icons: {
    apple: '/apple-touch-icon.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#f2f2f7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="min-h-full bg-background text-foreground antialiased">
        <CartProvider>
          {children}
          <CartBar />
        </CartProvider>
      </body>
    </html>
  )
}
