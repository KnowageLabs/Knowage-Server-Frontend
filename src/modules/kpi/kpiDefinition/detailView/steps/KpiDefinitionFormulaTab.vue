<template>
    <q-card>
        <q-card-section class="q-pa-md">
            <knMonaco ref="editor" v-if="!loading && selectedKpi.definition" language="kpiLang" v-model="selectedKpi.definition.formulaDecoded" :options="editorOptions" textToInsert="" style="height: 250px" @change="onKeyUp" @editor-setup="editorSetup" @contextmenu="onRightClick"></knMonaco>
        </q-card-section>
    </q-card>

    <q-menu v-model="functionDialogVisible" touch-position context-menu>
        <q-card style="min-width: 200px">
            <q-card-section class="q-pa-sm">
                <div class="text-subtitle2 q-mb-sm">{{ $t('kpi.kpiDefinition.formulaDialogHeader') }} {{ dialogHeaderInfo.functionName }}</div>
            </q-card-section>

            <q-separator />

            <q-list dense>
                <q-item v-for="func in ['SUM', 'MAX', 'MIN', 'COUNT']" :key="func" clickable v-close-popup @click="applyFunction(func)">
                    <q-item-section>
                        <q-item-label>{{ func }}</q-item-label>
                    </q-item-section>
                    <q-item-section side v-if="selectedFunctionalities === func">
                        <q-icon name="check" color="primary" />
                    </q-item-section>
                </q-item>
            </q-list>
        </q-card>
    </q-menu>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import useValidate from '@vuelidate/core'
import tabViewDescriptor from '../KpiDefinitionDetailDescriptor.json'
import mainStore from '../../../../../App.store'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

let editor = null as any
let completionProvider = null as any

export default defineComponent({
    components: { knMonaco, KnValidationMessages },
    props: { propKpi: Object as any, measures: { type: Array as any }, aliasToInput: { type: String }, loading: Boolean, reloadKpi: Boolean },
    emits: ['touched', 'formulaChanged', 'updateFormulaToSave', 'onGuideClose'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            v$: useValidate() as any,
            tabViewDescriptor,
            selectedKpi: {} as any,
            monaco: {} as any,
            dialogHeaderInfo: {} as any,
            measuresToJSON: [] as any,
            functionsTOJSON: [] as any,
            formula: '',
            formulaDecoded: '',
            formulaSimple: '',
            token: '' as any,
            selectedFunctionalities: 'SUM',
            functionDialogVisible: false,
            cursorPosition: null,
            menuPosition: null as any,
            editorOptions: {
                fontSize: 20,
                contextmenu: false
            }
        }
    },
    validations() {
        return {
            selectedKpi: createValidations('selectedKpi', tabViewDescriptor.validations.selectedKpi)
        }
    },
    watch: {
        propKpi() {
            this.selectedKpi = this.propKpi as any
            if (this.selectedKpi.definition != '') {
                this.selectedKpi.definition = JSON.parse(this.selectedKpi.definition)
            }
        },

        aliasToInput() {
            if (this.aliasToInput && editor) {
                const position = editor.getPosition()
                const range = new this.monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column)
                const op = { range: range, text: ' ' + this.aliasToInput, forceMoveMarkers: true }
                editor.executeEdits('insert-alias', [op])
                this.$emit('touched')
            }
        },
        'selectedKpi.definition.formulaDecoded'(newValue) {
            // formula is now the same as formulaDecoded (no more M0, M1 replacement)
            this.selectedKpi.definition.formula = newValue

            // formulaSimple removes function names and parentheses, keeping just measures and operators
            this.selectedKpi.definition.formulaSimple = newValue.replace(/SUM|MIN|COUNT|MAX|\(|\)/gm, '')

            // Extract all function names in order
            this.selectedKpi.definition.functions = newValue.match(/SUM|MIN|COUNT|MAX/gm) || []

            // Extract all measure names (inside function parentheses) in order
            // Updated regex to properly capture measure names including underscores
            this.selectedKpi.definition.measures = Array.from(newValue.matchAll(/(SUM|MIN|COUNT|MAX)\(([a-zA-Z0-9_]+)\)/gm), (m: RegExpMatchArray) => m[2])

            this.$emit('updateFormulaToSave', this.selectedKpi.definition.formula)
        }
    },

    mounted() {
        if (this.propKpi) {
            this.selectedKpi = this.propKpi as any
        }
    },
    beforeUnmount() {
        if (completionProvider) {
            completionProvider.dispose()
            completionProvider = null
        }
    },

    methods: {
        cancel() {
            this.functionDialogVisible = false
        },
        editorSetup(monacoInstance) {
            this.monaco = monacoInstance.monaco
            editor = monacoInstance.editor

            if (completionProvider) completionProvider.dispose()

            completionProvider = this.monaco.languages.registerCompletionItemProvider('kpiLang', {
                provideCompletionItems: (model, position) => {
                    const word = model.getWordUntilPosition(position)
                    const range = {
                        startLineNumber: position.lineNumber,
                        endLineNumber: position.lineNumber,
                        startColumn: word.startColumn,
                        endColumn: word.endColumn
                    }

                    const suggestions = this.measures.map((measure) => ({
                        label: measure.alias,
                        kind: this.monaco.languages.CompletionItemKind.Variable,
                        detail: measure.ruleName || 'Measure',
                        insertText: measure.alias,
                        range: range
                    }))

                    return { suggestions }
                }
            })
        },
        openFunctionPicker() {
            let range, text

            // Check if the measure is already wrapped in a function
            if (this.token.isWrapped) {
                // Replace the entire function call (e.g., SUM(measure) -> COUNT(measure))
                range = new this.monaco.Range(this.token.functionStartLine, this.token.functionStartColumn, this.token.functionEndLine, this.token.functionEndColumn)
                text = `${this.selectedFunctionalities}(${this.token.word})`
            } else {
                // Just wrap the measure
                range = new this.monaco.Range(this.token.startLineNumber, this.token.startColumn, this.token.endLineNumber, this.token.endColumn)
                text = `${this.selectedFunctionalities}(${this.token.word})`
            }

            const op = { range: range, text: text, forceMoveMarkers: true }
            editor.executeEdits('my-source', [op])
            this.functionDialogVisible = false
        },
        onKeyUp(event) {
            this.$emit('touched')
            this.$emit('formulaChanged')
        },
        onRightClick(event) {
            event.preventDefault()

            const position = editor.getPosition()
            const word = editor.getModel().getWordAtPosition(position)

            // Validate: must be a word, cursor within bounds, not a function name
            if (!word || word.word.length <= 1 || position.column < word.startColumn || position.column > word.endColumn || ['SUM', 'MAX', 'MIN', 'COUNT'].includes(word.word)) return

            // Check if word is wrapped in a function: FUNCTION(word)
            const lineContent = editor.getModel().getLineContent(position.lineNumber)
            const beforeWord = lineContent.substring(0, word.startColumn - 1)
            const afterWord = lineContent.substring(word.endColumn - 1)
            const funcMatch = beforeWord.match(/(SUM|MAX|MIN|COUNT)\($/)

            this.token = {
                word: word.word,
                startLineNumber: position.lineNumber,
                startColumn: word.startColumn,
                endLineNumber: position.lineNumber,
                endColumn: word.endColumn,
                isWrapped: !!(funcMatch && afterWord.startsWith(')')),
                ...(funcMatch &&
                    afterWord.startsWith(')') && {
                        currentFunction: funcMatch[1],
                        functionStartLine: position.lineNumber,
                        functionStartColumn: beforeWord.lastIndexOf(funcMatch[1]) + 1,
                        functionEndLine: position.lineNumber,
                        functionEndColumn: word.endColumn + 1
                    })
            }

            this.dialogHeaderInfo.functionName = word.word
            this.selectedFunctionalities = this.token.currentFunction || 'SUM'
            this.functionDialogVisible = true
        },

        applyFunction(funcName: string) {
            this.selectedFunctionalities = funcName
            this.openFunctionPicker()
        },

        reset() {
            this.measuresToJSON = []
            this.functionsTOJSON = []
            this.formula = ''
            this.formulaDecoded = ''
            this.formulaSimple = ''
        },
        measureInList(item, list) {
            for (let i = 0; i < list.length; i++) {
                const object = list[i]
                if (object.alias == item) {
                    return i
                }
            }

            return -1
        },

        checkFormulaForErrors() {
            if (!editor) {
                this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.generic') })
                return null
            }

            this.reset()

            const model = editor.getModel()
            const formulaText = model.getValue().trim()

            if (!formulaText) {
                this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingmeasure') })
                return null
            }

            // Validate bracket matching
            let countOpenBracket = 0
            let countCloseBracket = 0
            for (const char of formulaText) {
                if (char === '(') countOpenBracket++
                if (char === ')') countCloseBracket++
            }

            if (countOpenBracket !== countCloseBracket) {
                this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingbracket') })
                this.reset()
                return null
            }

            // Tokenize the formula
            const tokenPattern = /(SUM|MIN|COUNT|MAX)\s*\(|[+\-*/%]|\(|\)|[a-zA-Z_][a-zA-Z0-9_]*|\d+\.?\d*/g
            const tokens = [] as any[]
            let match

            while ((match = tokenPattern.exec(formulaText)) !== null) {
                const token = match[0].trim()
                if (token) {
                    if (['SUM(', 'MIN(', 'COUNT(', 'MAX('].includes(token.replace(/\s/g, ''))) {
                        const funcName = token.match(/(SUM|MIN|COUNT|MAX)/)?.[1]
                        tokens.push({ type: 'function', value: funcName })
                    } else if (['+', '-', '*', '/', '%'].includes(token)) {
                        tokens.push({ type: 'operator', value: token })
                    } else if (token === '(') {
                        tokens.push({ type: 'bracket', value: '(' })
                    } else if (token === ')') {
                        tokens.push({ type: 'bracket', value: ')' })
                    } else if (/^\d+\.?\d*$/.test(token)) {
                        tokens.push({ type: 'number', value: token })
                    } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(token)) {
                        tokens.push({ type: 'variable', value: token })
                    }
                }
            }

            // Validate token sequence and build formula components
            let numMeasures = 0
            let expectingMeasure = false
            let previousToken = null as any

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i]
                const nextToken = tokens[i + 1]

                // First token cannot be an operator or closing bracket
                if (i === 0 && (token.type === 'operator' || (token.type === 'bracket' && token.value === ')'))) {
                    this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.malformed') })
                    this.reset()
                    return null
                }

                // Last token cannot be an operator or opening bracket
                if (i === tokens.length - 1 && (token.type === 'operator' || (token.type === 'bracket' && token.value === '('))) {
                    this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.malformed') })
                    this.reset()
                    return null
                }

                if (token.type === 'function') {
                    this.functionsTOJSON.push(token.value)
                    this.formulaDecoded += token.value + '('
                    expectingMeasure = true

                    // After function must come opening bracket (already added)
                    if (nextToken?.type !== 'bracket' || nextToken?.value !== '(') {
                        // Already handled by token parsing
                    }
                } else if (token.type === 'variable') {
                    // Check if this variable is a valid measure
                    if (this.measureInList(token.value, this.measures) === -1) {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.generic') })
                        this.reset()
                        return null
                    }

                    if (expectingMeasure) {
                        // This variable is inside a function - it's a measure
                        const measureIndex = numMeasures
                        numMeasures++
                        this.measuresToJSON.push(token.value)
                        this.formulaDecoded += token.value
                        this.formulaSimple += token.value
                        this.formula += 'M' + measureIndex // Backend encoding: M0, M1, M2, etc.
                        expectingMeasure = false
                    } else {
                        // Variable without function
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingfunctions') })
                        this.reset()
                        return null
                    }

                    // Check for missing operator between variables/numbers
                    if (previousToken?.type === 'variable' || previousToken?.type === 'number') {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingoperator') })
                        this.reset()
                        return null
                    }
                } else if (token.type === 'operator') {
                    // Operator cannot follow another operator
                    if (previousToken?.type === 'operator') {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.malformed') })
                        this.reset()
                        return null
                    }

                    // Operator after opening bracket is invalid
                    if (previousToken?.type === 'bracket' && previousToken?.value === '(') {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.malformed') })
                        this.reset()
                        return null
                    }

                    this.formula += token.value
                    this.formulaDecoded += token.value
                    this.formulaSimple += token.value
                } else if (token.type === 'number') {
                    // Check for missing operator before number
                    if (previousToken?.type === 'variable' || previousToken?.type === 'number' || (previousToken?.type === 'bracket' && previousToken?.value === ')')) {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingoperator') })
                        this.reset()
                        return null
                    }

                    this.formula += token.value
                    this.formulaDecoded += token.value
                    this.formulaSimple += token.value
                } else if (token.type === 'bracket') {
                    // Empty brackets
                    if (token.value === ')' && previousToken?.value === '(') {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.malformed') })
                        this.reset()
                        return null
                    }

                    // Check for missing operator after closing bracket
                    if (token.value === ')' && nextToken) {
                        if (nextToken.type === 'variable' || nextToken.type === 'number' || nextToken.type === 'function' || (nextToken.type === 'bracket' && nextToken.value === '(')) {
                            this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingoperator') })
                            this.reset()
                            return null
                        }
                    }

                    // Only add closing brackets after functions to formulaDecoded
                    // Don't add function closing brackets to formula (M0 encoding) or formulaSimple
                    if (token.value === ')' && previousToken?.type === 'variable') {
                        // This is a closing bracket after a measure in a function
                        this.formulaDecoded += token.value
                        // Don't add to formula (just has M0, M1, etc)
                        // Don't add to formulaSimple (just has measure names)
                    } else {
                        // Regular brackets (not part of function syntax)
                        // formulaSimple never has parentheses, only measure names and operators
                        this.formula += token.value
                        this.formulaDecoded += token.value
                    }
                }

                previousToken = token
            }

            // Must have at least one measure
            if (numMeasures === 0) {
                this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingmeasure') })
                this.reset()
                return null
            }

            // All validations passed - Update the KPI definition
            this.selectedKpi.definition.formula = this.formula
            this.selectedKpi.definition.measures = this.measuresToJSON
            this.selectedKpi.definition.functions = this.functionsTOJSON
            this.selectedKpi.definition.formulaDecoded = this.formulaDecoded
            this.selectedKpi.definition.formulaSimple = this.formulaSimple.trim()

            // this.store.setInfo({ msg: this.$t('kpi.kpiDefinition.errorformula.formulaOk') })
            this.$emit('updateFormulaToSave', this.formula)

            return this.selectedKpi.definition
        }
    }
})
</script>
