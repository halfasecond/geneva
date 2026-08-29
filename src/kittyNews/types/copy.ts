export interface Copy {
    _id: string;
    author: string;
    contentType: string;
    title: string;
    thumbnail: { src: string, alt: string };
    slug: string;
    content: CopyElement[];
    tags: string[];
    published: boolean;
    publishedDate: string;
    [key: string]: any; // Index signature to allow dynamic keys
  }
  
  export type ImageElement = { img: { src: string, alt: string } };
  export type ParagraphElement = { p: string };
  export type HeadingElement = { h1: string } | { h2: string } | { h3: string } | { h4: string } | { h5: string } | { h6: string }
  export type BlockquoteElement = { blockquote: string };
  export type CodeElement = { code: string };
  export type ListElement = { ul: string[] };
  export type TagsElement = { tags: string[] };
  export type SectionElement = { section: object };
  export type VideoElement = { video: { src: string, poster: string } };
  export type GridElement = { grid: { img: { src: string, alt: string }, h3: string }[] };
  export type ComponentElement = { component: string };
  
  // Union type for different content elements
  export type CopyElement =
    | ImageElement
    | ParagraphElement
    | HeadingElement
    | CodeElement
    | ListElement
    | TagsElement
    | SectionElement
    | CodeElement
    | BlockquoteElement
    | VideoElement
    | GridElement
    | ComponentElement;