"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PlusIcon } from "@/components/ui/icons";
import { primaryNavigation, secondaryNavigation } from "@/config/navigation";

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileNav() {
  const pathname = usePathname();
  const home = primaryNavigation[0];
  const quotes = primaryNavigation[1];
  const clients = primaryNavigation[2];
  const settings = secondaryNavigation.find((item) => item.label === "설정")!;
  const items = [home, quotes, clients, settings];

  return (
    <nav className="mobile-nav" aria-label="모바일 메뉴">
      <Link className={`mobile-nav__item${isActivePath(pathname, items[0].href) ? " is-active" : ""}`} href={items[0].href}>
        <span className="mobile-nav__icon">{items[0].icon}</span>
        <span>홈</span>
      </Link>
      <Link className={`mobile-nav__item${isActivePath(pathname, items[1].href) ? " is-active" : ""}`} href={items[1].href}>
        <span className="mobile-nav__icon">{items[1].icon}</span>
        <span>견적</span>
      </Link>
      <Link
        aria-current={isActivePath(pathname, "/quotes/new") ? "page" : undefined}
        className={`mobile-nav__create${isActivePath(pathname, "/quotes/new") ? " is-active" : ""}`}
        href="/quotes/new"
        aria-label="새 견적"
      >
        <PlusIcon size={24} />
      </Link>
      <Link className={`mobile-nav__item${isActivePath(pathname, items[2].href) ? " is-active" : ""}`} href={items[2].href}>
        <span className="mobile-nav__icon">{items[2].icon}</span>
        <span>고객</span>
      </Link>
      <Link className={`mobile-nav__item${isActivePath(pathname, items[3].href) ? " is-active" : ""}`} href={items[3].href}>
        <span className="mobile-nav__icon">{items[3].icon}</span>
        <span>설정</span>
      </Link>
    </nav>
  );
}
