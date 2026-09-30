import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/react'
import { ProductProvider } from '@/lib/product-context'
import { CartProvider } from '@/lib/cart-context'
import { RoleProvider } from '@/lib/role-context'
import { LocationProvider } from '@/lib/location-context'
import { OrderProvider } from '@/lib/order-context'
import { LocationGateOverlay } from '@/components/location-gate-overlay'
import { SupportProvider } from '@/lib/support-context'
import { NotificationProvider } from '@/lib/notification-context'
import { SellerProvider } from '@/lib/seller-context'
import { UserProvider } from '@/lib/user-context'
import { CategoryProvider } from '../lib/category-context'
import { AdminUsersProvider } from '@/lib/admin-users-context'
import { PromotionProvider } from '@/lib/promotions-context'
import { DevIdentitySwitcher } from '@/components/DevIdentitySwitcher'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata = {
  title: 'AgroBridge - B2B Agricultural Marketplace',
  description: 'Connect farmers directly with retailers and wholesalers. Fresh produce, competitive prices, transparent transactions.',
  generator: 'v0.app',
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="bg-background">
      <body className="font-sans antialiased">
        <UserProvider>
          <NotificationProvider>
            <RoleProvider>
              <LocationProvider>
                <AdminUsersProvider>
                  <CategoryProvider>
                    <ProductProvider>
                      <OrderProvider>
                        <SellerProvider>
                          <CartProvider>
                            <PromotionProvider>
                              <SupportProvider>
                                {children}
                                <LocationGateOverlay />

                                {process.env.NODE_ENV === 'production' && <Analytics />}
                              </SupportProvider>
                            </PromotionProvider>
                          </CartProvider>
                        </SellerProvider>
                      </OrderProvider>
                    </ProductProvider>
                  </CategoryProvider>
                </AdminUsersProvider>
              </LocationProvider>
            </RoleProvider>
          </NotificationProvider>
        </UserProvider>
      </body>
    </html>
  )
}
