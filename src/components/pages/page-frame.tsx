import type { ReactNode } from "react";

export function PageFrame({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="standard-page">
      <header className="standard-topbar">
        <span className="standard-topbar__brand">SEMFORM</span>
        <span className="standard-topbar__version">v0.3.0</span>
      </header>
      <div className="standard-content">
        <div className="standard-heading">
          <div className="standard-heading__copy">
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h1>{title}</h1>
            {description ? <p>{description}</p> : null}
          </div>
          {actions ? <div className="standard-heading__actions">{actions}</div> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
