<template>
    <div class="dashboard-editor-list-card-container p-m-3">
        <Listbox v-model="selectedItem" class="kn-list kn-list-no-border-right dashboard-editor-list" :options="options" option-disabled="disabled">
            <template #option="slotProps">
                <div class="kn-list-item" :style="descriptor.listStyle.listItem" data-test="list-item" @click="itemClicked(slotProps.option)">
                    <i v-if="slotProps.option.icon" :class="slotProps.option.icon" class="p-mr-2" :style="descriptor.listStyle.listIcon"></i>
                    <div class="kn-list-item-text">
                        <span>{{ $t(slotProps.option.label) }}</span>
                    </div>
                </div>
            </template>
        </Listbox>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import Listbox from 'primevue/listbox'
import descriptor from './WidgetEditorSettingsTabDescriptor.json'

export default defineComponent({
    name: 'widget-editor-list',
    components: { Listbox },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, options: { type: Array as PropType<{ icon: string; label: string; value: string }[]> }, propSelectedItem: { type: Object as PropType<string | null> } },
    emits: ['itemClicked'],
    data() {
        return {
            descriptor,
            selectedItem: null as { icon: string; label: string; value: string } | null
        }
    },
    watch: {
        propSelectedItem() {
            this.loadSelectedItem()
        }
    },
    created() {
        this.loadSelectedItem()
    },
    methods: {
        itemClicked(item: { icon: string; label: string; value: string }) {
            this.$emit('itemClicked', item)
        },
        loadSelectedItem() {
            if (!this.propSelectedItem || !this.options) return
            const index = this.options.findIndex((option: { icon: string; label: string; value: string }) => option.value === this.propSelectedItem)
            this.selectedItem = index !== -1 ? this.options[index] : null
        }
    }
})
</script>
