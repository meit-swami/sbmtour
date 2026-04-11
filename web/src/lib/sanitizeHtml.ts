import DOMPurify from "dompurify";

/** Safe HTML from CMS fields (master prompt §7). */
export function sanitizedHtml(html: string): { __html: string } {
  return { __html: DOMPurify.sanitize(html ?? "") };
}

/** Footer/widgets: allow limited tags including iframes for map embeds. */
export function sanitizedFooterHtml(html: string): { __html: string } {
  return {
    __html: DOMPurify.sanitize(html ?? "", {
      ADD_TAGS: ["iframe", "a", "br", "p", "strong", "em", "span", "div", "ul", "ol", "li", "img", "h3", "h4"],
      ADD_ATTR: [
        "src",
        "href",
        "target",
        "rel",
        "class",
        "title",
        "allow",
        "allowfullscreen",
        "frameborder",
        "width",
        "height",
        "alt",
        "loading",
      ],
    }),
  };
}
