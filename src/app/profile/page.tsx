import { AppShell } from "@/components/layout/app-shell";
import { PageFrame } from "@/components/pages/page-frame";
import { ProfileForm } from "@/components/profile/profile-form";

export default function ProfilePage() {
  return (
    <AppShell>
      <PageFrame
        eyebrow="내 정보"
        title="브랜드와 연락 정보를 저장하세요."
        description="여기에 저장한 정보는 이 브라우저의 IndexedDB에만 보관되며, 이후 견적서에 자동으로 불러옵니다."
      >
        <ProfileForm />
      </PageFrame>
    </AppShell>
  );
}
