import DOMPurify from "isomorphic-dompurify";

/**
 * Iframe hosts allowed in user-authored markdown. Keep this list limited to
 * embed providers we actually want to support.
 */
const ALLOWED_IFRAME_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
  "youtu.be",
  "player.vimeo.com",
  "vimeo.com",
  "open.spotify.com",
  "soundcloud.com",
  "w.soundcloud.com",
  "player.twitch.tv",
  "www.twitch.tv",
]);

const IFRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-presentation allow-popups";

/**
 * Shared sanitizer policy for rendered markdown and markdown source that is
 * persisted. Keep these in sync by always going through `sanitizeHtml`.
 */
const SANITIZE_OPTIONS = {
  ADD_TAGS: ["iframe"],
  ADD_ATTR: [
    "target",
    "allow",
    "allowfullscreen",
    "frameborder",
    "referrerpolicy",
    "sandbox",
  ],
  FORBID_ATTR: ["srcdoc"],
};

// This hook is intentionally global: it applies to every DOMPurify call in the
// process, so stored and rendered markdown share the same link/iframe policy.
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A" && node.getAttribute("target") === "_blank") {
    node.setAttribute("rel", "noopener noreferrer");
  }

  if (node.tagName === "IFRAME") {
    const src = node.getAttribute("src");
    if (!src) {
      node.remove();
      return;
    }

    let url: URL;
    try {
      url = new URL(src);
    } catch {
      node.remove();
      return;
    }

    if (url.protocol !== "https:" || !ALLOWED_IFRAME_HOSTS.has(url.hostname)) {
      node.remove();
      return;
    }

    // Always enforce a sandbox; authors can't opt out of it.
    node.setAttribute("sandbox", IFRAME_SANDBOX);
  }
});

/** Sanitizes markdown-rendered HTML or markdown source using the shared policy. */
export const sanitizeHtml = (html: string): string =>
  DOMPurify.sanitize(html, SANITIZE_OPTIONS);
