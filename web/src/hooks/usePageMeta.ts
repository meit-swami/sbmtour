import { useEffect } from "react";

/** Lightweight document title + meta description (no extra dependencies). */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    let el = document.querySelector('meta[name="description"]');
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute("name", "description");
      document.head.appendChild(el);
    }
    if (description) el.setAttribute("content", description);
  }, [title, description]);
}
