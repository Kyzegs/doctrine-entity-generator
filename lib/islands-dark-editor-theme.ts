/**
 * JetBrains Islands Dark editor colors, mapped to CodeMirror and Prism tokens.
 *
 * Source colors are from JetBrains' Islands Dark UI theme and editor scheme:
 * - platform/platform-resources/src/themes/islands/ManyIslandsDark.theme.json
 * - platform/platform-resources/src/themes/islands/IslandSchemeDark.xml
 */
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { drawSelection, EditorView } from '@codemirror/view';
import { tags } from '@lezer/highlight';

export const islandsDarkColors = {
  editorBackground: '#191A1C',
  editorForeground: '#BCBEC4',
  caret: '#CED0D6',
  activeLine: '#1F2024',
  lineNumber: '#4B5059',
  activeLineNumber: '#A1A3AB',
  selection: '#2A4371',
  comment: '#7A7E85',
  keyword: '#CF8E6D',
  string: '#6AAB73',
  number: '#2AACB8',
  functionDeclaration: '#56A8F5',
  functionCall: '#57AAF7',
  constant: '#C77DBB',
  xmlTag: '#D5B778',
  xmlCustomTag: '#2FBAA3',
  error: '#F75464',
  metadata: '#B3AE60',
  hyperlink: '#548AF7',
  searchMatch: '#114957',
  matchedBrace: '#43454A',
  gutterGuide: '#323438',
} as const;

export const islandsDarkTypography = {
  fontFamily:
    'var(--font-jetbrains-mono), "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  fontSize: '13px',
  lineHeight: 1.2,
} as const;

const islandsDarkCodeMirrorTheme = EditorView.theme(
  {
    '&': {
      color: islandsDarkColors.editorForeground,
      backgroundColor: islandsDarkColors.editorBackground,
    },
    '&.cm-editor': {
      backgroundColor: islandsDarkColors.editorBackground,
    },
    '.cm-scroller': {
      backgroundColor: islandsDarkColors.editorBackground,
      fontFamily: islandsDarkTypography.fontFamily,
      fontSize: islandsDarkTypography.fontSize,
      lineHeight: islandsDarkTypography.lineHeight,
    },
    '.cm-content': {
      caretColor: islandsDarkColors.caret,
      fontFamily: islandsDarkTypography.fontFamily,
      fontSize: islandsDarkTypography.fontSize,
      lineHeight: islandsDarkTypography.lineHeight,
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: islandsDarkColors.caret,
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground': {
      background: `${islandsDarkColors.selection} !important`,
    },
    '&.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground.cm-selectionBackground': {
      background: `${islandsDarkColors.selection} !important`,
    },
    '&.cm-editor .cm-selectionBackground': {
      background: `${islandsDarkColors.selection} !important`,
    },
    '.cm-selectionLayer .cm-selectionBackground': {
      background: `${islandsDarkColors.selection} !important`,
    },
    '.cm-content ::selection': {
      background: `${islandsDarkColors.selection} !important`,
      color: 'inherit',
    },
    '.cm-gutters': {
      backgroundColor: islandsDarkColors.editorBackground,
      color: islandsDarkColors.lineNumber,
      fontFamily: islandsDarkTypography.fontFamily,
      fontSize: islandsDarkTypography.fontSize,
      lineHeight: islandsDarkTypography.lineHeight,
      border: 'none',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      color: islandsDarkColors.lineNumber,
    },
    '.cm-activeLineGutter': {
      backgroundColor: islandsDarkColors.activeLine,
      color: islandsDarkColors.activeLineNumber,
    },
    '.cm-selectionMatch': {
      backgroundColor: islandsDarkColors.searchMatch,
    },
    '.cm-matchingBracket, .cm-nonmatchingBracket': {
      backgroundColor: islandsDarkColors.matchedBrace,
      color: islandsDarkColors.editorForeground,
    },
  },
  { dark: true }
);

const islandsDarkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: islandsDarkColors.keyword },
  {
    tag: [tags.atom, tags.bool, tags.null, tags.number, tags.integer, tags.float],
    color: islandsDarkColors.number,
  },
  {
    tag: [tags.string, tags.special(tags.string), tags.character, tags.regexp],
    color: islandsDarkColors.string,
  },
  {
    tag: [tags.lineComment, tags.blockComment, tags.docComment],
    color: islandsDarkColors.comment,
  },
  {
    tag: [tags.definition(tags.function(tags.variableName)), tags.function(tags.variableName)],
    color: islandsDarkColors.functionDeclaration,
  },
  {
    tag: [tags.definition(tags.name), tags.labelName],
    color: islandsDarkColors.functionCall,
  },
  {
    tag: [tags.constant(tags.name), tags.standard(tags.name), tags.self, tags.typeName],
    color: islandsDarkColors.constant,
  },
  {
    tag: [tags.tagName],
    color: islandsDarkColors.xmlTag,
  },
  {
    tag: [tags.attributeName],
    color: islandsDarkColors.editorForeground,
  },
  {
    tag: [tags.meta, tags.annotation],
    color: islandsDarkColors.metadata,
  },
  {
    tag: [tags.url, tags.link],
    color: islandsDarkColors.hyperlink,
  },
  {
    tag: [tags.punctuation, tags.separator, tags.paren, tags.brace, tags.squareBracket, tags.operator],
    color: islandsDarkColors.editorForeground,
  },
  { tag: tags.variableName, color: islandsDarkColors.editorForeground },
  { tag: tags.name, color: islandsDarkColors.editorForeground },
  { tag: tags.deleted, color: islandsDarkColors.error },
  { tag: tags.invalid, color: islandsDarkColors.error },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strong, fontWeight: 'bold' },
]);

export const islandsDarkCodeMirror = [
  drawSelection(),
  islandsDarkCodeMirrorTheme,
  syntaxHighlighting(islandsDarkHighlightStyle),
];

export const islandsDarkLineNumberStyle = {
  color: islandsDarkColors.lineNumber,
  fontFamily: islandsDarkTypography.fontFamily,
  fontSize: islandsDarkTypography.fontSize,
  lineHeight: islandsDarkTypography.lineHeight,
  minWidth: '2.5em',
  paddingRight: '1em',
  textAlign: 'right' as const,
  userSelect: 'none' as const,
};

export const islandsDarkPrism = {
  'code[class*="language-"]': {
    color: islandsDarkColors.editorForeground,
    background: 'none',
    textShadow: 'none',
    fontFamily: islandsDarkTypography.fontFamily,
    fontSize: islandsDarkTypography.fontSize,
    lineHeight: islandsDarkTypography.lineHeight,
    tabSize: 4,
  },
  'pre[class*="language-"]': {
    color: islandsDarkColors.editorForeground,
    background: islandsDarkColors.editorBackground,
    textShadow: 'none',
    fontFamily: islandsDarkTypography.fontFamily,
    fontSize: islandsDarkTypography.fontSize,
    lineHeight: islandsDarkTypography.lineHeight,
    margin: 0,
    overflow: 'auto',
  },
  ':not(pre) > code[class*="language-"]': {
    background: islandsDarkColors.editorBackground,
  },
  comment: {
    color: islandsDarkColors.comment,
  },
  prolog: {
    color: islandsDarkColors.comment,
  },
  doctype: {
    color: islandsDarkColors.comment,
  },
  cdata: {
    color: islandsDarkColors.comment,
  },
  punctuation: {
    color: islandsDarkColors.editorForeground,
  },
  namespace: {
    color: islandsDarkColors.editorForeground,
    opacity: 1,
  },
  property: {
    color: islandsDarkColors.constant,
  },
  tag: {
    color: islandsDarkColors.xmlTag,
  },
  boolean: {
    color: islandsDarkColors.number,
  },
  number: {
    color: islandsDarkColors.number,
  },
  constant: {
    color: islandsDarkColors.constant,
  },
  symbol: {
    color: islandsDarkColors.constant,
  },
  deleted: {
    color: islandsDarkColors.error,
  },
  selector: {
    color: islandsDarkColors.xmlCustomTag,
  },
  'attr-name': {
    color: islandsDarkColors.editorForeground,
  },
  string: {
    color: islandsDarkColors.string,
  },
  char: {
    color: islandsDarkColors.string,
  },
  builtin: {
    color: islandsDarkColors.keyword,
  },
  inserted: {
    color: islandsDarkColors.string,
  },
  operator: {
    color: islandsDarkColors.editorForeground,
  },
  entity: {
    color: islandsDarkColors.hyperlink,
    cursor: 'help',
  },
  url: {
    color: islandsDarkColors.hyperlink,
  },
  variable: {
    color: islandsDarkColors.editorForeground,
  },
  atrule: {
    color: islandsDarkColors.keyword,
  },
  'attr-value': {
    color: islandsDarkColors.string,
  },
  keyword: {
    color: islandsDarkColors.keyword,
  },
  function: {
    color: islandsDarkColors.functionDeclaration,
  },
  'class-name': {
    color: islandsDarkColors.editorForeground,
  },
  regex: {
    color: islandsDarkColors.number,
  },
  important: {
    color: islandsDarkColors.keyword,
    fontWeight: 'bold',
  },
  bold: {
    fontWeight: 'bold',
  },
  italic: {
    fontStyle: 'italic',
  },
};
