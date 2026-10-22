const BLOCKED_TAGS = "script, style, iframe, object, embed, form, input, button, link, meta, base, svg, math";

function isSafeUrl(value: string): boolean {
  const url = value.trim();
  if (!url) return false;
  if (/^(?:https?:|mailto:|tel:|data:image\/|\/|\.\/|\.\.\/|#)/i.test(url)) return true;
  return !/^[a-z][a-z0-9+.-]*:/i.test(url);
}

export default function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll(BLOCKED_TAGS).forEach((el) => el.remove());
  doc.querySelectorAll("*").forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith("on") || name === "srcdoc" || name === "formaction") {
        el.removeAttribute(attr.name);
        continue;
      }
      if ((name === "href" || name === "src" || name === "xlink:href") && !isSafeUrl(attr.value)) {
        el.removeAttribute(attr.name);
        continue;
      }
      if (name === "style" && /expression\s*\(|javascript:/i.test(attr.value)) {
        el.removeAttribute("style");
      }
    }
    if (el.tagName === "A") {
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noreferrer noopener");
    }
    if (el.tagName === "IMG") {
      el.setAttribute("loading", "lazy");
      el.setAttribute("decoding", "async");
    }
  });
  return doc.body.innerHTML;
}
