import { AppShell } from "@/components/layout/app-shell";
import { PageFrame } from "@/components/pages/page-frame";
import { PricingPresetsManager } from "@/components/pricing/pricing-presets-manager";

export default function PricingPage() {
  return (
    <AppShell>
      <PageFrame
        eyebrow="단가 프리셋"
        title="내 단가 계산 방식을 저장하세요."
        description="고정금액, 수량·시간·영상 길이 기준, 비율 계산을 조합해 고객 유형별 가격표를 만들 수 있습니다. 데이터는 현재 브라우저에만 저장됩니다."
      >
        <PricingPresetsManager />
      </PageFrame>
    </AppShell>
  );
}
