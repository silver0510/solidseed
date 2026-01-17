"use client"

import * as React from "react"
import Link from "next/link"
import {
  BellIcon,
  CheckCircleIcon,
  LayoutDashboardIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    title: "Clients",
    url: "/clients",
    icon: UsersIcon,
  },
  {
    title: "Tasks",
    url: "/tasks",
    icon: CheckCircleIcon,
  },
]

const navSecondary = [
  {
    title: "Settings",
    url: "/settings",
    icon: SettingsIcon,
  },
]

function SidebarActions() {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <div className={`flex items-center ${isCollapsed ? 'flex-col gap-1' : 'justify-between'} px-2 py-2`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Search">
              <SearchIcon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Search</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ThemeToggle className="h-8 w-8" tooltipSide="right" />

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8" aria-label="Notifications">
              <BellIcon className="h-4 w-4" />
              <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-orange-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Notifications</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href="/dashboard">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold">
                  K
                </div>
                <span className="text-base font-semibold">Korella</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <SidebarActions />
        <SidebarSeparator />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
