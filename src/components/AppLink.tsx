"use client";

import type { AnchorHTMLAttributes } from "react";
import { useAppStore } from "@/store/useAppStore";
import { pathFor, routeForTarget } from "@/lib/routes";

/**
 * A real link (<a href>) to a page of the app — so it can be opened in a new tab, copied or
 * bookmarked — that navigates in place on a plain click. `to` takes the same targets as goTo():
 * "home", a view name ("carte", "sandbox"…) or a chapter id.
 */
export function AppLink({
  to,
  onNavigate,
  onClick,
  ...rest
}: { to: string; onNavigate?: () => void } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const goTo = useAppStore((s) => s.goTo);
  return (
    <a
      {...rest}
      href={pathFor(routeForTarget(to))}
      onClick={(e) => {
        onClick?.(e);
        // Ctrl/Cmd/Shift/middle click: leave it to the browser (new tab / window).
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        goTo(to);
        onNavigate?.();
      }}
    />
  );
}
