"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
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

export function ProfileForm() {
  const [profile, setProfile] = useState<BrandProfile>(EMPTY_BRAND_PROFILE);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [message, setMessage] = useState("브라우저 저장소를 확인하는 중입니다.");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;

    getRecord<BrandProfile>(STORES.profile, "primary")
      .then((stored) => {
        if (!active) return;
        if (stored) setProfile(stored);
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

  function updateField<K extends keyof BrandProfile>(field: K, value: BrandProfile[K]) {
    setProfile((current) => ({ ...current, [field]: value }));
    if (saveState === "saved") {
      setSaveState("idle");
      setMessage("변경사항이 저장되지 않았습니다.");
    }
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
        setSaveState("idle");
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
      updatedAt: new Date().toISOString(),
    };

    try {
      await putRecord(STORES.profile, nextProfile);
      setProfile(nextProfile);
      setSaveState("saved");
      setMessage("현재 브라우저에 저장했습니다.");
    } catch {
      setSaveState("error");
      setMessage("저장하지 못했습니다. 브라우저 저장소 설정을 확인해 주세요.");
    }
  }

  const disabled = saveState === "loading" || saveState === "saving";

  return (
    <form className="profile-form" onSubmit={handleSubmit}>
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
              <input
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleLogoChange}
                ref={fileInputRef}
                type="file"
              />
              <button className="sf-button sf-button--secondary sf-button--sm" onClick={() => fileInputRef.current?.click()} type="button">
                로고 선택
              </button>
              {profile.logoDataUrl ? (
                <button className="profile-text-button" onClick={() => updateField("logoDataUrl", "")} type="button">
                  제거
                </button>
              ) : null}
              <span>PNG · JPG · WEBP, 최대 2MB</span>
            </div>
          </div>

          <div className="form-grid form-grid--2">
            <label className="field">
              <span className="field__label">스튜디오 / 상호명</span>
              <input
                disabled={disabled}
                onChange={(event) => updateField("studioName", event.target.value)}
                placeholder="예: SEM Studio"
                type="text"
                value={profile.studioName}
              />
            </label>
            <label className="field">
              <span className="field__label">담당자명</span>
              <input
                disabled={disabled}
                onChange={(event) => updateField("contactName", event.target.value)}
                placeholder="예: 홍길동"
                type="text"
                value={profile.contactName}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="profile-contact-title">
        <div className="profile-section__heading">
          <div>
            <p className="eyebrow">연락처</p>
            <h2 id="profile-contact-title">고객에게 보여줄 연락 정보</h2>
          </div>
        </div>

        <div className="form-grid form-grid--2">
          <label className="field">
            <span className="field__label">전화번호</span>
            <input
              disabled={disabled}
              inputMode="tel"
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="010-0000-0000"
              type="tel"
              value={profile.phone}
            />
          </label>
          <label className="field">
            <span className="field__label">이메일</span>
            <input
              disabled={disabled}
              inputMode="email"
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="hello@example.com"
              type="email"
              value={profile.email}
            />
          </label>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="profile-business-title">
        <div className="profile-section__heading">
          <div>
            <p className="eyebrow">사업자 정보</p>
            <h2 id="profile-business-title">필요한 경우 견적서에 사용할 정보</h2>
          </div>
          <p>개인 제작자는 비워두어도 됩니다.</p>
        </div>

        <div className="form-grid form-grid--2">
          <label className="field">
            <span className="field__label">대표자명</span>
            <input
              disabled={disabled}
              onChange={(event) => updateField("representativeName", event.target.value)}
              type="text"
              value={profile.representativeName}
            />
          </label>
          <label className="field">
            <span className="field__label">사업자등록번호</span>
            <input
              disabled={disabled}
              inputMode="numeric"
              onChange={(event) => updateField("businessNumber", normalizeBusinessNumber(event.target.value))}
              placeholder="000-00-00000"
              type="text"
              value={profile.businessNumber}
            />
          </label>
          <label className="field field--span-2">
            <span className="field__label">사업장 주소</span>
            <input
              disabled={disabled}
              onChange={(event) => updateField("address", event.target.value)}
              type="text"
              value={profile.address}
            />
          </label>
          <label className="field">
            <span className="field__label">업태</span>
            <input disabled={disabled} onChange={(event) => updateField("businessType", event.target.value)} type="text" value={profile.businessType} />
          </label>
          <label className="field">
            <span className="field__label">종목</span>
            <input disabled={disabled} onChange={(event) => updateField("businessItem", event.target.value)} type="text" value={profile.businessItem} />
          </label>
        </div>
      </section>

      <section className="profile-section" aria-labelledby="profile-online-title">
        <div className="profile-section__heading">
          <div>
            <p className="eyebrow">온라인</p>
            <h2 id="profile-online-title">홈페이지와 채널</h2>
          </div>
        </div>

        <div className="form-grid form-grid--2">
          <label className="field">
            <span className="field__label">홈페이지</span>
            <input disabled={disabled} onChange={(event) => updateField("website", event.target.value)} placeholder="https://" type="url" value={profile.website} />
          </label>
          <label className="field">
            <span className="field__label">블로그</span>
            <input disabled={disabled} onChange={(event) => updateField("blog", event.target.value)} placeholder="https://" type="url" value={profile.blog} />
          </label>
          <label className="field">
            <span className="field__label">Instagram</span>
            <input disabled={disabled} onChange={(event) => updateField("instagram", event.target.value)} placeholder="https://instagram.com/..." type="url" value={profile.instagram} />
          </label>
          <label className="field">
            <span className="field__label">YouTube</span>
            <input disabled={disabled} onChange={(event) => updateField("youtube", event.target.value)} placeholder="https://youtube.com/..." type="url" value={profile.youtube} />
          </label>
          <label className="field field--span-2">
            <span className="field__label">기타 링크</span>
            <input disabled={disabled} onChange={(event) => updateField("otherUrl", event.target.value)} placeholder="https://" type="url" value={profile.otherUrl} />
          </label>
        </div>
      </section>

      <div className="profile-savebar">
        <div className={`save-status save-status--${saveState}`} role="status">
          <span className="save-status__dot" aria-hidden="true" />
          <span>{message}</span>
        </div>
        <button className="sf-button sf-button--primary sf-button--lg" disabled={disabled} type="submit">
          {saveState === "saving" ? "저장 중" : "내 정보 저장"}
        </button>
      </div>
    </form>
  );
}
