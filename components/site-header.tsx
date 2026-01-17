"use client"

import { usePathname } from "next/navigation"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = {
    "/dashboard": "Dashboard",
    "/clients": "Clients",
    "/tasks": "Tasks",
    "/settings": "Settings",
  }

  // Check for exact match first
  if (routes[pathname]) {
    return routes[pathname]
  }

  // Check for nested routes
  for (const [path, title] of Object.entries(routes)) {
    if (pathname.startsWith(path + "/")) {
      return title
    }
  }

  return "Dashboard"
}

export function SiteHeader() {
  const pathname = usePathname()
  const pageTitle = getPageTitle(pathname)

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{pageTitle}</h1>
      </div>
    </header>
  )
}
