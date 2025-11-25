import * as monaco from 'monaco-editor'

const id = 'logLang'
const label = 'logLang'

export const registerLogLanguageForMonaco = () => {
  monaco.languages.register({ id, aliases: [label] })

  monaco.languages.setMonarchTokensProvider(id, {
    tokenizer: {
      root: [
        // ISO-like datetime e.g. 2025-11-24T11:00:00,793+00:00
        [/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:,\d+)?(?:[+\-]\d{2}:\d{2})?/, 'date'],

        // tenant pattern inside brackets, e.g. [DEFAULT_TENANT]
        [/\[[a-zA-Z0-9_]+\]/, 'tenant'],

        // levels and words
        [/\b(ERROR)\b/, 'keywordError'],
        [/\b(DEBUG)\b/, 'keywordDebug'],
        [/\b(WARNING)\b/, 'keywordWarning']
      ],
    },
  });

  monaco.editor.defineTheme(id, {
    base: "vs",
    inherit: false,
    rules: [
      { token: 'date', foreground: '008000' ,fontStyle:"bold"},   // green
      { token: 'tenant', foreground: '0000FF' }, // blue
      { token: 'keywordError', foreground: 'e02319' }, //red
      { token: 'keywordDebug', foreground: 'f0fc0d' }, //red
      { token: 'keywordWarning', foreground: 'fcad0d' }, //red
    ],
    colors: {
      "editor.foreground": "#000000",
    },
  });
}