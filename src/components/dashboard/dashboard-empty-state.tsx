import Link from "next/link";
import { PlusIcon } from "@/components/ui/icons";

export function DashboardEmptyState() {
  return (
    <section className="dashboard-empty" aria-labelledby="empty-title">
      <p className="eyebrow">첫 시작</p>
      <h2 id="empty-title">첫 견적을 만들어보세요.</h2>
      <p>단가와 조건을 한 번 정리해두면 다음 견적부터 더 빠르게 시작할 수 있습니다.</p>
      <div className="dashboard-empty__actions">
        <Link className="sf-button sf-button--primary sf-button--md" href="/quotes/new">
          <span className="sf-button__icon"><PlusIcon size={18} /></span>
          <span>첫 견적 만들기</span>
        </Link>
        <Link className="text-action text-action--link" href="/pricing">먼저 설정하기</Link>
      </div>
    </section>
  );
}
