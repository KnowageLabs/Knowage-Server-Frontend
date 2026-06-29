<template>
    <div class="row q-col-gutter-sm">
        <div :class="selectedVariable && selectedVariable.pivotedValues ? 'col-6' : 'col-12'">
            <q-select v-model="selectedVariable" outlined dense :options="variables" option-label="name" :label="$t('common.variable')" @update:model-value="onVariableChange" />
        </div>
        <div v-if="selectedVariable && selectedVariable.pivotedValues" class="col-6">
            <q-select v-model="variableKey" outlined dense :options="selectedVariable.pivotedValues ? Object.keys(selectedVariable.pivotedValues) : []" :label="$t('common.key')" @update:model-value="onVariableKeyChange" />
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IVariable } from '@/modules/documentExecution/dashboard/Dashboard'

export default defineComponent({
    name: 'widget-editor-variables',
    components: {},
    props: {
        variables: { type: Array as PropType<IVariable[]>, required: true }
    },
    data() {
        return {
            selectedVariable: null as IVariable | null,
            variableKey: ''
        }
    },
    created() {},
    methods: {
        onVariableChange() {
            this.variableKey = ''
            if (!this.selectedVariable) return
            if (this.selectedVariable.type !== 'dataset' || this.selectedVariable.column) {
                const forInsert = `[kn-variable='${this.selectedVariable.name}']`
                this.$emit('insertChanged', forInsert)
            }
        },
        onVariableKeyChange() {
            if (!this.selectedVariable || !this.variableKey) return
            const forInsert = `[kn-variable='${this.selectedVariable.name}' key='${this.variableKey}']`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
