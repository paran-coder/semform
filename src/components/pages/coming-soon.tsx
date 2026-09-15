import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { ArrowRightIcon } from "@/components/ui/icons";
import { PageFrame } from "./page-frame";

export function ComingSoonPage({
  title,
  description,
  nextVersion,
}: {
  title: string;
  description: string;
  nextVersion: string;
}) {
  return (
    <AppShell>
      <PageFrame eyebrow="기능 준비 중" title={title} description={description}>
        <section className="placeholder-panel">
          <div className="placeholder-panel__index">{nextVersion}</div>
          <div>
            <h2>화면 경로는 연결되어 있습니다.</h2>
            <p>
              이제 메뉴를 눌러도 404가 발생하지 않습니다. 이 영역은 해당 버전에서 실제 기능으로 교체됩니다.
            </p>
          </div>
          <Link className="placeholder-panel__link" href="/">
            홈으로 돌아가기 <ArrowRightIcon size={16} />
          </Link>
        </section>
      </PageFrame>
    </AppShell>
  );
}
