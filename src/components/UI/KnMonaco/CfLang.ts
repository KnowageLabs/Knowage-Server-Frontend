import { languages } from 'monaco-editor'

function getTokens(tokens: string, divider = '|'): string[] {
    return tokens.split(divider)
}

const wordPattern = /(-?\d*\.\d\w*)|([^`~!@#%^&*()\-=+[{\]}\\|;:'",./?\s]+)/g

const brackets: languages.CharacterPair[] = [
    ['{', '}'],
    ['[', ']'],
    ['(', ')']
]

const bracketTokens = [
    {
        open: '[',
        close: ']',
        token: 'delimiter.square'
    },
    {
        open: '(',
        close: ')',
        token: 'delimiter.parenthesis'
    },
    {
        open: '{',
        close: '}',
        token: 'delimiter.curly'
    }
]

const autoClosingPairs = [
    { open: '{', close: '}' },
    { open: '[', close: ']' },
    { open: '(', close: ')' },
    { open: '"', close: '"' },
    { open: "'", close: "'" },
    { open: '`', close: '`' }
]

const surroundingPairs = autoClosingPairs

const id = 'cfLang'
const label = 'CfLang'

export const registerCFLanguageForMonaco = () => {
    languages.register({ id, aliases: [label] })

    languages.setMonarchTokensProvider(id, {
        brackets: bracketTokens,
        tokenPostfix: '.cflang',
        keywords: [],
        typeKeywords: [],
        constants: getTokens('null|Infinity|NaN|undefined|true|false'),
        builtinFunctions: getTokens('AVG|COUNT|max|min'),
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
                [/[{}()\[\]]/, '@brackets'],
                [
                    /[a-zA-Z_$]\w*/,
                    {
                        cases: {
                            '@keywords': 'keyword',
                            '@typeKeywords': 'type',
                            '@constants': 'constant.groovy',
                            '@builtinFunctions': 'constant.other.color',
                            '@default': 'identifier'
                        }
                    }
                ],
                [/[<>](?!@symbols)/, '@brackets'],
                [/@symbols/, { cases: { '@operators': 'operator', '@default': '' } }],

                // numbers
                [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
                [/\d+/, 'number'],

                // delimiter: after number because of .\d floats
                [/[;,.]/, 'delimiter'],

                // strings
                [/"([^"\\]|\\.)*$/, 'string.invalid'], // non-teminated string
                [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],

                // characters
                [/'[^\\']'/, 'string'],
                [/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
                [/'/, 'string.invalid']
            ],

            comment: [
                [/[^\/*]+/, 'comment'],
                [/\/\*/, 'comment', '@push'], // nested comment
                ['\\*/', 'comment', '@pop'],
                [/[\/*]/, 'comment']
            ],

            string: [
                [/[^\\"]+/, 'string'],
                [/@escapes/, 'string.escape'],
                [/\\./, 'string.escape.invalid'],
                [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }]
            ],

            whitespace: [
                [/[ \t\r\n]+/, 'white'],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment']
            ]
        }
    })

    languages.setLanguageConfiguration(id, {
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/']
        },
        brackets,
        autoClosingPairs,
        surroundingPairs,
        wordPattern
    })
}
