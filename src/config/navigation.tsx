import type { ReactNode } from "react";
import {
  CoinsIcon,
  FileTextIcon,
  HomeIcon,
  SettingsIcon,
  SlidersIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/icons";

export type NavItem = {
  label: string;
  href: string;
  icon: ReactNode;
  mobile?: boolean;
};

export const primaryNavigation: NavItem[] = [
  { label: "홈", href: "/", icon: <HomeIcon />, mobile: true },
  { label: "견적", href: "/quotes", icon: <FileTextIcon />, mobile: true },
  { label: "고객", href: "/clients", icon: <UsersIcon />, mobile: true },
  { label: "단가 프리셋", href: "/pricing", icon: <CoinsIcon /> },
  { label: "조건 프리셋", href: "/terms", icon: <SlidersIcon /> },
];

export const secondaryNavigation: NavItem[] = [
  { label: "내 정보", href: "/profile", icon: <UserIcon /> },
  { label: "설정", href: "/settings", icon: <SettingsIcon />, mobile: true },
];
