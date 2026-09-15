import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { MonthlySummary } from "./monthly-summary";
import { RecentQuotes } from "./recent-quotes";

export function Dashboard() {
  return (
    <div className="dashboard-page">
      <header className="dashboard-topbar">
        <div>
          <span className="dashboard-topbar__brand">SEMFORM</span>
          <span className="dashboard-topbar__date">2026.09.15</span>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="dashboard-hero" aria-labelledby="dashboard-title">
          <div className="dashboard-hero__copy">
            <p className="eyebrow">견적 작업 공간</p>
            <h1 id="dashboard-title">견적을 만들어보세요.</h1>
            <p>자주 쓰는 단가와 조건을 불러와 빠르게 계산하고, 깔끔한 견적서로 정리합니다.</p>
          </div>
          <Button className="dashboard-hero__cta" leadingIcon={<PlusIcon size={18} />} size="lg">
            새 견적 만들기
          </Button>
        </section>

        <MonthlySummary />
        <RecentQuotes />
      </div>
    </div>
  );
}
