<template>
    <WidgetEditorDrawerList v-model:search="inputText" :items="computedOptions" item-key="value" :active-key="selectedItem?.value ?? null" @update:search="onInputChanged" @item-click="itemClicked">
        <template #leading="{ item }">
            <q-icon v-if="item.icon" :name="item.icon" size="16px" />
        </template>
        <template #label="{ item }">{{ $t(item.label) }}</template>
        <template #trailing="{ item }">
            <q-chip v-if="isSearchActive" dense class="q-ml-auto search-count-chip" :color="(matchCounts[item.value] ?? 0) > 0 ? 'primary' : 'grey-3'" :text-color="(matchCounts[item.value] ?? 0) > 0 ? 'white' : 'grey-6'" size="sm">
                {{ matchCounts[item.value] ?? 0 }}
            </q-chip>
        </template>
    </WidgetEditorDrawerList>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import WidgetEditorDrawerList from '../common/WidgetEditorDrawerList.vue'

export default defineComponent({
    name: 'widget-editor-list',
    components: { WidgetEditorDrawerList },
    props: {
        widgetModel: { type: Object as PropType<IWidget>, required: true },
        options: { type: Array as PropType<{ icon: string; label: string; value: string; disabled?: boolean }[]> },
        propSelectedItem: { type: Object as PropType<string | null> },
        settingsMap: { type: Object as PropType<Record<string, { title: string; type: string }[]> | null>, default: null }
    },
    emits: ['itemClicked', 'search-changed'],
    data() {
        return {
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
            this.selectedItem = item
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
