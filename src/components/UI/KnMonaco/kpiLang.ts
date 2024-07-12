import { languages } from 'monaco-editor'

function getTokens(tokens: string, divider = '|'): string[] {
    return tokens.split(divider)
}

const wordPattern = /(-?\d*\.\d\w*)|([^`~!@#%^&*()\-=+[{\]}\\|;:'",./?\s]+)/g

const brackets: languages.CharacterPair[] = [['(', ')']]

const bracketTokens = [
    {
        open: '(',
        close: ')',
        token: 'delimiter.parenthesis'
    }
]

const autoClosingPairs = [{ open: '(', close: ')' }]

const surroundingPairs = autoClosingPairs

const id = 'kpiLang'
const label = 'kpiLang'

export const registerKpiLanguageForMonaco = () => {
    languages.register({ id, aliases: [label] })

    languages.setMonarchTokensProvider(id, {
        brackets: bracketTokens,
        tokenPostfix: '.kpilang',
        keywords: [],
        typeKeywords: [],
        constants: getTokens('SUM|MIN|MAX|COUNT'),
        operators: ['*', '+', '-', '/', '%'],
        symbols: /[+\-*/%]+/,
        escapes: /\\(?:[abfnrtv\\"'`]|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

        regexpctl: /[(){}[\]$^|\-*+?.]/,
        regexpesc: /\\(?:[bBdDfnrstvwWn0\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,
        tokenizer: {
            root: [
                // whitespace
                { include: '@whitespace' },

                // delimiters and operators
                [/[()]/, '@brackets'],
                [
                    /[a-zA-Z_$]\w*/,
                    {
                        cases: {
                            '@keywords': 'keyword',
                            '@typeKeywords': 'type',
                            '@constants': 'constant.groovy',
                            '@default': 'identifier'
                        }
                    }
                ],
                [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],

                // strings
                [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
                [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

                // characters
                [/'[^\\']'/, 'string'],
                [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                [/'/, 'string.invalid']
            ],

            string: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid']
            ],

            whitespace: [
                [/[ \t\r\n]+/, 'white'],
                [/\/\/.*$/, 'comment']
            ]
        }
    })

    languages.setLanguageConfiguration(id, {
        brackets,
        autoClosingPairs,
        surroundingPairs,
        wordPattern
    })
}
