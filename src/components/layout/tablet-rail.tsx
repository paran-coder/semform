import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";
import { primaryNavigation, secondaryNavigation } from "@/config/navigation";
import { Wordmark } from "./wordmark";

export function TabletRail() {
  return (
    <aside className="tablet-rail" aria-label="태블릿 메뉴">
      <div className="tablet-rail__brand">
        <Wordmark compact />
      </div>
      <Link aria-label="새 견적" className="tablet-rail__new" href="/quotes/new">
        <PlusIcon size={20} />
      </Link>
      <nav className="tablet-rail__nav">
        {primaryNavigation.map((item, index) => (
          <Link
            aria-label={item.label}
            className={`tablet-rail__item${index === 0 ? " is-active" : ""}`}
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
          <Link aria-label={item.label} className="tablet-rail__item" href={item.href} key={item.href} title={item.label}>
            {item.icon}
          </Link>
        ))}
      </div>
    </aside>
  );
}
