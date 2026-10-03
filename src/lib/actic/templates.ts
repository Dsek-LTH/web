/**
 * Default Typst source shown in the editor. In later iterations this is where
 * the actual document templates (motion, proposition, ...) will live.
 */
export const defaultTemplate = `#set page(paper: "a4", margin: 2.5cm)
#set text(size: 11pt)

#align(center)[
  #text(size: 20pt, weight: "bold")[Dokumenttitel]
]

#v(1em)

= Rubrik

Skriv din text här. Rutan till vänster innehåller Typst-källkoden som
kompileras till förhandsvisningen till höger.

#lorem(60)
`;
