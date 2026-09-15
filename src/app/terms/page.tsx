import { AppShell } from "@/components/layout/app-shell";
import { PageFrame } from "@/components/pages/page-frame";
import { TermPresetsManager } from "@/components/terms/term-presets-manager";

export default function TermsPage() {
  return (
    <AppShell>
      <PageFrame
        eyebrow="조건 프리셋"
        title="반복해서 쓰는 거래 조건을 저장하세요."
        description="계약금과 잔금, 수정 횟수, 상업적 이용, 저작권, 원본 제공과 견적 유효기간을 프리셋으로 관리합니다."
      >
        <TermPresetsManager />
      </PageFrame>
    </AppShell>
  );
}
