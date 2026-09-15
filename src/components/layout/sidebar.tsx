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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar" aria-label="주요 메뉴">
      <div className="sidebar__brand">
        <Wordmark />
      </div>

      <nav className="sidebar__nav">
        <Link
          className={`sidebar__new-quote${isActivePath(pathname, "/quotes/new") ? " is-active" : ""}`}
          href="/quotes/new"
        >
          <PlusIcon size={18} />
          <span>새 견적</span>
        </Link>

        <div className="sidebar__group">
          {primaryNavigation.map((item) => (
            <Link
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              className={`sidebar__item${isActivePath(pathname, item.href) ? " is-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="sidebar__divider" />

        <div className="sidebar__group sidebar__group--bottom">
          {secondaryNavigation.map((item) => (
            <Link
              aria-current={isActivePath(pathname, item.href) ? "page" : undefined}
              className={`sidebar__item${isActivePath(pathname, item.href) ? " is-active" : ""}`}
              href={item.href}
              key={item.href}
            >
              <span className="sidebar__icon">{item.icon}</span>
              <span className="sidebar__label">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="sidebar__foot">
        <span className="sidebar__storage-dot" aria-hidden="true" />
        <span className="sidebar__foot-copy">개인용 로컬 견적 도구</span>
      </div>
    </aside>
  );
}
