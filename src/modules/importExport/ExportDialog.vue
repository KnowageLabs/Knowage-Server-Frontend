<template>
    <q-dialog :model-value="visibility" persistent @hide="closeDialog">
        <q-card class="exportDialog">
            <q-card-section class="row items-center q-pb-none kn-toolbar">
                <div class="text-h6">{{ $t('common.export') }}</div>
            </q-card-section>
            <q-card-section>
                <q-input v-model="fileName" filled type="text" :label="$t('importExport.filenamePlaceholder')" maxlength="50" />
                <q-checkbox v-for="option in checkboxOptions" :key="option.key" v-model="checkboxValues[option.key]" class="q-mt-sm" :label="$t(option.labelKey)" style="margin-left: -10px" />
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat :label="$t('common.cancel')" @click="closeDialog" />
                <q-btn color="primary" unelevated :label="$t('common.export')" :disable="!fileName" @click="emitExport" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'

export interface CheckboxOption {
    key: string
    labelKey: string
    defaultValue?: boolean
}

export default defineComponent({
    name: 'generic-export-dialog',
    props: {
        visibility: Boolean,
        checkboxOptions: {
            type: Array as PropType<CheckboxOption[]>,
            default: () => []
        }
    },
    emits: ['update:visibility', 'export'],
    data() {
        return { fileName: '', checkboxValues: {} as Record<string, boolean> }
    },
    watch: {
        checkboxOptions: {
            handler() {
                this.initializeCheckboxes()
            },
            immediate: true
        }
    },
    methods: {
        initializeCheckboxes(): void {
            this.checkboxValues = {}
            this.checkboxOptions.forEach((option: CheckboxOption) => {
                this.checkboxValues[option.key] = option.defaultValue ?? true
            })
        },
        closeDialog(): void {
            this.$emit('update:visibility', false)
            this.fileName = ''
        },
        emitExport(): void {
            const values = Object.values(this.checkboxValues)
            this.$emit('export', this.fileName, ...values)
        }
    }
})
</script>

<style lang="scss">
.exportDialog {
    min-width: 320px;
    width: 90vw;
    max-width: 640px;
}
</style>
