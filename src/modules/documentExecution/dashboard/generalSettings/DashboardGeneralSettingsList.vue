<template>
    <div class="dashboard-editor-list-card-container" style="box-shadow: none; border-radius: 0; border-right: 1px solid rgba(0, 0, 0, 0.12)">
        <q-input v-model="filterText" :placeholder="$t('common.search')" dense borderless clearable class="settings-search q-px-sm">
            <template #prepend>
                <q-icon name="search" size="16px" />
            </template>
        </q-input>
        <Listbox v-model="selectedItem" class="kn-list kn-list-no-border-right dashboard-editor-list" :options="filteredList">
            <template #option="slotProps">
                <div class="kn-list-item" :style="descriptor.listStyle.listItem" data-test="list-item" @click="selectOption(slotProps.option)">
                    <i :class="slotProps.option.icon" :style="descriptor.listStyle.listIcon" class="p-mr-2" style="font-size: 16px; width: 20px; text-align: center" />
                    <div class="kn-list-item-text">{{ $t(slotProps.option.label) }}</div>
                </div>
            </template>
        </Listbox>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import descriptor from './DashboardGeneralSettingsDescriptor.json'
import mainStore from '@/App.store'
import deepcopy from 'deepcopy'
import { mapState } from 'pinia'
import Listbox from 'primevue/listbox'

export default defineComponent({
    name: 'general-settings-list',
    components: { Listbox },
    props: {
        selected: {
            type: String,
            default: ''
        },
        dashboardModelProp: {
            type: Object as any,
            default() {
                return {}
            }
        }
    },
    emits: ['selectedOption'],
    data() {
        return {
            descriptor,
            filterText: '' as string,
            selectedItem: null as any
        }
    },
    watch: {
        selected() {
            this.syncSelectedItem()
        },
        settingsList() {
            this.syncSelectedItem()
        }
    },
    created() {
        this.syncSelectedItem()
    },
    computed: {
        ...mapState(mainStore, ['isEnterprise', 'configurations']),
        settingsList() {
            let optionsList = deepcopy(descriptor.settingsList)
            if (this.isEnterprise) optionsList.push({ icon: 'fa-solid fa-paint-roller', label: 'common.themes', value: 'Themes' })
            if (this.configurations['KNOWAGE.AI.URL']) optionsList.push({ icon: 'fa-solid fa-robot', label: 'dashboard.generalSettings.aisettings', value: 'aisettings' })
            return optionsList
        },
        filteredList() {
            if (!this.filterText) return this.settingsList
            const lc = this.filterText.toLowerCase()
            return this.settingsList.filter((opt: any) => this.$t(opt.label).toLowerCase().includes(lc))
        }
    },
    methods: {
        selectOption(option: any) {
            this.$emit('selectedOption', option.value)
        },
        syncSelectedItem() {
            this.selectedItem = this.settingsList.find((opt: any) => opt.value === this.selected) ?? null
        }
    }
})
</script>
<style scoped lang="scss">
.settings-search {
    border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}
.kn-list-item {
    width: 100%;
    padding: 0 12px;
}
</style>
