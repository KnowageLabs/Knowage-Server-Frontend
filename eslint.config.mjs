import globals from 'globals'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import js from '@eslint/js'
import { FlatCompat } from '@eslint/eslintrc'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
})

export default [
    {
        ignores: ['**/*.spec.js']
    },
    ...compat.extends('@vue/typescript/recommended', 'eslint:recommended', 'plugin:vue/vue3-recommended'),
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
                process: true,
                defineProps: 'readonly',
                defineEmits: 'readonly',
                withDefaults: 'readonly'
            }
        },

        rules: {
            'no-unused-vars': ['off'],
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    ignoreRestSiblings: true
                }
            ],
            'vue/component-definition-name-casing': ['error', 'kebab-case'],
            '@typescript-eslint/ban-ts-comment': ['off'],
            '@typescript-eslint/no-explicit-any': ['off'],
            '@typescript-eslint/no-empty-function': ['off'],
            '@typescript-eslint/ban-types': [
                'error',
                {
                    types: {
                        Function: false,
                        Object: false
                    },

                    extendDefaults: true
                }
            ],
            'vue/multi-word-component-names': ['off'],
            'vue/no-reserved-component-names': ['off'],
            '@typescript-eslint/no-this-alias': ['warn'],
            'vue/no-useless-template-attributes': ['off']
        }
    }
]
