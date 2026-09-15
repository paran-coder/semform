import type { ReactNode } from "react";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { TabletRail } from "./tablet-rail";

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <TabletRail />
      <main className="app-shell__main">{children}</main>
      <MobileNav />
    </div>
  );
}
