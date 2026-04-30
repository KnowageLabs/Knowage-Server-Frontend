<template>
    <div class="dashboard-editor-list-card-container">
        <q-input v-model="inputText" :placeholder="$t('common.search')" dense outlined clearable class="q-px-sm q-pt-sm" @update:model-value="onInputChanged">
            <template #prepend>
                <q-icon name="search" size="16px" />
            </template>
        </q-input>
        <Listbox v-model="selectedItem" class="kn-list kn-list-no-border-right dashboard-editor-list" :options="computedOptions" option-disabled="disabled">
            <template #option="slotProps">
                <div class="kn-list-item" :style="descriptor.listStyle.listItem" data-test="list-item" @click="itemClicked(slotProps.option)">
                    <q-icon v-if="slotProps.option.icon" :name="slotProps.option.icon" class="p-mr-2" size="16px" />
                    <div class="kn-list-item-text">
                        <span>
                            {{ $t(slotProps.option.label) }}<template v-if="isSearchActive"> ({{ matchCounts[slotProps.option.value] ?? 0 }})</template>
                        </span>
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
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        options: { type: Array as PropType<{ icon: string; label: string; value: string; disabled?: boolean }[]> },
        propSelectedItem: { type: Object as PropType<string | null> },
        settingsMap: { type: Object as PropType<Record<string, { title: string; type: string }[]> | null>, default: null }
    },
    emits: ['itemClicked', 'search-changed'],
    data() {
        return {
            descriptor,
            selectedItem: null as { icon: string; label: string; value: string } | null,
            inputText: '' as string,
            debounceTimer: null as ReturnType<typeof setTimeout> | null,
            localCommittedSearch: '' as string
        }
    },
    computed: {
        isSearchActive(): boolean {
            return this.localCommittedSearch.length >= 3
        },
        matchCounts(): Record<string, number> {
            if (!this.isSearchActive || !this.settingsMap) return {}
            const lc = this.localCommittedSearch.toLowerCase()
            const result: Record<string, number> = {}
            for (const [category, items] of Object.entries(this.settingsMap)) {
                result[category] = (items as { title: string; type: string }[]).filter((item) => this.$t(item.title).toLowerCase().includes(lc)).length
            }
            return result
        },
        computedOptions(): any[] {
            if (!this.isSearchActive || !this.options) return this.options ?? []
            return (this.options ?? []).map((opt) => ({
                ...opt,
                disabled: opt.disabled || (this.matchCounts[opt.value] ?? 0) === 0
            }))
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
        itemClicked(item: { icon: string; label: string; value: string; disabled?: boolean }) {
            if (item.disabled) return
            this.inputText = ''
            this.localCommittedSearch = ''
            if (this.debounceTimer) clearTimeout(this.debounceTimer)
            this.$emit('search-changed', '')
            this.$emit('itemClicked', item)
        },
        loadSelectedItem() {
            if (!this.propSelectedItem || !this.options) return
            const index = this.options.findIndex((option: { icon: string; label: string; value: string }) => option.value === this.propSelectedItem)
            this.selectedItem = index !== -1 ? this.options[index] : null
        },
        onInputChanged(value: string | number | null) {
            const text = (value ?? '') as string
            if (this.debounceTimer) clearTimeout(this.debounceTimer)
            if (text.length < 3) {
                this.localCommittedSearch = ''
                this.$emit('search-changed', '')
                return
            }
            this.debounceTimer = setTimeout(() => {
                this.localCommittedSearch = text
                this.$emit('search-changed', text)
            }, 300)
        }
    }
})
</script>
