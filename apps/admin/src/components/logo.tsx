"use client";

import { ClcLogoIcon } from "@/components/icons/clc-logo";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

type LogoProps = {
  variant: "sidebar" | "header" | "auth-form";
  className?: string;
};

export function Logo({ variant, className }: LogoProps) {
  if (variant === "sidebar") {
    return <SidebarLogo className={className} />;
  }
  return <LogoIcon variant={variant} className={className} />;
}

function SidebarLogo({ className }: { className?: string }) {
  // useSidebar throws outside a SidebarProvider, so this branch only
  // renders when we know we're inside the sidebar tree.
  const { state } = useSidebar();
  return <LogoIcon variant="sidebar" compact={state !== "expanded"} className={className} />;
}

function LogoIcon({
  variant,
  compact = false,
  className,
}: {
  variant: LogoProps["variant"];
  compact?: boolean;
  className?: string;
}) {
  const sizeClass =
    variant === "auth-form"
      ? "w-40 text-foreground"
      : variant === "header"
        ? "w-28 text-foreground"
        : compact
          ? "w-8 text-sidebar-foreground"
          : "w-24 text-sidebar-foreground";

  return (
    <div className="inline-flex items-center justify-center">
      <ClcLogoIcon compact={compact} className={cn("h-auto", sizeClass, className)} />
    </div>
  );
}
