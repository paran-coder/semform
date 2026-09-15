import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ size = 20, children, ...props }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M3.5 10.8 12 3.8l8.5 7v8.7a1 1 0 0 1-1 1h-5.2v-6.1H9.7v6.1H4.5a1 1 0 0 1-1-1v-8.7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function FileTextIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M6.5 3.5h7l4 4v13h-11v-17Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M13.5 3.5v4h4M9 12h6M9 15.5h6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="9" cy="8.5" r="3" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.8 19c.3-3.1 2.2-5 5.2-5s4.9 1.9 5.2 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <path d="M15 6.2a2.7 2.7 0 0 1 0 5.2M16.8 14.3c2 .7 3.2 2.3 3.4 4.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function CoinsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <ellipse cx="9" cy="6.5" rx="5.5" ry="2.7" stroke="currentColor" strokeWidth="1.7" />
      <path d="M3.5 6.5v4c0 1.5 2.5 2.7 5.5 2.7s5.5-1.2 5.5-2.7v-4M3.5 10.5v4c0 1.5 2.5 2.7 5.5 2.7 1.1 0 2.1-.2 3-.4" stroke="currentColor" strokeWidth="1.7" />
      <path d="M14.8 12.5h5.7v6.5h-5.7z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M17.65 14.1v3.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function SlidersIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4 6h7M15 6h5M4 12h2M10 12h10M4 18h9M17 18h3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
      <circle cx="13" cy="6" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="8" cy="12" r="2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="15" cy="18" r="2" stroke="currentColor" strokeWidth="1.7" />
    </IconBase>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M5 20c.4-4 2.9-6.3 7-6.3s6.6 2.3 7 6.3" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="1.7" />
      <path d="m19.2 13.2 1.3 1-.9 2.1-1.7-.2a7.8 7.8 0 0 1-1.7 1.7l.2 1.7-2.1.9-1-1.3a7.8 7.8 0 0 1-2.5 0l-1 1.3-2.1-.9.2-1.7a7.8 7.8 0 0 1-1.7-1.7l-1.7.2-.9-2.1 1.3-1a7.8 7.8 0 0 1 0-2.5l-1.3-1 .9-2.1 1.7.2a7.8 7.8 0 0 1 1.7-1.7l-.2-1.7 2.1-.9 1 1.3a7.8 7.8 0 0 1 2.5 0l1-1.3 2.1.9-.2 1.7a7.8 7.8 0 0 1 1.7 1.7l1.7-.2.9 2.1-1.3 1a7.8 7.8 0 0 1 0 2.5Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </IconBase>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 12h13M14 8l4 4-4 4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="5.8" stroke="currentColor" strokeWidth="1.7" />
      <path d="m15.5 15.5 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="6" cy="12" r="1.2" fill="currentColor" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
      <circle cx="18" cy="12" r="1.2" fill="currentColor" />
    </IconBase>
  );
}

export function BuildingIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M5 20V5.5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1V20M15 9h3a1 1 0 0 1 1 1v10M3 20h18" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M8 8h4M8 11.5h4M8 15h4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </IconBase>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <rect x="8" y="8" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.7" />
      <path d="M15 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4v10M8 10l4 4 4-4M5 19h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 15V5M8 9l4-4 4 4M5 19h14" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
    </IconBase>
  );
}

export function GripIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="8" cy="7" r="1.2" fill="currentColor" /><circle cx="16" cy="7" r="1.2" fill="currentColor" />
      <circle cx="8" cy="12" r="1.2" fill="currentColor" /><circle cx="16" cy="12" r="1.2" fill="currentColor" />
      <circle cx="8" cy="17" r="1.2" fill="currentColor" /><circle cx="16" cy="17" r="1.2" fill="currentColor" />
    </IconBase>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 19V5M7 10l5-5 5 5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></IconBase>;
}

export function ArrowDownIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 5v14M7 14l5 5 5-5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></IconBase>;
}

export function TrashIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M4.5 7h15M9 7V4.5h6V7M7.5 7l.8 12.5h7.4L16.5 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" />
      <path d="M10 10.5v5.5M14 10.5v5.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </IconBase>
  );
}
