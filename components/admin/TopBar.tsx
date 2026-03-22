"use client";

import { usePathname } from "next/navigation";
import { Search, Bell } from "lucide-react";

const pathToTitle: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/wine-regions": "Wine Regions",
  "/admin/wine-subregions": "Wine Subregions",
  "/admin/appellations": "Appellations",
  "/admin/grapes": "Grapes",
  "/admin/soil-types": "Soil Types",
  "/admin/dictionary": "Dictionary Terms",
  "/admin/news": "News Articles",
  "/admin/quiz": "Quiz Questions",
  "/admin/users": "Users",
  "/admin/subscriptions": "Subscriptions",
  "/admin/settings": "Settings",
};

function getTitle(pathname: string): string {
  if (pathToTitle[pathname]) return pathToTitle[pathname];
  for (const [path, title] of Object.entries(pathToTitle)) {
    if (pathname.startsWith(path + "/")) return title;
  }
  return "Dashboard";
}

export function TopBar() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="fixed left-0 right-0 top-0 z-20 flex h-12 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <span className="shrink-0 text-sm font-semibold text-slate-900">OenoBoost CMS</span>
        <span className="h-4 w-px shrink-0 bg-slate-200" aria-hidden />
        <h1 className="min-w-0 truncate text-sm font-medium text-slate-600">{title}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search..."
            className="h-8 w-40 rounded-md border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-300 focus:outline-none focus:ring-1 focus:ring-slate-200"
          />
        </div>
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>
        <div className="h-7 w-7 rounded-full bg-slate-200" aria-hidden />
      </div>
    </header>
  );
}
