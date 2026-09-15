import { ClientsManager } from "@/components/clients/clients-manager";
import { AppShell } from "@/components/layout/app-shell";
import { PageFrame } from "@/components/pages/page-frame";

export default function ClientsPage() {
  return (
    <AppShell>
      <PageFrame
        eyebrow="고객"
        title="고객 정보를 한 번만 입력하세요."
        description="연락처와 사업자 정보를 저장해 두면 새 견적에서 바로 불러올 수 있고, 고객별 과거 견적도 자동으로 모아볼 수 있습니다."
      >
        <ClientsManager />
      </PageFrame>
    </AppShell>
  );
}
