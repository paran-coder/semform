import { APP_CONFIG } from "@/config/app";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <div aria-label={APP_CONFIG.name} className={`wordmark${compact ? " wordmark--compact" : ""}`}>
      <span className="wordmark__mark" aria-hidden="true" />
      <span className="wordmark__text">{compact ? "S" : APP_CONFIG.name}</span>
    </div>
  );
}
