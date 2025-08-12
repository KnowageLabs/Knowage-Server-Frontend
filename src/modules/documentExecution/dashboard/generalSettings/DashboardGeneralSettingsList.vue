<template>
    <div class="dashboard-editor-list-card-container p-m-3">
        <div class="dashboard-editor-list-card">
            <Listbox class="kn-list kn-list-no-border-right dashboard-editor-list" :options="settingsList" :filter="true" :filter-placeholder="$t('common.search')" filter-match-mode="contains" :filter-fields="descriptor.settingsListFilterFields" :empty-filter-message="$t('common.info.noDataFound')" @change="selectOption">
                <template #empty>{{ $t('common.info.noDataFound') }}</template>
                <template #option="slotProps">
                    <div class="kn-list-item" :style="descriptor.listStyle.listItem" :class="{ 'kn-list-item-selected': selected === slotProps.option.value }">
                        <i v-if="slotProps.option.icon" class="p-mx-2" :style="descriptor.listStyle.listIcon" :class="slotProps.option.icon"></i>
                        <div class="kn-list-item-text">
                            <span>{{ $t(slotProps.option.label) }}</span>
                        </div>
                    </div>
                </template>
            </Listbox>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Listbox from 'primevue/listbox'
import descriptor from './DashboardGeneralSettingsDescriptor.json'
import mainStore from '@/App.store'
import deepcopy from 'deepcopy'
import { mapState } from 'pinia'

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
            descriptor
        }
    },
    computed: {
        ...mapState(mainStore, ['isEnterprise', 'configurations']),
        settingsList() {
            let optionsList = deepcopy(descriptor.settingsList)
            if (this.isEnterprise) optionsList.push({ icon: 'fa-solid fa-paint-roller', label: 'common.themes', value: 'Themes' })
            if (this.configurations['KNOWAGE.AI.URL']) optionsList.push({ icon: 'fa-solid fa-robot', label: 'dashboard.generalSettings.aisettings', value: 'aisettings' })
            return optionsList
        },
        dashboardHeaderEnabled() {
            return this.dashboardModelProp.configuration.menuWidgets.enableCustomHeader
        }
    },
    methods: {
        selectOption(event: any) {
            if (event.value) this.$emit('selectedOption', event.value.value)
        }
    }
})
</script>
<style scoped lang="scss">
.kn-list-item-selected {
    background-color: var(--kn-button-primary-background-color);
    color: var(--kn-button-primary-color);
}
</style>
