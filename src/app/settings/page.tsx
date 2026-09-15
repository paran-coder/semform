import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageFrame } from "@/components/pages/page-frame";
import { DataManager } from "@/components/settings/data-manager";
import { ArrowRightIcon, CoinsIcon, SlidersIcon, UserIcon } from "@/components/ui/icons";

const managementLinks = [
  { href: "/profile", title: "내 정보", description: "로고, 상호, 연락처, 사업자 정보와 온라인 채널을 관리합니다.", icon: <UserIcon /> },
  { href: "/pricing", title: "단가 프리셋", description: "고객 유형별 작업 단가와 계산 방식을 저장합니다.", icon: <CoinsIcon /> },
  { href: "/terms", title: "조건 프리셋", description: "결제, 수정, 권리, 원본 제공과 견적 유효기간을 저장합니다.", icon: <SlidersIcon /> },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <PageFrame
        eyebrow="설정"
        title="셈폼의 기본 정보와 데이터를 관리하세요."
        description="내 정보와 단가·조건 프리셋을 관리하고, 현재 브라우저 데이터를 백업·복원하거나 필요할 때 안전하게 초기화할 수 있습니다."
      >
        <div className="settings-grid" aria-label="설정 메뉴">
          {managementLinks.map((item) => (
            <Link className="settings-card" href={item.href} key={item.href}>
              <span className="settings-card__icon" aria-hidden="true">{item.icon}</span>
              <span className="settings-card__copy"><strong>{item.title}</strong><span>{item.description}</span></span>
              <ArrowRightIcon size={17} />
            </Link>
          ))}
        </div>
        <DataManager />
      </PageFrame>
    </AppShell>
  );
}
