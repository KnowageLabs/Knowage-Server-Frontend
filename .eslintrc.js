module.exports = {
    env: { node: true, es2021: true, jest: true },
    globals: { process: true, defineProps: 'readonly', defineEmits: 'readonly', withDefaults: 'readonly' },
    ignorePatterns: ['**/*.spec.js'],
    extends: ['@vue/typescript/recommended', 'eslint:recommended', 'plugin:vue/vue3-recommended', 'prettier'],
    rules: {
        'no-unused-vars': ['off'],
        '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
        'vue/component-definition-name-casing': ['error', 'kebab-case'],
        '@typescript-eslint/ban-ts-comment': ['off'],
        '@typescript-eslint/no-explicit-any': ['off'],
        '@typescript-eslint/no-empty-function': ['off'],
        '@typescript-eslint/ban-types': ['error', { types: { Function: false, Object: false }, extendDefaults: true }],
        'vue/multi-word-component-names': ['off'],
        'vue/no-reserved-component-names': ['off'],
        '@typescript-eslint/no-this-alias': ['warn'],
        'vue/no-useless-template-attributes': ['off']
    }
}
