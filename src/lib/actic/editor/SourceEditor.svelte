<script lang="ts">
  // CodeMirror 6 raw Typst editor shared by the write (advanced) and diff
  // pages. Two-way `value` binding keeps the live preview flowing; compiler
  // diagnostics arrive as squiggles via the `diagnostics` prop.
  import { onMount, type Snippet } from "svelte";
  import {
    EditorView,
    drawSelection,
    dropCursor,
    highlightActiveLine,
    highlightActiveLineGutter,
    keymap,
    lineNumbers,
  } from "@codemirror/view";
  import { Annotation, Compartment, EditorState } from "@codemirror/state";
  import {
    defaultKeymap,
    history,
    historyKeymap,
    indentWithTab,
  } from "@codemirror/commands";
  import {
    HighlightStyle,
    bracketMatching,
    indentOnInput,
    syntaxHighlighting,
  } from "@codemirror/language";
  import {
    acceptCompletion,
    closeBrackets,
    closeBracketsKeymap,
    autocompletion,
  } from "@codemirror/autocomplete";
  import {
    closeSearchPanel,
    highlightSelectionMatches,
    openSearchPanel,
    search,
    searchKeymap,
    searchPanelOpen,
  } from "@codemirror/search";
  import {
    forceLinting,
    linter,
    lintKeymap,
    type Diagnostic as LintDiagnostic,
  } from "@codemirror/lint";
  import { tags } from "@lezer/highlight";
  import {
    typst_lezer,
    typstCompletionSource,
  } from "codemirror-lang-typst/lezer";
  import Braces from "@lucide/svelte/icons/braces";
  import Download from "@lucide/svelte/icons/download";
  import Search from "@lucide/svelte/icons/search";
  import TextWrap from "@lucide/svelte/icons/text-wrap";
  import * as DropdownMenu from "$lib/components/ui/dropdown-menu/index.js";
  import type { Component } from "svelte";
  import * as m from "$paraglide/messages";
  import type { TypstDiagnostic } from "./diagnostics";
  import {
    typstKeywordCompletion,
    typstMarkerCompletion,
  } from "./typstCompletions";
  import { hangingIndent } from "./hangingIndent";
  import ToolbarButton from "./ToolbarButton.svelte";
  import EditorToolbar from "./EditorToolbar.svelte";
  import { watchStickyTop } from "./sticky-top";

  let {
    value = $bindable(""),
    diagnostics = [],
    oninput,
    title = "",
    pageActions,
    diffMarkers = false,
    downloadItems = [],
  }: {
    value?: string;
    /** Compiler diagnostics, as parsed offsets into `value`. */
    diagnostics?: TypstDiagnostic[];
    /** Called when the document changes (used for fork/dirty tracking). */
    oninput?: () => void;
    /** Document title, shown in the toolbar. */
    title?: string;
    /** Extra toolbar buttons owned by the page (e.g. diff's reset), shown
     * in the leading group before the editor's own buttons. Gets the editor
     * view so page-level commands can edit the document. */
    pageActions?: Snippet<[EditorView | undefined]>;
    /** Offer the diff package's `#add`/`#remove` marker completions. Only
     * pages whose documents import the diff package should set this. */
    diffMarkers?: boolean;
    /**
     * Download actions for the toolbar. One item renders a direct download
     * button; several render a dropdown to choose between them; none hides
     * the button entirely.
     */
    downloadItems?: Array<{
      label: string;
      icon?: Component<{ class?: string }>;
      disabled?: boolean;
      run: () => void;
    }>;
  } = $props();

  let host: HTMLDivElement | undefined = $state();
  let view: EditorView | undefined = $state();
  let dark = $state(false);
  /** Soft-wrap long lines (on by default; toggle in the toolbar). */
  let wrap = $state(true);
  let searchOpen = $state(false);

  /** The single download action when there's exactly one (direct button). */
  const singleDownload = $derived(
    downloadItems.length === 1 ? downloadItems[0] : undefined,
  );

  // Theme and line wrapping are swapped through these compartments.
  const chromeCompartment = new Compartment();
  const wrapCompartment = new Compartment();

  /** Marks transactions the component itself made (draft loads, reset). */
  const externalSync = Annotation.define<boolean>();

  // Muted, low-contrast palette: light mode follows the official Typst web
  // app's roles toned toward the foreground; dark mode lifts them onto
  // lighter, guild-tinted variants.
  const lightHighlight = HighlightStyle.define([
    { tag: tags.heading, fontWeight: "600" },
    { tag: tags.strong, fontWeight: "600" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    { tag: tags.link, color: "#a15d7d" },
    { tag: tags.keyword, color: "#a15d7d" },
    {
      tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
      color: "#96567a",
    },
    { tag: tags.string, color: "#5f7f55" },
    { tag: tags.number, color: "#4f7d87" },
    { tag: tags.constant(tags.variableName), color: "#7d68a3" },
    {
      tag: [tags.comment, tags.blockComment],
      color: "#a3a1a8",
      fontStyle: "italic",
    },
    { tag: tags.escape, color: "#a86e77" },
  ]);

  const darkHighlight = HighlightStyle.define([
    { tag: tags.heading, fontWeight: "600" },
    { tag: tags.strong, fontWeight: "600" },
    { tag: tags.emphasis, fontStyle: "italic" },
    { tag: tags.strikethrough, textDecoration: "line-through" },
    { tag: tags.link, color: "#c39aab" },
    { tag: tags.keyword, color: "#c39aab" },
    {
      tag: [tags.function(tags.variableName), tags.function(tags.propertyName)],
      color: "#cfa5ba",
    },
    { tag: tags.string, color: "#9ab88f" },
    { tag: tags.number, color: "#8fb5be" },
    { tag: tags.constant(tags.variableName), color: "#a997c7" },
    {
      tag: [tags.comment, tags.blockComment],
      color: "#7c7a82",
      fontStyle: "italic",
    },
    { tag: tags.escape, color: "#c28f98" },
  ]);

  const chrome = EditorView.theme({
    "&": {
      color: "var(--color-foreground)",
      backgroundColor: "transparent",
      height: "auto",
      fontSize: "0.875rem",
    },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": { fontFamily: "var(--font-mono, monospace)" },
    ".cm-content": { paddingBottom: "12px" },
    ".cm-line": { padding: "0 12px" },
    ".cm-activeLine": {
      backgroundColor:
        "color-mix(in oklab, var(--color-foreground) 5%, transparent)",
    },
    ".cm-activeLineGutter": { backgroundColor: "transparent" },
    ".cm-selectionBackground, &.cm-focused .cm-selectionBackground": {
      backgroundColor:
        "color-mix(in oklab, var(--color-rosa-400) 30%, transparent) !important",
    },
    ".cm-cursor, &.cm-focused .cm-dropCursor": {
      borderLeftColor: "var(--color-foreground)",
    },
    ".cm-searchMatch": {
      backgroundColor:
        "color-mix(in oklab, var(--color-rosa-400) 25%, transparent)",
    },
    ".cm-tooltip": {
      backgroundColor: "var(--color-background)",
      border: "1px solid var(--color-border)",
      overflow: "hidden",
    },
    ".cm-tooltip-autocomplete ul li[aria-selected]": {
      backgroundColor: "var(--color-accent)",
      color: "var(--color-accent-foreground)",
    },
    // The search panel sits at the top and stays pinned while scrolling the
    // (otherwise very tall) editor. 4rem clears the site's sticky header.
    ".cm-panels": {
      backgroundColor: "var(--color-background)",
      color: "var(--color-foreground)",
    },
    ".cm-panels.cm-panels-top": {
      position: "sticky",
      // Directly below the pinned toolbar; the offset is measured from the
      // site header at runtime (see --actic-panel-top).
      top: "var(--actic-panel-top, 6.75rem)",
      zIndex: 10,
      borderBottom: "1px solid var(--color-border)",
    },
  });

  // The gutters must be opaque so scrolled long lines pass under them rather
  // than through them — each theme carries its own surface color.
  const lightChrome = EditorView.theme({
    ".cm-gutters": { backgroundColor: "var(--color-background)" },
  });
  const darkChrome = EditorView.theme(
    { ".cm-gutters": { backgroundColor: "#242325" } },
    { dark: true },
  );

  function lintDiagnostics(): LintDiagnostic[] {
    return diagnostics.map((d) => ({
      from: d.from,
      to: d.to,
      message: d.message,
      severity: d.severity,
    }));
  }

  // The formatter keeps existing line breaks (no re-wrapping of prose).
  const FORMAT_CONFIG = {
    tab_spaces: 2,
    max_width: 80,
    blank_lines_upper_bound: 1,
    collapse_markup_spaces: false,
    reorder_import_items: false,
    wrap_mode: "none",
  } as const;

  async function formatDocument() {
    if (!view) return;
    const current = view.state.doc.toString();
    let formatted: string;
    try {
      // Imported lazily so the wasm module never loads on the server.
      const { format } = await import("@typstyle/typstyle-wasm-bundler");
      formatted = format(current, { ...FORMAT_CONFIG });
    } catch {
      // A formatter failure must never eat the user's source.
      return;
    }
    if (formatted === current) return;
    view.dispatch({
      changes: { from: 0, to: current.length, insert: formatted },
    });
  }

  function toggleSearch() {
    if (!view) return;
    if (searchPanelOpen(view.state)) closeSearchPanel(view);
    else openSearchPanel(view);
  }

  onMount(() => {
    if (!host) return;
    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightActiveLine(),
        drawSelection(),
        dropCursor(),
        history(),
        indentOnInput(),
        bracketMatching(),
        closeBrackets(),
        autocompletion({
          // The language's own source plus our keyword completions — and,
          // when the page opts in, the diff markers take precedence over
          // keywords for `#a…`/`#r…` (the first override source wins).
          override: [
            ...(diffMarkers ? [typstMarkerCompletion] : []),
            typstKeywordCompletion,
            typstCompletionSource,
          ],
        }),
        highlightSelectionMatches(),
        search({ top: true }),
        typst_lezer(),
        hangingIndent(),
        chrome,
        wrapCompartment.of([]),
        chromeCompartment.of([lightChrome, syntaxHighlighting(lightHighlight)]),
        linter(lintDiagnostics),
        keymap.of([
          // Tab accepts the open completion, otherwise it indents.
          { key: "Tab", run: acceptCompletion },
          // Format the document (Ctrl/Cmd+Shift+I or +F).
          {
            key: "Mod-Shift-i",
            run: () => {
              void formatDocument();
              return true;
            },
          },
          {
            key: "Mod-Shift-f",
            run: () => {
              void formatDocument();
              return true;
            },
          },
          ...closeBracketsKeymap,
          ...defaultKeymap,
          ...searchKeymap,
          ...historyKeymap,
          ...lintKeymap,
          indentWithTab,
        ]),
        EditorView.updateListener.of((update) => {
          // Programmatic pushes (draft loads, reset) change the doc but must
          // not count as the user editing it.
          if (
            update.docChanged &&
            !update.transactions.some((tr) => tr.annotation(externalSync))
          ) {
            value = update.state.doc.toString();
            oninput?.();
          }
          searchOpen = searchPanelOpen(update.state);
        }),
      ],
    });
    view = new EditorView({ state, parent: host });

    const root = document.documentElement;
    const syncTheme = () => (dark = root.classList.contains("dark"));
    syncTheme();
    const observer = new MutationObserver(syncTheme);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    // Pin the toolbar and search panel flush under the site header; the
    // shared watcher measures it (and knows phones' bottom nav isn't one).
    const unwatchSticky = watchStickyTop();
    return () => {
      observer.disconnect();
      unwatchSticky();
      view?.destroy();
      view = undefined;
    };
  });

  // Push external value changes (draft loads, reset) into the editor.
  $effect(() => {
    const next = value;
    if (view && next !== view.state.doc.toString()) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: next },
        annotations: externalSync.of(true),
      });
    }
  });

  // Swap the chrome/highlight palette on theme flips and apply the wrap
  // toggle. Deliberately separate from the diagnostics effect below:
  // reconfiguring compartments re-highlights the document, which on a large
  // source must not happen on every compile's fresh diagnostics.
  $effect(() => {
    void dark;
    void wrap;
    if (!view) return;
    view.dispatch({
      effects: [
        chromeCompartment.reconfigure([
          dark ? darkChrome : lightChrome,
          syntaxHighlighting(dark ? darkHighlight : lightHighlight),
        ]),
        wrapCompartment.reconfigure(wrap ? EditorView.lineWrapping : []),
      ],
    });
  });

  // Re-lint when fresh compiler diagnostics arrive.
  $effect(() => {
    void diagnostics;
    if (!view) return;
    forceLinting(view);
  });
</script>

<div
  class="border-border bg-background flex min-h-[32rem] w-full flex-col overflow-clip rounded-lg border dark:bg-[#242325]"
>
  <EditorToolbar {title} sticky>
    {#snippet leading()}
      {@render pageActions?.(view)}
    {/snippet}
    {#snippet trailing()}
      <ToolbarButton
        label={m.editor_format()}
        shortcut="Mod-Shift-F"
        onclick={formatDocument}
      >
        <Braces class="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={m.editor_search()}
        shortcut="Mod-F"
        active={searchOpen}
        pressed={searchOpen}
        underline
        onclick={toggleSearch}
      >
        <Search class="size-4" />
      </ToolbarButton>
      <ToolbarButton
        label={m.editor_toggle_wrap()}
        active={wrap}
        pressed={wrap}
        underline
        onclick={() => (wrap = !wrap)}
      >
        <TextWrap class="size-4" />
      </ToolbarButton>
      {#if singleDownload}
        <ToolbarButton
          label={singleDownload.label}
          disabled={singleDownload.disabled}
          onclick={singleDownload.run}
        >
          <Download class="size-4" />
        </ToolbarButton>
      {:else if downloadItems.length > 1}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger>
            {#snippet child({ props })}
              <ToolbarButton {...props} label={m.editor_download()}>
                <Download class="size-4" />
              </ToolbarButton>
            {/snippet}
          </DropdownMenu.Trigger>
          <DropdownMenu.Content align="end">
            {#each downloadItems as item (item.label)}
              <DropdownMenu.Item disabled={item.disabled} onclick={item.run}>
                {#if item.icon}
                  <item.icon class="size-4" />
                {/if}
                {item.label}
              </DropdownMenu.Item>
            {/each}
          </DropdownMenu.Content>
        </DropdownMenu.Root>
      {/if}
    {/snippet}
  </EditorToolbar>
  <div bind:this={host} class="min-h-0 flex-1"></div>
</div>
