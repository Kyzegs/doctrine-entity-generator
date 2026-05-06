/**
 * CodeMirror 6 theme matching Prism's Tomorrow Night.
 * Colors from https://github.com/PrismJS/prism/blob/master/src/themes/tomorrow.css
 */
import { EditorView } from '@codemirror/view';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';

// Prism Tomorrow Night palette (exact from theme CSS)
const background = '#2d2d2d';
const highlightBackground = '#363636';
const selection = '#393939';
const foreground = '#ccc'; /* code[class*="language-"], pre */
const comment = '#999'; /* .token.comment, .block-comment */
const punctuation = '#ccc'; /* .token.punctuation */
const coral = '#e2777a'; /* .token.tag, .attr-name, .namespace, .deleted */
const blue = '#6196cc'; /* .token.function-name */
const orange = '#f08d49'; /* .token.boolean, .number, .function */
const yellow = '#f8c555'; /* .token.property, .class-name, .constant, .symbol */
const purple = '#cc99cd'; /* .token.keyword, .builtin, .selector, .atrule */
const green = '#7ec699'; /* .token.string, .char, .attr-value, .regex, .variable */
const cyan = '#67cdcc'; /* .token.operator, .entity, .url */
const cursor = '#ccc';

const tomorrowNightTheme = EditorView.theme(
  {
    '&': {
      color: foreground,
      backgroundColor: background,
    },
    '&.cm-editor': {
      backgroundColor: background,
    },
    '.cm-scroller': {
      backgroundColor: background,
    },
    '.cm-content': {
      backgroundColor: background,
      caretColor: cursor,
    },
    '.cm-line': {
      backgroundColor: background,
    },
    '.cm-cursor, .cm-dropCursor': { borderLeftColor: cursor },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection':
      { backgroundColor: selection },
    '.cm-gutters': {
      backgroundColor: background,
      color: comment,
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: highlightBackground,
    },
    '.cm-activeLine': { backgroundColor: highlightBackground },
  },
  { dark: true }
);

const tomorrowNightHighlightStyle = HighlightStyle.define([
  /* keyword, builtin -> .token.keyword, .builtin */
  { tag: [tags.keyword, tags.standard(tags.name)], color: purple },
  /* property, class-name, constant, symbol -> typeName */
  { tag: [tags.typeName, tags.constant(tags.name)], color: yellow },
  /* boolean, number, function -> number, bool */
  { tag: [tags.number, tags.bool, tags.null], color: orange },
  /* string, char, attr-value, regex, variable -> string, variableName */
  { tag: [tags.string, tags.special(tags.string), tags.regexp], color: green },
  /* function-name -> e.g. definition(name), labelName */
  {
    tag: [tags.definition(tags.name), tags.function(tags.variableName), tags.labelName],
    color: blue,
  },
  /* default identifiers (Prism default #ccc); variable -> green #7ec699 */
  { tag: tags.name, color: foreground },
  { tag: tags.variableName, color: green },
  /* comment */
  { tag: [tags.lineComment, tags.blockComment], color: comment },
  /* operator, entity, url */
  { tag: [tags.operator, tags.url, tags.escape], color: cyan },
  /* punctuation */
  { tag: [tags.punctuation, tags.paren, tags.brace, tags.squareBracket], color: punctuation },
  /* tag, attr-name, deleted -> coral */
  { tag: [tags.tagName, tags.attributeName, tags.deleted], color: coral },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
  { tag: tags.invalid, color: coral },
]);

export const tomorrowNight = [tomorrowNightTheme, syntaxHighlighting(tomorrowNightHighlightStyle)];
