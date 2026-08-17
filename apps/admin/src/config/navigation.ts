import { Scale, Users, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const navItems: NavItem[] = [
  { href: "/causas", label: "Causas", icon: Scale },
  { href: "/clientes", label: "Clientes", icon: Users },
];
