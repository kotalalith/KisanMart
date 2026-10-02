'use client'

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { SellerSidebar } from '@/components/seller/seller-sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Bell, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { NotificationCenterDrawer } from '@/components/notification-center-drawer'
import { AnnouncementBanner } from '@/components/announcements/announcement-banner'
import { AnnouncementPopup } from '@/components/announcements/announcement-popup'

export default function SellerLayout({
  children,
}) {
  return (
    <SidebarProvider>
      <SellerSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 justify-between">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Seller Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenterDrawer />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 md:p-8 space-y-6">
          <AnnouncementBanner role="seller" />
          {children}
          <AnnouncementPopup role="seller" />
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}





