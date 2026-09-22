<template>
    <q-list dense style="min-width: 180px">
        <template v-for="(contextMenuOption, index) in options" :key="index">
            <q-item v-if="contextMenuOption.value === 'input'" clickable dense>
                <q-item-section>{{ contextMenuOption.label ? $t(contextMenuOption.label) : '' }}</q-item-section>
                <q-item-section side>
                    <q-icon name="chevron_right" size="16px" />
                </q-item-section>
                <q-menu anchor="top end" self="top start" :offset="[2, 0]">
                    <div class="q-pa-sm" style="width: 140px">
                        <q-input :model-value="inputValue" dense outlined hide-bottom-space autofocus @update:model-value="onInputChanged" />
                    </div>
                </q-menu>
            </q-item>

            <q-item
                v-else
                v-close-popup
                clickable
                dense
                :active="modelValue === contextMenuOption.value"
                active-class="active-toolbar-context-menu-option"
                @click="setSelectedValue(contextMenuOption.value)"
            >
                <q-item-section>{{ contextMenuOption.label ? $t(contextMenuOption.label) : '' }}</q-item-section>
            </q-item>
        </template>
    </q-list>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import descriptor from './WidgetEditorStyleToolbarDescriptor.json'

export default defineComponent({
    name: 'widget-editor-toolbar-context-menu',
    props: {
        initialValue: { type: String, default: '' },
        option: { type: Object as PropType<any>, required: true }
    },
    emits: ['selected', 'inputChanged'],
    data() {
        return {
            descriptor,
            modelValue: '' as string,
            inputValue: '' as string
        }
    },
    computed: {
        options(): any[] {
            switch (this.option.type) {
                case 'font-size':
                    return this.descriptor.fontSizeOptions
                case 'justify-content':
                    return this.descriptor.cellAlignmentOptions
                case 'text-align':
                    return this.descriptor.textAlignmentOptions
                case 'vertical-align':
                    return this.descriptor.verticalAlignmentOptions
                case 'font-family':
                    return this.descriptor.fontFamilyOptions
                default:
                    return []
            }
        }
    },
    watch: {
        initialValue() {
            this.loadInitialValue()
        }
    },
    created() {
        this.loadInitialValue()
    },
    methods: {
        loadInitialValue() {
            this.modelValue = this.initialValue ?? ''
            this.inputValue = this.initialValue ?? ''
        },
        setSelectedValue(value: string) {
            this.modelValue = value
            this.$emit('selected', value)
        },
        onInputChanged(value: string | number | null) {
            this.inputValue = value != null ? String(value) : ''
            this.$emit('inputChanged', this.inputValue)
        }
    }
})
</script>

<style lang="scss" scoped>
.active-toolbar-context-menu-option {
    background-color: rgba(0, 0, 0, 0.08);
}
</style>
