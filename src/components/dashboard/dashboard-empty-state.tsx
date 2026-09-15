import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";

export function DashboardEmptyState() {
  return (
    <section className="dashboard-empty" aria-labelledby="empty-title">
      <p className="eyebrow">첫 시작</p>
      <h2 id="empty-title">첫 견적을 만들어보세요.</h2>
      <p>단가와 조건을 한 번 정리해두면 다음 견적부터 더 빠르게 시작할 수 있습니다.</p>
      <div className="dashboard-empty__actions">
        <Button leadingIcon={<PlusIcon size={18} />}>첫 견적 만들기</Button>
        <button className="text-action" type="button">먼저 설정하기</button>
      </div>
    </section>
  );
}
