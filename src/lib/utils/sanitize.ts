import DOMPurify from "isomorphic-dompurify";

/**
 * Iframe sources allowed in user-authored markdown. Only real embed endpoints
 * are accepted; ordinary YouTube/Vimeo pages are not.
 */
const ALLOWED_IFRAME_SOURCES = [
  { host: "youtube.com", path: /^\/embed\// },
  { host: "www.youtube.com", path: /^\/embed\// },
  { host: "youtube-nocookie.com", path: /^\/embed\// },
  { host: "www.youtube-nocookie.com", path: /^\/embed\// },
  { host: "player.vimeo.com", path: /^\/video\// },
  { host: "open.spotify.com", path: /^\/embed\// },
  { host: "w.soundcloud.com", path: /^\/player\// },
  { host: "player.twitch.tv", path: /^\// },
];

const IFRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-presentation allow-popups";

/** Form controls are never allowed in editor-authored content. */
const FORBIDDEN_TAGS = [
  "style",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "option",
  "optgroup",
  "label",
  "fieldset",
  "legend",
  "datalist",
  "output",
];

/**
 * Conservative inline style allowlist. These properties can style text and
 * spacing without enabling fixed overlays or off-site resources.
 */
const ALLOWED_STYLE_PROPERTIES = new Set([
  "background-color",
  "color",
  "font-family",
  "font-size",
  "font-style",
  "font-weight",
  "letter-spacing",
  "line-height",
  "margin",
  "padding",
  "text-align",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-style",
  "text-shadow",
  "text-transform",
  "word-spacing",
]);

const UNSAFE_STYLE_VALUE =
  /(?:url|var|expression)\s*\(|@import|javascript:|behavior|-moz-binding/i;

const SANITIZE_OPTIONS = {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: [
    "target",
    "style",
    "allowfullscreen",
    "frameborder",
    "referrerpolicy",
  ],
  FORBID_TAGS: FORBIDDEN_TAGS,
  FORBID_ATTR: ["srcdoc"],
};

function splitStyleDeclarations(value: string): string[] {
  const declarations: string[] = [];
  let start = 0;
  let quote: '"' | "'" | null = null;
  let depth = 0;

  for (let i = 0; i < value.length; i++) {
    const character = value[i];

    if (quote) {
      if (character === "\\") i++;
      else if (character === quote) quote = null;
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "(") {
      depth++;
    } else if (character === ")" && depth > 0) {
      depth--;
    } else if (character === ";" && depth === 0) {
      declarations.push(value.slice(start, i));
      start = i + 1;
    }
  }

  declarations.push(value.slice(start));
  return declarations;
}

function sanitizeStyle(value: string, node: Element): string | null {
  if (!value || value.length > 1000) return null;

  const document = node.ownerDocument;
  if (!document) return null;

  const scratch = document.createElement("div");
  const safeDeclarations: string[] = [];

  for (const declaration of splitStyleDeclarations(value)) {
    const colon = declaration.indexOf(":");
    if (colon < 0) continue;

    const property = declaration.slice(0, colon).trim().toLowerCase();
    if (
      !/^[a-z-]+$/.test(property) ||
      !ALLOWED_STYLE_PROPERTIES.has(property)
    ) {
      continue;
    }

    const rawValue = declaration
      .slice(colon + 1)
      .trim()
      .replace(/\s*!important$/i, "");

    if (!rawValue || UNSAFE_STYLE_VALUE.test(rawValue)) continue;

    // Parse each safe declaration on its own so one broken/unsafe value
    // cannot make the CSS parser discard the entire style attribute.
    scratch.setAttribute("style", `${property}: ${rawValue}`);
    const propertyValue = scratch.style.getPropertyValue(property).trim();
    scratch.removeAttribute("style");

    if (!propertyValue) continue;

    safeDeclarations.push(`${property}: ${propertyValue}`);
  }

  return safeDeclarations.length > 0 ? safeDeclarations.join("; ") : null;
}

function isAllowedIframeSource(src: string): boolean {
  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return false;
  }

  return (
    url.protocol === "https:" &&
    ALLOWED_IFRAME_SOURCES.some(
      (source) =>
        source.host === url.hostname && source.path.test(url.pathname),
    )
  );
}

// This hook is global by design: it runs for every DOMPurify call, including
// default-option calls, so inline styles are filtered everywhere and every
// class attribute is removed.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.hasAttribute("style")) {
    const style = sanitizeStyle(node.getAttribute("style") ?? "", node);
    if (style) node.setAttribute("style", style);
    else node.removeAttribute("style");
  }

  // Classes are not an allowlisted styling mechanism for user content.
  node.removeAttribute("class");

  if (node.tagName === "A") {
    const target = node.getAttribute("target");

    if (target && target !== "_blank" && target !== "_self") {
      node.removeAttribute("target");
    }

    if (target === "_blank") {
      const rel = new Set(
        (node.getAttribute("rel") ?? "").split(/\s+/).filter(Boolean),
      );
      rel.add("noopener");
      rel.add("noreferrer");
      node.setAttribute("rel", [...rel].join(" "));
    }
  }

  if (node.tagName === "IFRAME") {
    const src = node.getAttribute("src");
    if (!src || !isAllowedIframeSource(src)) {
      node.remove();
      return;
    }

    node.removeAttribute("allow");
    // Always enforce a sandbox; authors can't opt out of it.
    node.setAttribute("sandbox", IFRAME_SANDBOX);
  }
});

type SanitizeOptions = {
  /** Additional tags to remove, on top of the default policy. */
  forbidTags?: string[];
};

/** Sanitizes rendered HTML or markdown source using the shared policy. */
export const sanitizeHtml = (
  html: string,
  { forbidTags = [] }: SanitizeOptions = {},
): string =>
  DOMPurify.sanitize(html, {
    ...SANITIZE_OPTIONS,
    FORBID_TAGS: [...FORBIDDEN_TAGS, ...forbidTags],
  });
