import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageFrame } from "@/components/pages/page-frame";
import { ArrowRightIcon, CoinsIcon, SlidersIcon, UserIcon } from "@/components/ui/icons";

const managementLinks = [
  {
    href: "/profile",
    title: "내 정보",
    description: "로고, 상호, 연락처, 사업자 정보와 온라인 채널을 관리합니다.",
    icon: <UserIcon />,
  },
  {
    href: "/pricing",
    title: "단가 프리셋",
    description: "고객 유형별 작업 단가와 계산 방식을 저장합니다.",
    icon: <CoinsIcon />,
  },
  {
    href: "/terms",
    title: "조건 프리셋",
    description: "결제, 수정, 권리, 원본 제공과 견적 유효기간을 저장합니다.",
    icon: <SlidersIcon />,
  },
];

export default function SettingsPage() {
  return (
    <AppShell>
      <PageFrame
        eyebrow="설정"
        title="셈폼의 기본 정보를 관리하세요."
        description="현재 버전에서는 내 정보와 단가·조건 프리셋을 관리할 수 있습니다. 모든 데이터는 현재 브라우저에만 저장됩니다."
      >
        <div className="settings-grid" aria-label="설정 메뉴">
          {managementLinks.map((item) => (
            <Link className="settings-card" href={item.href} key={item.href}>
              <span className="settings-card__icon" aria-hidden="true">{item.icon}</span>
              <span className="settings-card__copy">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </span>
              <ArrowRightIcon size={17} />
            </Link>
          ))}
        </div>

        <section className="settings-future">
          <div>
            <p className="eyebrow">다음 단계</p>
            <h2>데이터 관리와 견적 기본값</h2>
            <p>VAT, 견적번호 규칙, 전체 백업·복원은 이후 버전에서 이 설정 화면에 추가됩니다.</p>
          </div>
          <span>v0.8.0</span>
        </section>
      </PageFrame>
    </AppShell>
  );
}
