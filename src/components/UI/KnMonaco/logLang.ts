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
                [/\b(ERROR|SEVERE|FATAL)\b/, 'keywordError'],
                [/\b(DEBUG)\b/, 'keywordDebug'],
                [/\b(WARNING)\b/, 'keywordWarning']
            ]
        }
    })

    monaco.editor.defineTheme(id, {
        base: 'vs-dark',
        inherit: false,
        rules: [
            { token: 'date', foreground: '44d46a', fontStyle: 'bold' },
            { token: 'tenant', foreground: '6e6ee7ff' },
            { token: 'keywordError', foreground: 'e5534cff' },
            { token: 'keywordDebug', foreground: 'f0fc0d' },
            { token: 'keywordWarning', foreground: 'fcad0d' }
        ],
        colors: {
            'editor.foreground': '#D4D4D4',
            'editor.background': '#1E1E1E'
        }
    })
}
