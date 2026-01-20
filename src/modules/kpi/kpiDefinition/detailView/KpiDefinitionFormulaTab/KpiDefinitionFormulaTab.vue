<template>
    <form class="p-fluid p-formgrid p-grid p-mt-3">
        <div class="p-field p-col-6">
            <span class="p-float-label p-mb-2">
                <InputText
                    id="name"
                    v-model.trim="v$.selectedKpi.name.$model"
                    class="kn-material-input"
                    type="text"
                    max-length="25"
                    :class="{
                        'p-invalid': v$.selectedKpi.name.$invalid && v$.selectedKpi.name.$dirty
                    }"
                    @blur="v$.selectedKpi.name.$touch()"
                />
                <label for="label" class="kn-material-input-label">{{ $t('common.name') }} * </label>
            </span>
            <KnValidationMessages
                :v-comp="v$.selectedKpi.name"
                :additional-translate-params="{
                    fieldName: $t('common.name')
                }"
            >
            </KnValidationMessages>
        </div>
        <div class="p-field p-col-6">
            <span class="p-float-label p-mb-2">
                <InputText id="name" v-model.trim="selectedKpi.author" class="kn-material-input" type="text" :disabled="true" />
                <label for="name" class="kn-material-input-label"> {{ $t('common.author') }}</label>
            </span>
        </div>
    </form>

    <!-- <knMonaco ref="editor" v-if="!loading && selectedKpi.definition" language="kpiLang" v-model="selectedKpi.definition.formulaDecoded" :options="{}" textToInsert="" style="height: 200px" @change="onKeyUp" @editor-setup="editorSetup" @click="onMouseClick"></knMonaco> -->
    <knMonaco ref="editor" v-if="!loading && selectedKpi.definition" language="kpiLang" v-model="selectedKpi.definition.formulaDecoded" :options="{}" textToInsert="" style="height: 200px" @change="onKeyUp" @editor-setup="editorSetup" @dblclick="onMouseClick"></knMonaco>

    <Dialog class="kn-dialog--toolbar--primary importExportDialog" footer="footer" :visible="functionDialogVisible" :closable="false" modal>
        <template #header>
            <h4>{{ $t('kpi.kpiDefinition.formulaDialogHeader') }} {{ dialogHeaderInfo.functionName }}</h4>
        </template>

        <div class="p-mt-4 p-ml-4">
            <div class="p-field-radiobutton">
                <RadioButton id="SUM" v-model="selectedFunctionalities" name="city" value="SUM" />
                <label for="SUM">SUM</label>
            </div>
            <div class="p-field-radiobutton">
                <RadioButton id="MAX" v-model="selectedFunctionalities" name="city" value="MAX" />
                <label for="MAX">MAX</label>
            </div>
            <div class="p-field-radiobutton">
                <RadioButton id="MIN" v-model="selectedFunctionalities" name="city" value="MIN" />
                <label for="MIN">MIN</label>
            </div>
            <div class="p-field-radiobutton">
                <RadioButton id="COUNT" v-model="selectedFunctionalities" name="city" value="COUNT" />
                <label for="COUNT">COUNT</label>
            </div>
        </div>
        <template #footer>
            <div>
                <Button class="kn-button kn-button--secondary" :label="$t('common.cancel')" data-test="close-button" @click="cancel" />
                <Button class="kn-button" :label="$t('common.apply')" @click="openFunctionPicker" />
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import useValidate from '@vuelidate/core'
import tabViewDescriptor from '../KpiDefinitionDetailDescriptor.json'
import Dialog from 'primevue/dialog'
import RadioButton from 'primevue/radiobutton'
import mainStore from '../../../../../App.store'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

let editor = null as any

export default defineComponent({
    components: { knMonaco, Dialog, RadioButton, KnValidationMessages },
    props: { propKpi: Object as any, measures: { type: Array as any }, aliasToInput: { type: String }, checkFormula: { type: Boolean }, activeTab: { type: Number }, loading: Boolean, reloadKpi: Boolean },
    emits: ['touched', 'errorInFormula', 'updateFormulaToSave', 'onGuideClose'],
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
            previousTabIndex: 0 as any,
            dialogHeaderInfo: {} as any,
            measuresToJSON: [] as any,
            functionsTOJSON: [] as any,
            formula: '',
            formulaDecoded: '',
            formulaSimple: '',
            token: '' as any,
            selectedFunctionalities: 'SUM',
            functionDialogVisible: false,
            cursorPosition: null
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
        activeTab() {
            if (this.previousTabIndex === 0 && this.activeTab != 0) {
                this.checkFormulaForErrors()
            }
            this.previousTabIndex = this.activeTab
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

    methods: {
        cancel() {
            this.functionDialogVisible = false
        },
        editorSetup(monacoInstance) {
            this.monaco = monacoInstance.monaco
            editor = monacoInstance.editor

            // Register autocomplete provider for measures (Ctrl+Space only)
            this.monaco.languages.registerCompletionItemProvider('kpiLang', {
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
        },
        onMouseClick(event) {
            const position = editor.getPosition()
            const word = editor.getModel().getWordAtPosition(position)

            console.log('Clicked word:', word, 'at position:', position)

            // Only trigger if we actually clicked ON a word, not just near it
            if (!word || word.word.length <= 1) return

            // Check if cursor is actually within the word boundaries
            // getWordAtPosition returns word even if cursor is just after/before it
            if (position.column < word.startColumn || position.column > word.endColumn) return

            // Exclude function names themselves from being clicked
            if (['SUM', 'MAX', 'MIN', 'COUNT'].includes(word.word)) return

            // Check if this word is already wrapped in a function
            const lineContent = editor.getModel().getLineContent(position.lineNumber)
            const wordStart = word.startColumn - 1
            const wordEnd = word.endColumn - 1

            // Look backward for a function name followed by '('
            const beforeWord = lineContent.substring(0, wordStart)
            const afterWord = lineContent.substring(wordEnd)

            // Check if pattern is FUNCTION(word)
            const functionPattern = /(SUM|MAX|MIN|COUNT)\($/
            const closingParenPattern = /^\)/

            if (functionPattern.test(beforeWord) && closingParenPattern.test(afterWord)) {
                // Extract the function name
                const match = beforeWord.match(/(SUM|MAX|MIN|COUNT)\($/)
                const functionStartCol = beforeWord.lastIndexOf(match[1]) + 1
                const functionEndCol = wordEnd + 2 // word end + ')'

                this.token = {
                    word: word.word,
                    startLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endLineNumber: position.lineNumber,
                    endColumn: word.endColumn,
                    isWrapped: true,
                    currentFunction: match[1],
                    functionStartLine: position.lineNumber,
                    functionStartColumn: functionStartCol,
                    functionEndLine: position.lineNumber,
                    functionEndColumn: functionEndCol
                }
            } else {
                this.token = {
                    word: word.word,
                    startLineNumber: position.lineNumber,
                    startColumn: word.startColumn,
                    endLineNumber: position.lineNumber,
                    endColumn: word.endColumn,
                    isWrapped: false
                }
            }

            this.dialogHeaderInfo.functionName = word.word
            this.functionDialogVisible = true
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
                this.$emit('errorInFormula', true)
                return {}
            }

            this.reset()

            const model = editor.getModel()
            const formulaText = model.getValue().trim()

            if (!formulaText) {
                this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingmeasure') })
                this.$emit('errorInFormula', true)
                return {}
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
                this.$emit('errorInFormula', true)
                this.reset()
                return {}
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
            let previousToken = null

            for (let i = 0; i < tokens.length; i++) {
                const token = tokens[i]
                const nextToken = tokens[i + 1]

                // First token cannot be an operator or closing bracket
                if (i === 0 && (token.type === 'operator' || (token.type === 'bracket' && token.value === ')'))) {
                    this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.malformed') })
                    this.$emit('errorInFormula', true)
                    this.reset()
                    return {}
                }

                // Last token cannot be an operator or opening bracket
                if (i === tokens.length - 1 && (token.type === 'operator' || (token.type === 'bracket' && token.value === '('))) {
                    this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.malformed') })
                    this.$emit('errorInFormula', true)
                    this.reset()
                    return {}
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
                        this.$emit('errorInFormula', true)
                        this.reset()
                        return {}
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
                        this.$emit('errorInFormula', true)
                        this.reset()
                        return {}
                    }

                    // Check for missing operator between variables/numbers
                    if (previousToken?.type === 'variable' || previousToken?.type === 'number') {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingoperator') })
                        this.$emit('errorInFormula', true)
                        this.reset()
                        return {}
                    }
                } else if (token.type === 'operator') {
                    // Operator cannot follow another operator
                    if (previousToken?.type === 'operator') {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.malformed') })
                        this.$emit('errorInFormula', true)
                        this.reset()
                        return {}
                    }

                    // Operator after opening bracket is invalid
                    if (previousToken?.type === 'bracket' && previousToken?.value === '(') {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.malformed') })
                        this.$emit('errorInFormula', true)
                        this.reset()
                        return {}
                    }

                    this.formula += token.value
                    this.formulaDecoded += token.value
                    this.formulaSimple += token.value
                } else if (token.type === 'number') {
                    // Check for missing operator before number
                    if (previousToken?.type === 'variable' || previousToken?.type === 'number' || (previousToken?.type === 'bracket' && previousToken?.value === ')')) {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingoperator') })
                        this.$emit('errorInFormula', true)
                        this.reset()
                        return {}
                    }

                    this.formula += token.value
                    this.formulaDecoded += token.value
                    this.formulaSimple += token.value
                } else if (token.type === 'bracket') {
                    // Empty brackets
                    if (token.value === ')' && previousToken?.value === '(') {
                        this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.malformed') })
                        this.$emit('errorInFormula', true)
                        this.reset()
                        return {}
                    }

                    // Check for missing operator after closing bracket
                    if (token.value === ')' && nextToken) {
                        if (nextToken.type === 'variable' || nextToken.type === 'number' || nextToken.type === 'function' || (nextToken.type === 'bracket' && nextToken.value === '(')) {
                            this.store.setError({ msg: this.$t('kpi.kpiDefinition.errorformula.missingoperator') })
                            this.$emit('errorInFormula', true)
                            this.reset()
                            return {}
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
                this.$emit('errorInFormula', true)
                this.reset()
                return {}
            }

            // All validations passed
            this.$emit('errorInFormula', false)

            // Update the KPI definition
            this.selectedKpi.definition.formula = this.formula
            this.selectedKpi.definition.measures = this.measuresToJSON
            this.selectedKpi.definition.functions = this.functionsTOJSON
            this.selectedKpi.definition.formulaDecoded = this.formulaDecoded
            this.selectedKpi.definition.formulaSimple = this.formulaSimple.trim()

            this.$emit('updateFormulaToSave', this.formula)

            return this.selectedKpi.definition
        }
    }
})
</script>
