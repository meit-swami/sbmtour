import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { apiGet } from "@/lib/api";
import type { MenuNode, MenuResponse } from "@/types/site";

const FALLBACK: { to: string; label: string }[] = [
  { to: "/", label: "Home" },
  { to: "/countries", label: "Countries" },
  { to: "/destinations", label: "Destinations" },
  { to: "/packages", label: "Packages" },
  { to: "/hotels", label: "Hotels" },
  { to: "/vehicles", label: "Vehicles" },
  { to: "/plan-trip", label: "Plan trip" },
  { to: "/about", label: "About" },
  { to: "/faq", label: "FAQ" },
  { to: "/faqs-db", label: "FAQ (DB)" },
  { to: "/team", label: "Team" },
  { to: "/blog", label: "Blog" },
  { to: "/support", label: "Support" },
  { to: "/contact", label: "Contact" },
];

function isExternal(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

function MenuLink({
  node,
  className,
  onNavigate,
}: {
  node: MenuNode;
  className: string;
  onNavigate?: () => void;
}) {
  const done = () => onNavigate?.();
  if (isExternal(node.href) && node.href !== "#") {
    return (
      <a
        href={node.href}
        target={node.target}
        rel={node.target === "_blank" ? "noreferrer" : undefined}
        className={className}
        onClick={done}
      >
        {node.title}
      </a>
    );
  }
  return (
    <Link
      to={node.href === "#" ? "/" : node.href}
      className={className}
      onClick={done}
    >
      {node.title}
    </Link>
  );
}

function DropdownPanel({
  children,
  onNavigate,
}: {
  children: MenuNode[];
  onNavigate?: () => void;
}) {
  return (
    <div className="invisible absolute left-0 top-full z-50 min-w-[220px] rounded-lg border border-slate-600 bg-brand-navy py-2 shadow-xl opacity-0 transition group-hover:visible group-hover:opacity-100">
      {children.map((c) => (
        <div key={c.id} className="px-1">
          <MenuLink
            node={c}
            className="block rounded px-3 py-2 text-sm text-slate-200 hover:bg-white/10"
            onNavigate={onNavigate}
          />
          {c.children.length > 0 ? (
            <div className="ml-2 border-l border-white/10 py-1 pl-2">
              {c.children.map((cc) => (
                <MenuLink
                  key={cc.id}
                  node={cc}
                  className="block rounded px-2 py-1 text-xs text-slate-300 hover:bg-white/10"
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function MobileNavTree({
  nodes,
  onPick,
}: {
  nodes: MenuNode[];
  onPick: () => void;
}) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const itemClass =
    "block rounded-md px-3 py-2 text-sm font-medium text-slate-100 hover:bg-white/10";

  function toggle(id: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderNode(node: MenuNode, depth = 0) {
    const hasChildren = node.children.length > 0;
    const isOpen = open.has(node.id);
    const pad =
      depth === 0 ? "" : depth === 1 ? "pl-3 border-l border-white/15" : "pl-4 border-l border-white/10";
    return (
      <div key={node.id} className={`${depth === 0 ? "border-b border-white/10" : ""} ${pad}`}>
        <div className="flex items-center gap-1 py-1">
          <MenuLink
            node={node}
            className={`${itemClass} min-w-0 flex-1`}
            onNavigate={!hasChildren ? onPick : undefined}
          />
          {hasChildren ? (
            <button
              type="button"
              aria-label={isOpen ? "Collapse section" : "Expand section"}
              aria-expanded={isOpen}
              onClick={() => toggle(node.id)}
              className="rounded p-2 text-slate-300 hover:bg-white/10"
            >
              <span className="text-xs">{isOpen ? "▴" : "▾"}</span>
            </button>
          ) : null}
        </div>
        {hasChildren && isOpen ? (
          <div className="pb-2">
            {node.children.map((c) => renderNode(c, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-8rem)] overflow-y-auto pb-6">
      {nodes.map((node) => renderNode(node))}
    </div>
  );
}

export function PublicNav() {
  const location = useLocation();
  const [items, setItems] = useState<MenuNode[] | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    apiGet<MenuResponse>("/api/menu")
      .then((r) => {
        setItems(r.data.items?.length ? r.data.items : null);
      })
      .catch(() => setItems(null));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const linkClass =
    "rounded-md px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white";

  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-brand-navy text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="min-w-0 shrink text-lg font-semibold tracking-tight">
          SBM Tour <span className="text-brand-accent">India</span>
        </Link>

        <nav className="hidden flex-wrap items-center gap-1 md:flex">
          {items && items.length > 0
            ? items.map((node) =>
                node.children.length > 0 ? (
                  <div
                    key={node.id}
                    className="group relative flex items-center gap-0.5"
                  >
                    <MenuLink node={node} className={linkClass} />
                    <span className="pb-2 pt-2 text-xs text-slate-400">▾</span>
                    <DropdownPanel children={node.children} />
                  </div>
                ) : (
                  <MenuLink key={node.id} node={node} className={linkClass} />
                )
              )
            : FALLBACK.map((item) => (
                <Link key={item.to} to={item.to} className={linkClass}>
                  {item.label}
                </Link>
              ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-md p-2 text-slate-200 hover:bg-white/10 md:hidden"
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-nav"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
          <Link
            to="/admin"
            className="rounded-md bg-brand-accent px-3 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-accent-hover sm:px-4"
          >
            Admin
          </Link>
        </div>
      </div>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            aria-label="Close menu"
            onClick={closeMobile}
          />
          <div
            id="public-mobile-nav"
            className="fixed inset-y-0 right-0 z-50 w-[min(100vw,20rem)] border-l border-slate-600 bg-brand-navy shadow-2xl md:hidden"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold text-white">Menu</span>
              <button
                type="button"
                className="rounded p-2 text-slate-300 hover:bg-white/10"
                aria-label="Close menu"
                onClick={closeMobile}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <nav className="px-2 pt-2">
              {items && items.length > 0 ? (
                <MobileNavTree nodes={items} onPick={closeMobile} />
              ) : (
                <div className="flex flex-col gap-0.5 pb-6">
                  {FALLBACK.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="rounded-md px-3 py-2.5 text-sm font-medium text-slate-100 hover:bg-white/10"
                      onClick={closeMobile}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}
