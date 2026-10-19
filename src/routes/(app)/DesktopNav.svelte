<script lang="ts">
  import { page } from "$app/state";
  import { tick } from "svelte";
  import type { Route } from "../routes";

  let { routes }: { routes: Route[] } = $props();

  function isRouteActive(route: Route): boolean {
    const pathname = page.url.pathname + page.url.hash;
    const matches = (path: string | null | undefined) =>
      !!path &&
      (pathname === path || (path !== "/" && pathname.startsWith(path + "/")));
    if (matches(route.path) || matches(route.picturePath)) return true;
    return route.children?.some((child) => matches(child.path)) ?? false;
  }

  function panelWidthFor(route: Route): number {
    if (route.pictureUrl) return 480;
    if (route.list) return 200;
    return 472;
  }
  let navEl: HTMLElement | null = $state(null);
  let panelEl: HTMLDivElement | null = $state(null);
  let panelTop = $state(0);
  // On a fresh open (nothing was open before) the panel should only play its tilt/fade entrance
  // -- not also slide in horizontally from wherever it was last positioned. This class drops
  // left/top/width from the transition list for exactly one frame so that jump is instant.
  let suppressPositionTransition = $state(false);
  // Registered via the `registerTrigger` action below rather than a dynamic `bind:ref`, which
  // needs the target key to already exist (as `null`, not `undefined`) before the bind runs --
  // an action attaches directly to the mounted node instead, so it stays correct even if
  // `routes` changes after mount (e.g. admin links appearing after sign-in).
  let triggerEls: Record<string, HTMLButtonElement | null> = $state({});
  function registerTrigger(node: HTMLButtonElement, title: string) {
    triggerEls[title] = node;
    return {
      destroy() {
        if (triggerEls[title] === node) delete triggerEls[title];
      },
    };
  }
  let openValue = $state("");
  let panelLeft = $state(0);
  let openTimer: ReturnType<typeof setTimeout> | undefined;
  let closeTimer: ReturnType<typeof setTimeout> | undefined;

  const openRoute = $derived(routes.find((r) => r.title === openValue) ?? null);

  // The panel stays mounted at all times (see markup) and just fades/pops via `data-open`, so
  // during the close transition we keep showing whatever was last open instead of going blank.
  let lastRoute: Route | null = $state(null);
  $effect(() => {
    if (openRoute) lastRoute = openRoute;
  });
  const displayRoute = $derived(openRoute ?? lastRoute);
  const visibleChildren = $derived(
    displayRoute?.children?.filter((c) => !c.hideOnDesktop) ?? [],
  );

  // Position is computed synchronously at the moment we decide to open/switch -- not reactively
  // in an $effect after render, which would paint one frame at the wrong spot and then visibly
  // animate the correction. The panel is `position: fixed` and positioned via plain `left`/`top`
  // (not `transform`), specifically so it never fights with the CSS-driven tilt/scale transform
  // that plays on open -- an inline `transform` would win over any stylesheet rule and silently
  // kill that animation. `top` is pinned to the header's own bottom edge rather than this
  // trigger row's (shorter) box, so the panel sits below the full bar instead of overlapping it.
  function positionFor(value: string): { left: number; top: number } {
    const route = routes.find((r) => r.title === value);
    const trigger = triggerEls[value];
    const header = navEl?.closest("header");
    if (!route || !trigger || !header)
      return { left: panelLeft, top: panelTop };
    const headerRect = header.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const width = panelWidthFor(route);
    const maxLeft = Math.max(0, window.innerWidth - width - 16);
    return {
      left: Math.max(0, Math.min(triggerRect.left, maxLeft)),
      top: headerRect.bottom + 8,
    };
  }
  async function setOpen(value: string) {
    const pos = positionFor(value);
    const freshOpen = !openValue;
    if (freshOpen) suppressPositionTransition = true;
    panelLeft = pos.left;
    panelTop = pos.top;
    openValue = value;
    if (freshOpen) {
      // Let Svelte actually write the new left/top to the DOM while transitions are suppressed,
      // then force a layout read so the browser commits that as a real (transition-less) frame
      // before we restore the transition -- otherwise both style changes can get coalesced into
      // one frame and animate anyway.
      await tick();
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions -- force a layout read
      panelEl?.offsetHeight;
      suppressPositionTransition = false;
    }
  }
  function close() {
    openValue = "";
  }

  function cancelOpenTimer() {
    clearTimeout(openTimer);
  }
  function cancelClose() {
    clearTimeout(closeTimer);
  }
  function scheduleClose() {
    closeTimer = setTimeout(close, 150);
  }
  function handleEnter(value: string) {
    cancelClose();
    if (openValue) {
      // menu is already "engaged" -- switch immediately, no delay
      cancelOpenTimer();
      setOpen(value);
      return;
    }
    cancelOpenTimer();
    openTimer = setTimeout(() => setOpen(value), 150);
  }
  function handleLeave(value: string) {
    cancelOpenTimer();
    // Guards against leave(old)/enter(new) ordering not being guaranteed when the pointer jumps
    // straight from one trigger to another -- only close if we're still the one actually open.
    if (openValue === value) scheduleClose();
  }
  function handleClick(value: string) {
    if (openValue === value) return; // already open -- no-op, never closes on click
    cancelOpenTimer();
    cancelClose();
    setOpen(value);
  }

  // Keyboard support (disclosure pattern). The panel is rendered after every trigger, so DOM tab
  // order alone would skip from the open trigger straight to the next one -- these handlers route
  // focus trigger -> panel links -> next trigger instead, plus arrow keys within the panel.
  function panelLinks(): HTMLAnchorElement[] {
    return panelEl ? Array.from(panelEl.querySelectorAll("a")) : [];
  }
  async function openAndFocusFirst(value: string) {
    cancelOpenTimer();
    cancelClose();
    if (openValue !== value) await setOpen(value);
    // wait for the panel to drop `inert` and render the new route's links
    await tick();
    panelLinks()[0]?.focus();
  }
  function handleTriggerKeydown(e: KeyboardEvent, value: string) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      openAndFocusFirst(value);
    } else if (
      e.key === "Tab" &&
      !e.shiftKey &&
      openValue === value &&
      panelLinks().length
    ) {
      e.preventDefault();
      panelLinks()[0]?.focus();
    }
  }
  function handlePanelKeydown(e: KeyboardEvent) {
    const links = panelLinks();
    const index = links.indexOf(document.activeElement as HTMLAnchorElement);
    if (index === -1) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const step = e.key === "ArrowDown" ? 1 : -1;
      links[(index + step + links.length) % links.length]?.focus();
    } else if (e.key === "Tab" && e.shiftKey && index === 0) {
      e.preventDefault();
      triggerEls[openValue]?.focus();
    } else if (e.key === "Tab" && !e.shiftKey && index === links.length - 1) {
      const nextTitle =
        routes[routes.findIndex((r) => r.title === openValue) + 1]?.title;
      const next = nextTitle ? triggerEls[nextTitle] : null;
      if (next) {
        e.preventDefault();
        next.focus();
      }
      close();
    }
  }

  // Safety net for the one case position genuinely can't be known up front: the viewport
  // resizing while a panel is already open.
  $effect(() => {
    if (!openValue) return;
    const recompute = () => {
      const pos = positionFor(openValue);
      panelLeft = pos.left;
      panelTop = pos.top;
    };
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  });

  // Close on navigation.
  $effect(() => {
    void page.url.href;
    openValue = "";
  });
</script>

<svelte:window
  onkeydown={(e) => {
    if (!openValue) return;
    if (e.key === "Escape") {
      triggerEls[openValue]?.focus();
      close();
    } else if (panelEl?.contains(e.target as Node)) {
      handlePanelKeydown(e);
    }
  }}
  onfocusout={(e) => {
    // close when keyboard focus leaves the nav entirely (e.g. tabbing past the last trigger)
    if (!openValue || !navEl?.contains(e.target as Node)) return;
    if (!navEl.contains(e.relatedTarget as Node | null)) close();
  }}
  onpointerdown={(e) => {
    if (!openValue) return;
    if (navEl?.contains(e.target as Node)) return;
    close();
  }}
/>

<nav bind:this={navEl} class="desktop-nav md-nav:flex hidden" aria-label="Main">
  {#each routes as route (route.title)}
    <div class="nav-item">
      <button
        type="button"
        use:registerTrigger={route.title}
        class="nav-trigger"
        data-active={isRouteActive(route)}
        data-open={openValue === route.title}
        aria-expanded={openValue === route.title}
        aria-controls="desktop-nav-panel"
        onpointerenter={() => handleEnter(route.title)}
        onpointerleave={() => handleLeave(route.title)}
        onclick={() => handleClick(route.title)}
        onkeydown={(e) => handleTriggerKeydown(e, route.title)}
      >
        {route.title}
        {#if route.children}
          <svg
            class="chev"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.4"
            aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg
          >
        {/if}
      </button>
    </div>
  {/each}

  <!-- `inert` while closed: the panel stays mounted for its fade-out, but its links must not
       stay in the tab order or the accessibility tree once it's no longer visible. -->
  <div
    bind:this={panelEl}
    id="desktop-nav-panel"
    class="nav-panel"
    class:no-position-transition={suppressPositionTransition}
    data-open={!!openRoute}
    inert={!openRoute}
    role="group"
    aria-label={displayRoute?.title}
    style="left: {panelLeft}px; top: {panelTop}px; --panel-width: {displayRoute
      ? panelWidthFor(displayRoute)
      : 0}px;"
    onpointerenter={cancelClose}
    onpointerleave={scheduleClose}
  >
    {#if displayRoute}
      {@const route = displayRoute}
      {#key route.title}
        <div class="panel-inner">
          {#if route.pictureUrl}
            <div class="picture-row">
              <a
                href={route.picturePath}
                class="picture-tile"
                style="--tile-url: url('{route.pictureUrl}')"
              >
                <span class="pt-title">{route.pictureTitle}</span>
                <span class="pt-desc">{route.pictureDescription}</span>
              </a>
              <div class="picture-list">
                {#each visibleChildren as child, i (child.title)}
                  {@render childLink(child, i, false)}
                {/each}
              </div>
            </div>
          {:else if route.list}
            <div class="list-col">
              {#each visibleChildren as child, i (child.title)}
                {@render childLink(child, i, false)}
              {/each}
            </div>
          {:else}
            <div class="grid-col">
              {#each visibleChildren as child, i (child.title)}
                {@render childLink(child, i, true)}
              {/each}
            </div>
          {/if}
        </div>
      {/key}
    {/if}
  </div>
</nav>

<!-- `iconBeside`: grid layout puts the icon in its own column next to title + description;
     the stacked layouts put it inline before the title. -->
{#snippet childLink(child: Route, i: number, iconBeside: boolean)}
  {@const Icon = child.icon}
  <a
    href={child.path}
    class="child-row"
    class:row={iconBeside}
    style="--i: {i}"
  >
    {#if iconBeside}
      {#if Icon}<Icon size={18} class="icon" />{/if}
      <span class="col">
        <span class="t">{child.title}</span>
        {#if child.description}
          <span class="d">{child.description}</span>
        {/if}
      </span>
    {:else}
      <span class="t"
        >{#if Icon}<Icon size={18} class="icon" />{/if}{child.title}</span
      >
      {#if child.description}
        <span class="d">{child.description}</span>
      {/if}
    {/if}
  </a>
{/snippet}

<style>
  .desktop-nav {
    position: relative;
    align-items: center;
    gap: 0.15rem;
  }
  .nav-item {
    position: relative;
  }

  .nav-trigger {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    height: 2.25rem;
    padding: 0 1rem;
    border-radius: 999px;
    color: var(--muted-foreground);
    font-family: var(--font-sans);
    font-size: 1rem;
    font-weight: 500;
    transition:
      color 0.18s ease,
      font-weight 0.18s ease,
      transform 0.28s var(--ease-spring);
  }
  .nav-trigger:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }
  .nav-trigger:hover {
    transform: translateY(-1px);
    color: color-mix(in srgb, var(--foreground) 80%, var(--primary) 20%);
    font-weight: 600;
  }
  .nav-trigger[data-active="true"] {
    color: var(--foreground);
    font-weight: 600;
  }
  .nav-trigger .chev {
    width: 11px;
    height: 11px;
    transition: transform 0.32s var(--ease-spring);
  }
  .nav-trigger[data-open="true"] .chev {
    transform: rotate(185deg) scale(1.05);
  }
  .nav-trigger::after {
    content: "";
    position: absolute;
    left: 1rem;
    right: 1rem;
    bottom: -0.95rem;
    height: 2.5px;
    border-radius: 2px;
    background: var(--primary);
    transform: scaleX(0);
    transition: transform 0.28s var(--ease-spring);
  }
  .nav-trigger[data-active="true"]::after {
    transform: scaleX(1);
  }

  .nav-panel {
    /* fixed, not absolute: positioned in viewport coordinates computed in JS (see positionFor),
       pinned to the header's own bottom edge rather than this row's shorter box. Position is set
       via plain `left`/`top`, never `transform`, so it never collides with the tilt/scale
       transform below -- an inline `transform` would win over these rules outright. */
    --panel-padding: 0.6rem;
    --panel-border: 1px;
    position: fixed;
    width: var(--panel-width);
    opacity: 0;
    transform: perspective(900px) rotateX(-6deg) translateY(-6px) scale(0.98);
    transform-origin: top left;
    background: var(--background);
    border: var(--panel-border) solid var(--border);
    border-radius: var(--radius-md);
    box-shadow: 0 16px 32px -10px rgba(0, 0, 0, 0.18);
    padding: var(--panel-padding);
    overflow: hidden;
    pointer-events: none;
    z-index: 50;
    transition:
      left 0.33s var(--ease-spring),
      top 0.2s ease,
      width 0.33s var(--ease-spring),
      opacity 0.2s ease,
      transform 0.36s var(--ease-spring);
  }
  .nav-panel[data-open="true"] {
    opacity: 1;
    pointer-events: auto;
    transform: perspective(900px) rotateX(0deg) translateY(0) scale(1);
  }
  /* Fresh opens (nothing was open before) should only play the tilt/fade entrance below, not
     also slide in from wherever the panel last sat -- so left/top/width briefly skip the
     transition here while position snaps to the new trigger (see setOpen in the script). */
  .nav-panel.no-position-transition {
    transition:
      opacity 0.2s ease,
      transform 0.36s var(--ease-spring);
  }

  /* The panel's own width is intentionally animated (part of the morph between tabs), but if the
     content inside tracked that live (e.g. via width: 100%), its text would rewrap on every frame
     of the transition. Instead the inner content gets the fixed *target* width up front (panel
     width minus its own padding/border) so wrapping is decided once and stays put; `overflow:
     hidden` on the panel reveals/clips it as the outer box resizes instead. */
  .panel-inner {
    width: calc(
      var(--panel-width) - 2 * (var(--panel-padding) + var(--panel-border))
    );
  }

  .picture-row {
    display: flex;
    gap: 0.6rem;
    align-items: stretch;
  }
  .picture-tile {
    flex: 0 0 190px;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    border-radius: 10px;
    overflow: hidden;
    padding: 0.85rem;
    color: #fff;
    text-decoration: none;
  }
  /* the photo lives on its own layer so it alone can scale on hover -- the darkening gradient
     and the title/description text stay put, otherwise the text would zoom and blur with it.
     Explicit z-index on all three, since generated-content paint order is actually
     [::before, real children, ::after] -- without this the gradient (::after) was painting
     *over* the text instead of under it, which is why it read as dimmed rather than crisp white. */
  .picture-tile::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 0;
    background-image: var(--tile-url);
    background-size: cover;
    background-position: center;
    transition: transform 0.45s var(--ease-spring);
  }
  .picture-tile:hover::before {
    transform: scale(1.08);
  }
  .picture-tile::after {
    content: "";
    position: absolute;
    inset: 0;
    z-index: 1;
    background-image: linear-gradient(
      to top,
      rgba(0, 0, 0, 0.8),
      rgba(0, 0, 0, 0.05) 65%
    );
  }
  .pt-title {
    position: relative;
    z-index: 2;
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 1.05rem;
    line-height: 1.15;
    margin-bottom: 0.15rem;
  }
  .pt-desc {
    position: relative;
    z-index: 2;
    font-size: 0.73rem;
    line-height: 1.3;
  }
  .picture-list {
    flex: 1 1 auto;
    min-width: 220px;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  /* width: 100%, not a hardcoded px value -- .nav-panel is border-box (global reset) and these
     sit inside its padding, so a width matching the panel's own outer size would overflow past
     the padded content edge. Let them fill whatever content width the panel actually has. */
  .list-col {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .grid-col {
    width: 100%;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.1rem 0.6rem;
  }

  @keyframes rowIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .child-row {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    padding: 0.5rem 0.65rem;
    border-radius: 8px;
    color: var(--foreground);
    text-decoration: none;
    animation: rowIn 0.32s var(--ease-spring) both;
    animation-delay: calc(var(--i, 0) * 26ms);
    transition:
      background 0.15s ease,
      transform 0.16s var(--ease-spring);
  }
  .child-row:hover {
    background: var(--secondary-hover);
    transform: translateX(2.5px);
  }
  .child-row.row {
    flex-direction: row;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .child-row .col {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }
  .child-row .t {
    font-size: 0.875rem;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .child-row :global(.icon) {
    /* explicit size here, not left to each icon's own `size` prop: the two custom (non-lucide)
       icons used in routes.ts -- Cap and DsekLogo -- don't accept a `size` prop at all and
       render at width/height: 100% of whatever contains them, so without this they blow up to
       fill the row. */
    width: 18px;
    height: 18px;
    color: var(--color-rosa-400);
    flex-shrink: 0;
    transition: transform 0.2s var(--ease-spring);
  }
  .child-row:hover :global(.icon) {
    transform: scale(1.15);
  }
  .child-row.row :global(.icon) {
    margin-top: 0.15rem;
  }
  .child-row .d {
    font-size: 0.75rem;
    color: var(--muted-foreground);
  }

  @media (prefers-reduced-motion: reduce) {
    .nav-trigger,
    .nav-trigger .chev,
    .nav-trigger::after,
    .nav-panel,
    .child-row,
    .child-row :global(.icon),
    .picture-tile::before {
      transition: none !important;
      animation: none !important;
    }
  }
</style>
