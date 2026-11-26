// @vitest-environment jsdom
import { expect, test } from "vitest";
import { layoutPages } from "./pageLayout";

const SVG = "http://www.w3.org/2000/svg";

/**
 * A miniature of the renderer's output: pages stacked edge-to-edge, each
 * carrying its true size on `data-page-width`/`data-page-height`, with
 * oversized content painted past the page bounds (the cover-page D symbol).
 */
function fixture() {
  const root = document.createElementNS(SVG, "svg");
  root.setAttribute("style", "overflow: visible;");
  root.setAttribute("viewBox", "0 0 596 1438");
  root.setAttribute("width", "596");
  root.setAttribute("height", "1438");
  for (const [width, height] of [
    [596, 842],
    [420, 596],
  ]) {
    const page = document.createElementNS(SVG, "g");
    page.setAttribute("class", "typst-page");
    page.setAttribute("data-page-width", String(width));
    page.setAttribute("data-page-height", String(height));
    const overflow = document.createElementNS(SVG, "rect");
    overflow.setAttribute("width", "2000"); // beyond the page's bounds
    page.append(overflow);
    root.append(page);
  }
  return root;
}

test("pages are clipped to their own true size", () => {
  const svg = fixture();
  layoutPages(svg);
  const pages = [...svg.querySelectorAll("g.typst-page")];
  expect(pages).toHaveLength(2);
  for (const [i, page] of pages.entries()) {
    const clip = svg.querySelector(`clipPath#actic-page-clip-${i} rect`);
    expect(clip?.getAttribute("width")).toBe(
      page.getAttribute("data-page-width"),
    );
    expect(clip?.getAttribute("height")).toBe(
      page.getAttribute("data-page-height"),
    );
    expect(page.getAttribute("clip-path")).toBe(`url(#actic-page-clip-${i})`);
  }
});

test("pages are painted white and pulled apart by the gap", () => {
  const svg = fixture();
  layoutPages(svg);
  const pages = [...svg.querySelectorAll("g.typst-page")];
  // Page 1 at the top-left, page 2 centered below the gap.
  expect(pages[0]!.getAttribute("transform")).toBe("translate(0, 0)");
  expect(pages[1]!.getAttribute("transform")).toBe("translate(88, 858)");
  const background = pages[0]!.querySelector("rect");
  expect(background?.getAttribute("width")).toBe("596");
  expect(background?.getAttribute("height")).toBe("842");
  expect(background?.getAttribute("fill")).toBe("#ffffff");
});

test("the root viewport is sized to the true layout and clips overflow", () => {
  const svg = fixture();
  layoutPages(svg);
  expect(svg.getAttribute("viewBox")).toBe("0 0 596 1454");
  expect(svg.getAttribute("width")).toBe("596");
  expect(svg.getAttribute("height")).toBe("1454");
  expect(svg.style.overflow).toBe("hidden");
});
