"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  CreditCard,
  Landmark,
  FolderTree,
  Megaphone,
  FileBarChart,
  Settings,
  LogOut,
  Leaf,
  MapPin,
  Truck,
  Bell,
  Volume2,
  Gift
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const menuItems = [
  { title: "Overview", icon: LayoutDashboard, href: "/admin" },
  { title: "Users", icon: Users, href: "/admin/users" },
  { title: "Sellers", icon: Store, href: "/admin/sellers" },
  { title: "Partners", icon: Truck, href: "/admin/partners" },
  { title: "Orders", icon: ShoppingCart, href: "/admin/orders" },
  { title: "Locations", icon: MapPin, href: "/admin/locations" },
  { title: "Delivery", icon: Truck, href: "/admin/delivery" },
  { title: "Payments", icon: CreditCard, href: "/admin/payments" },
  { title: "Deposits", icon: Landmark, href: "/admin/deposits" },
  { title: "Withdrawals", icon: CreditCard, href: "/admin/withdrawals" },
  { title: "Categories", icon: FolderTree, href: "/admin/categories" },
  { title: "Promotions", icon: Megaphone, href: "/admin/promotions" },
  { title: "Notifications", icon: Bell, href: "/admin/notifications" },
  { title: "Announcements", icon: Volume2, href: "/admin/announcements" },
  { title: "Referrals", icon: Gift, href: "/admin/referrals" },
  { title: "Reports", icon: FileBarChart, href: "/admin/reports" },
  { title: "Support Desk", icon: Megaphone, href: "/admin/support" },
]


export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-6 py-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Leaf className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold text-sidebar-foreground">AgroBridge</span>
            <span className="ml-2 rounded bg-red-500/20 px-1.5 py-0.5 text-xs font-medium text-red-400">
              Admin
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <SidebarGroup>
          <SidebarGroupLabel>Platform Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>System & Config</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/settings"}>
                  <Link href="/admin/settings">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === "/admin/setup-firebase"}>
                  <Link href="/admin/setup-firebase">
                    <Landmark className="h-4 w-4" />
                    <span>Setup Database</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-red-500/20 text-red-400">SA</AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium text-sidebar-foreground">Super Admin</p>
            <p className="truncate text-xs text-sidebar-foreground/60">admin@agrobridge.com</p>
          </div>
          <Link
            href="/"
            className="rounded-md p-2 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
          >
            <LogOut className="h-4 w-4" />
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}




