import { AppShell } from "@/components/layout/app-shell";
import { PageFrame } from "@/components/pages/page-frame";
import { QuotesManager } from "@/components/quotes/quotes-manager";

export default function QuotesPage() {
  return (
    <AppShell>
      <PageFrame eyebrow="견적" title="견적을 한곳에서 관리하세요." description="저장한 견적을 고객, 프로젝트명, 견적번호로 찾고 상세 내용을 다시 확인할 수 있습니다.">
        <QuotesManager />
      </PageFrame>
    </AppShell>
  );
}
