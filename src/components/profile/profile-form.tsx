"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { getRecord, putRecord, STORES } from "@/lib/storage/database";
import { BrandProfile, EMPTY_BRAND_PROFILE } from "@/types/profile";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const SUPPORTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/webp"];

type SaveState = "idle" | "loading" | "saving" | "saved" | "error";

function normalizeBusinessNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
}

function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function ProfileForm() {
  const [profile, setProfile] = useState<BrandProfile>(EMPTY_BRAND_PROFILE);
  const [persistedSnapshot, setPersistedSnapshot] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [message, setMessage] = useState("브라우저 저장소를 확인하는 중입니다.");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const dirty = useMemo(() => saveState !== "loading" && JSON.stringify(profile) !== persistedSnapshot, [profile, persistedSnapshot, saveState]);

  useEffect(() => {
    let active = true;

    getRecord<BrandProfile>(STORES.profile, "primary")
      .then((stored) => {
        if (!active) return;
        const next = stored ?? EMPTY_BRAND_PROFILE;
        setProfile(next);
        setPersistedSnapshot(JSON.stringify(next));
        setSaveState("idle");
        setMessage(stored ? "저장된 내 정보를 불러왔습니다." : "아직 저장된 정보가 없습니다.");
      })
      .catch(() => {
        if (!active) return;
        setSaveState("error");
        setMessage("이 브라우저에서 로컬 저장소를 사용할 수 없습니다.");
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return;
      event.preventDefault();
    }

    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty) formRef.current?.requestSubmit();
      }
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dirty]);

  function updateField<K extends keyof BrandProfile>(field: K, value: BrandProfile[K]) {
    setProfile((current) => ({ ...current, [field]: value }));
    setSaveState("idle");
    setMessage("변경사항이 저장되지 않았습니다.");
  }

  function normalizeUrlField(field: "website" | "blog" | "instagram" | "youtube" | "otherUrl") {
    const next = normalizeUrl(profile[field]);
    if (next !== profile[field]) updateField(field, next);
  }

  async function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!SUPPORTED_LOGO_TYPES.includes(file.type)) {
      setSaveState("error");
      setMessage("PNG, JPG, WEBP 이미지만 사용할 수 있습니다.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      setSaveState("error");
      setMessage("로고 파일은 2MB 이하로 사용해 주세요.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("logoDataUrl", reader.result);
        setMessage("새 로고가 선택되었습니다. 저장을 눌러 적용하세요.");
      }
    };
    reader.onerror = () => {
      setSaveState("error");
      setMessage("로고 파일을 읽지 못했습니다.");
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState("saving");
    setMessage("현재 브라우저에 저장하는 중입니다.");

    const nextProfile: BrandProfile = {
      ...profile,
      id: "primary",
      studioName: profile.studioName.trim(),
      contactName: profile.contactName.trim(),
      representativeName: profile.representativeName.trim(),
      email: profile.email.trim(),
      address: profile.address.trim(),
      businessType: profile.businessType.trim(),
      businessItem: profile.businessItem.trim(),
      website: normalizeUrl(profile.website),
      blog: normalizeUrl(profile.blog),
      instagram: normalizeUrl(profile.instagram),
      youtube: normalizeUrl(profile.youtube),
      otherUrl: normalizeUrl(profile.otherUrl),
      updatedAt: new Date().toISOString(),
    };

    try {
      await putRecord(STORES.profile, nextProfile);
      setProfile(nextProfile);
      setPersistedSnapshot(JSON.stringify(nextProfile));
      setSaveState("saved");
      setMessage("현재 브라우저에 저장했습니다.");
    } catch {
      setSaveState("error");
      setMessage("저장하지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.");
    }
  }

  const disabled = saveState === "loading" || saveState === "saving";

  return (
    <form className="profile-form" id="profile-form" onSubmit={handleSubmit} ref={formRef}>
      <div className="profile-local-note">
        <strong>로컬 저장</strong>
        <span>입력한 정보와 로고는 서버로 전송하지 않고 현재 브라우저에만 저장합니다.</span>
      </div>

      <section className="profile-section profile-section--brand" aria-labelledby="profile-brand-title">
        <div className="profile-section__heading">
          <div>
            <p className="eyebrow">브랜드</p>
            <h2 id="profile-brand-title">견적서에 표시할 기본 정보</h2>
          </div>
          <p>로고와 스튜디오명은 이후 PDF 견적서의 기본 헤더에 사용됩니다.</p>
        </div>

        <div className="brand-editor">
          <div className="brand-logo-editor">
            <div className={`brand-logo-preview${profile.logoDataUrl ? " has-image" : ""}`}>
              {profile.logoDataUrl ? <img alt="등록한 로고 미리보기" src={profile.logoDataUrl} /> : <span>LOGO</span>}
            </div>
            <div className="brand-logo-actions">
              <input accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={handleLogoChange} ref={fileInputRef} type="file" />
              <button className="sf-button sf-button--secondary sf-button--sm" onClick={() => fileInputRef.current?.click()} type="button">로고 선택</button>
              {profile.logoDataUrl ? <button className="profile-text-button" onClick={() => updateField("logoDataUrl", "")} type="button">제거</button> : null}
              <span>PNG · JPG · WEBP, 최대 2MB</span>
            </div>
          </div>

          <div className="form-grid form-grid--2">
            <label className="field">
              <span className="field__label">스튜디오 / 상호명</span>
              <input autoComplete="organization" disabled={disabled} maxLength={80} onChange={(event) => updateField("studioName", event.target.value)} placeholder="예: SEM Studio" type="text" value={profile.studioName} />
            </label>
            <label className="field">
              <span className="field__label">담당자명</span>
              <input autoComplete="name" disabled={disabled} maxLength={40} onChange={(event) => updateField("contactName", event.target.value)} placeholder="예: 홍길동" type="text" value={profile.contactName} />
            </label>
          </div>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="profile-contact-title">
        <div className="profile-section__heading"><div><p className="eyebrow">연락처</p><h2 id="profile-contact-title">고객에게 보여줄 연락 정보</h2></div></div>
        <div className="form-grid form-grid--2">
          <label className="field"><span className="field__label">전화번호</span><input autoComplete="tel" disabled={disabled} inputMode="tel" onChange={(event) => updateField("phone", normalizePhone(event.target.value))} placeholder="010-0000-0000" type="tel" value={profile.phone} /></label>
          <label className="field"><span className="field__label">이메일</span><input autoComplete="email" disabled={disabled} inputMode="email" maxLength={120} onChange={(event) => updateField("email", event.target.value)} placeholder="hello@example.com" type="email" value={profile.email} /></label>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="profile-business-title">
        <div className="profile-section__heading"><div><p className="eyebrow">사업자 정보</p><h2 id="profile-business-title">필요한 경우 견적서에 사용할 정보</h2></div><p>개인 제작자는 비워두어도 됩니다.</p></div>
        <div className="form-grid form-grid--2">
          <label className="field"><span className="field__label">대표자명</span><input disabled={disabled} maxLength={40} onChange={(event) => updateField("representativeName", event.target.value)} type="text" value={profile.representativeName} /></label>
          <label className="field"><span className="field__label">사업자등록번호</span><input disabled={disabled} inputMode="numeric" onChange={(event) => updateField("businessNumber", normalizeBusinessNumber(event.target.value))} placeholder="000-00-00000" type="text" value={profile.businessNumber} /></label>
          <label className="field field--span-2"><span className="field__label">사업장 주소</span><input autoComplete="street-address" disabled={disabled} maxLength={160} onChange={(event) => updateField("address", event.target.value)} type="text" value={profile.address} /></label>
          <label className="field"><span className="field__label">업태</span><input disabled={disabled} maxLength={60} onChange={(event) => updateField("businessType", event.target.value)} type="text" value={profile.businessType} /></label>
          <label className="field"><span className="field__label">종목</span><input disabled={disabled} maxLength={60} onChange={(event) => updateField("businessItem", event.target.value)} type="text" value={profile.businessItem} /></label>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="profile-online-title">
        <div className="profile-section__heading"><div><p className="eyebrow">온라인</p><h2 id="profile-online-title">홈페이지와 채널</h2></div><p>주소만 입력해도 저장할 때 https://를 자동으로 보완합니다.</p></div>
        <div className="form-grid form-grid--2">
          <label className="field"><span className="field__label">홈페이지</span><input disabled={disabled} onBlur={() => normalizeUrlField("website")} onChange={(event) => updateField("website", event.target.value)} placeholder="example.com" type="text" value={profile.website} /></label>
          <label className="field"><span className="field__label">블로그</span><input disabled={disabled} onBlur={() => normalizeUrlField("blog")} onChange={(event) => updateField("blog", event.target.value)} placeholder="blog.naver.com/..." type="text" value={profile.blog} /></label>
          <label className="field"><span className="field__label">Instagram</span><input disabled={disabled} onBlur={() => normalizeUrlField("instagram")} onChange={(event) => updateField("instagram", event.target.value)} placeholder="instagram.com/..." type="text" value={profile.instagram} /></label>
          <label className="field"><span className="field__label">YouTube</span><input disabled={disabled} onBlur={() => normalizeUrlField("youtube")} onChange={(event) => updateField("youtube", event.target.value)} placeholder="youtube.com/@..." type="text" value={profile.youtube} /></label>
          <label className="field field--span-2"><span className="field__label">기타 링크</span><input disabled={disabled} onBlur={() => normalizeUrlField("otherUrl")} onChange={(event) => updateField("otherUrl", event.target.value)} placeholder="example.com/portfolio" type="text" value={profile.otherUrl} /></label>
        </div>
      </section>

      <div className="profile-savebar">
        <div className={`save-status save-status--${saveState}`} role="status"><span className="save-status__dot" aria-hidden="true" /><span>{dirty && saveState !== "error" ? "변경사항이 저장되지 않았습니다." : message}</span></div>
        <div className="profile-savebar__right"><span className="save-shortcut">⌘/Ctrl + S</span><button className="sf-button sf-button--primary sf-button--lg" disabled={disabled || !dirty} type="submit">{saveState === "saving" ? "저장 중" : "내 정보 저장"}</button></div>
      </div>
    </form>
  );
}
