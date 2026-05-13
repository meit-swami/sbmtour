import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Compass, Menu, User, X } from "lucide-react";
import { apiGet } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { MenuNode, MenuResponse } from "@/types/site";

const FALLBACK: MenuNode[] = [
  { id: 1, title: "Home", href: "/", target: "_self", children: [] },
  {
    id: 2,
    title: "Destinations",
    href: "/destinations",
    target: "_self",
    children: [
      { id: 21, title: "Countries", href: "/countries", target: "_self", children: [] },
      { id: 22, title: "Destinations", href: "/destinations", target: "_self", children: [] },
    ],
  },
  { id: 3, title: "Packages", href: "/packages", target: "_self", children: [] },
  { id: 4, title: "Hotels", href: "/hotels", target: "_self", children: [] },
  { id: 5, title: "Vehicles", href: "/vehicles", target: "_self", children: [] },
  { id: 6, title: "Blog", href: "/blog", target: "_self", children: [] },
  { id: 7, title: "Contact", href: "/contact", target: "_self", children: [] },
];

function isExternal(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://");
}

function NavLinkInner({
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

function MobileTree({
  nodes,
  onPick,
}: {
  nodes: MenuNode[];
  onPick: () => void;
}) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function render(node: MenuNode, depth = 0) {
    const hasChildren = node.children.length > 0;
    const isOpen = open.has(node.id);
    const pad = depth === 0 ? "" : "pl-3 border-l border-border";

    return (
      <div key={node.id} className={cn("border-b border-border last:border-0", pad)}>
        <div className="flex items-center gap-1">
          <NavLinkInner
            node={node}
            className="block flex-1 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            onNavigate={!hasChildren ? onPick : undefined}
          />
          {hasChildren ? (
            <button
              type="button"
              aria-label={isOpen ? "Collapse" : "Expand"}
              aria-expanded={isOpen}
              onClick={() => toggle(node.id)}
              className="rounded p-2 text-muted-foreground hover:bg-secondary"
            >
              <ChevronDown
                className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
              />
            </button>
          ) : null}
        </div>
        {hasChildren && isOpen ? (
          <div className="pb-2">{node.children.map((c) => render(c, depth + 1))}</div>
        ) : null}
      </div>
    );
  }

  return <div className="max-h-[calc(100vh-9rem)] overflow-y-auto pb-6">{nodes.map((n) => render(n))}</div>;
}

export function Navbar({ transparentOnTop = false }: { transparentOnTop?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MenuNode[] | null>(null);
  const location = useLocation();

  useEffect(() => {
    apiGet<MenuResponse>("/api/menu")
      .then((r) => {
        setItems(r.data.items?.length ? r.data.items : null);
      })
      .catch(() => setItems(null));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const solid = !transparentOnTop || scrolled;
  const links = items?.length ? items : FALLBACK;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        solid
          ? "border-b border-border bg-background/85 shadow-soft backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 lg:px-8">
        <Link to="/" className="group flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-ocean shadow-soft">
            <Compass className="h-5 w-5 text-ocean-foreground" />
          </div>
          <span
            className={cn(
              "font-display text-xl font-bold tracking-tight",
              solid ? "text-foreground" : "text-white drop-shadow"
            )}
          >
            SBM Tour <span className="text-cta">India</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) =>
            l.children?.length ? (
              <div key={l.id} className="group relative">
                <button
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    solid
                      ? "text-foreground/80 hover:bg-secondary hover:text-foreground"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  )}
                >
                  {l.title}
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-0 top-full translate-y-1 pt-2 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                  <div className="w-72 rounded-2xl border border-border bg-popover p-2 shadow-card">
                    {l.children.map((c) => (
                      <NavLinkInner
                        key={c.id}
                        node={c}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-popover-foreground hover:bg-secondary"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <NavLinkInner
                key={l.id}
                node={l}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  solid
                    ? "text-foreground/80 hover:bg-secondary hover:text-foreground"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                )}
              />
            )
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/admin"
            className={cn(
              "hidden items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition sm:inline-flex",
              solid
                ? "text-foreground/80 hover:bg-secondary hover:text-foreground"
                : "text-white/90 hover:bg-white/10"
            )}
          >
            <User className="h-4 w-4" /> Admin
          </Link>
          <Link
            to="/packages"
            className="hidden rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-cta-foreground shadow-cta transition hover:bg-cta/90 sm:inline-flex"
          >
            Book Now
          </Link>
          <button
            type="button"
            aria-label="Menu"
            className={cn(
              "rounded-md p-2 lg:hidden",
              solid ? "text-foreground" : "text-white"
            )}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-foreground/40 lg:hidden"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-[min(100vw,22rem)] border-l border-border bg-background shadow-2xl lg:hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-semibold text-foreground">Menu</span>
              <button
                type="button"
                aria-label="Close"
                className="rounded p-2 text-muted-foreground hover:bg-secondary"
                onClick={() => setOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="px-2 pt-2">
              <MobileTree nodes={links} onPick={() => setOpen(false)} />
              <div className="mt-2 flex flex-col gap-2 px-3 pb-6">
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-border px-4 py-2 text-center text-sm font-medium hover:bg-secondary"
                >
                  Admin
                </Link>
                <Link
                  to="/packages"
                  onClick={() => setOpen(false)}
                  className="rounded-lg bg-cta px-4 py-2 text-center text-sm font-semibold text-cta-foreground shadow-cta"
                >
                  Book Now
                </Link>
              </div>
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}
