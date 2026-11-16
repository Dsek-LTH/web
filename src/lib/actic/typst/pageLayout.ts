const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Typst renders all pages into one `<svg>` stacked edge-to-edge, with each
 * page's true size on its `data-page-width`/`data-page-height` attributes.
 * The renderer sets `overflow: visible`, so oversized content (e.g. the
 * cover-page D symbol) paints outside the page bounds. Clip each page to its
 * own rectangle, paint it white, and pull the pages apart by a small gap so
 * multi-page documents read as separate sheets (the gap shows the preview's
 * background through).
 */
export function layoutPages(svg: SVGElement, pageGap = 16) {
  const pages = [...svg.querySelectorAll<SVGGElement>("g.typst-page")];
  if (pages.length === 0) return;

  // The root viewport must clip anything the per-page clips miss.
  svg.style.overflow = "hidden";

  const defs = document.createElementNS(SVG_NS, "defs");
  const clipIds = pages.map((page, i) => {
    const clip = document.createElementNS(SVG_NS, "clipPath");
    clip.setAttribute("id", `actic-page-clip-${i}`);
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", page.getAttribute("data-page-width") ?? "0");
    rect.setAttribute("height", page.getAttribute("data-page-height") ?? "0");
    clip.append(rect);
    defs.append(clip);
    return `url(#actic-page-clip-${i})`;
  });
  svg.prepend(defs);

  const sizes = pages.map((page) => ({
    width: Number(page.getAttribute("data-page-width") ?? 0),
    height: Number(page.getAttribute("data-page-height") ?? 0),
  }));
  const maxWidth = Math.max(...sizes.map((size) => size.width));

  let y = 0;
  pages.forEach((page, i) => {
    const { width, height } = sizes[i]!;
    // The clip lands on the page rect in the page's own (translated) space.
    page.setAttribute("clip-path", clipIds[i]!);
    page.setAttribute(
      "transform",
      `translate(${(maxWidth - width) / 2}, ${y})`,
    );
    const rect = document.createElementNS(SVG_NS, "rect");
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", String(height));
    rect.setAttribute("fill", "#ffffff");
    rect.setAttribute("pointer-events", "none");
    page.insertBefore(rect, page.firstChild);
    y += height + (i < pages.length - 1 ? pageGap : 0);
  });

  svg.setAttribute("viewBox", `0 0 ${maxWidth} ${y}`);
  svg.setAttribute("width", String(maxWidth));
  svg.setAttribute("height", String(y));
  svg.setAttribute("data-width", String(maxWidth));
  svg.setAttribute("data-height", String(y));
}
