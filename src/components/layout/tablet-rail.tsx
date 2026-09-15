"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "@/components/ui/icons";
import { primaryNavigation, secondaryNavigation } from "@/config/navigation";
import { Wordmark } from "./wordmark";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/quotes" && pathname === "/quotes/new") return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function TabletRail() {
  const pathname = usePathname();

  return (
    <aside className="tablet-rail" aria-label="태블릿 메뉴">
      <div className="tablet-rail__brand">
        <Wordmark compact />
      </div>
      <Link
        aria-label="새 견적"
        className={`tablet-rail__new${isActivePath(pathname, "/quotes/new") ? " is-active" : ""}`}
        href="/quotes/new"
      >
        <PlusIcon size={20} />
      </Link>
      <nav className="tablet-rail__nav">
        {primaryNavigation.map((item) => (
          <Link
            aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
            aria-label={item.label}
            className={`tablet-rail__item${isActivePath(pathname, item.href) ? " is-active" : ""}`}
            href={item.href}
            key={item.href}
            title={item.label}
          >
            {item.icon}
          </Link>
        ))}
      </nav>
      <div className="tablet-rail__bottom">
        {secondaryNavigation.map((item) => (
          <Link
            aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
            aria-label={item.label}
            className={`tablet-rail__item${isActivePath(pathname, item.href) ? " is-active" : ""}`}
            href={item.href}
            key={item.href}
            title={item.label}
          >
            {item.icon}
          </Link>
        ))}
      </div>
    </aside>
  );
}
