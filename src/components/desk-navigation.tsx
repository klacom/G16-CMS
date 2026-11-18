"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
type Props = { role: string; name: string; inboxCount: number };
export function DeskNavigation({ role, name, inboxCount }: Props) {
  const path = usePathname(),
    [open, setOpen] = useState(false);
  const entries = [
    ["/dashboard", "Overview"],
    ["/dashboard/inbox", "Inbox"],
    ...(role !== "reviewer"
      ? [["/dashboard/articles", role === "admin" ? "Articles" : "My articles"]]
      : []),
    ...(role === "reviewer" ? [["/dashboard/reviews", "Reviews"]] : []),
    ...(role === "admin"
      ? [
          ["/dashboard/users", "People"],
          ["/dashboard/messages", "Messages"],
          ["/dashboard/audit", "Audit log"],
          ["/dashboard/settings", "Site settings"],
        ]
      : []),
    ["/dashboard/account", "Account"],
  ];
  const nav = (
    <div className="side on-night bg-night">
      <div className="side-brand">
        <Link href="/" className="display">
          ICG
        </Link>
        <span>The campus desk</span>
      </div>
      <nav aria-label="Desk">
        {entries.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="nav-item"
            aria-current={
              path === href ||
              (href !== "/dashboard" && path.startsWith(href + "/"))
                ? "page"
                : undefined
            }
            onClick={() => setOpen(false)}
          >
            {label}
            {href === "/dashboard/inbox" && inboxCount > 0 && (
              <span className="nav-count">{inboxCount}</span>
            )}
          </Link>
        ))}
      </nav>
      <div className="side-foot">
        <p>
          {name}
          <br />
          <small className="muted-dark">{role}</small>
        </p>
        <Link className="nav-item" href="/">
          Visit the public site ↗
        </Link>
      </div>
    </div>
  );
  return (
    <>
      <aside className="desk-sidebar">{nav}</aside>
      <div className="desk-topbar bg-night">
        <button
          className="menu-button"
          aria-expanded={open}
          aria-controls="mobile-desk-menu"
          onClick={() => setOpen(!open)}
        >
          {open ? "Close" : "Menu"}
        </button>
        <Link className="display" href="/dashboard">
          ICG / Desk
        </Link>
      </div>
      {open && (
        <div id="mobile-desk-menu" className="mobile-desk-nav">
          {nav}
        </div>
      )}
    </>
  );
}
