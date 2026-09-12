/* Newsletter layouts.

   A theme decides the colours; a layout decides the shape — how large the
   headline runs, how much air sits between sections, whether images go
   edge to edge, whether sections are ruled or boxed. The two are chosen
   separately, so any palette works in any shape.

   The id becomes a class on the document, the reading page and the email,
   which is where the CSS for each lives. */

export type Layout = {
  id: string;
  name: string;
  hint: string;
  /** Headline size in the email, where stylesheets do not apply. */
  emailTitle: number;
  /** Whether the email centres its masthead and headline. */
  emailCentred: boolean;
};

export const layouts: Layout[] = [
  {
    id: "classic",
    name: "Classic column",
    hint: "One calm column with generous margins.",
    emailTitle: 33,
    emailCentred: false,
  },
  {
    id: "magazine",
    name: "Magazine",
    hint: "A large masthead, a drop cap and wide images.",
    emailTitle: 40,
    emailCentred: true,
  },
  {
    id: "digest",
    name: "Digest",
    hint: "Compact and tightly ruled, for round-ups.",
    emailTitle: 26,
    emailCentred: false,
  },
  {
    id: "bulletin",
    name: "Bulletin",
    hint: "Each section sits in its own card.",
    emailTitle: 30,
    emailCentred: true,
  },
];

export const layoutById = (id?: string) =>
  layouts.find((l) => l.id === id) ?? layouts[0];

/** The class the document, reader and email wrapper carry. */
export const layoutClass = (id?: string) => "layout-" + layoutById(id).id;
