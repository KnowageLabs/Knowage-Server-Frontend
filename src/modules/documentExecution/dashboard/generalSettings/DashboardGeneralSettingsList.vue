<template>
    <div class="dashboard-editor-list-card-container p-m-3">
        <div class="dashboard-editor-list-card">
            <Listbox
                class="kn-list kn-list-no-border-right dashboard-editor-list"
                :options="settingsList"
                :filter="true"
                :filter-placeholder="$t('common.search')"
                filter-match-mode="contains"
                :filter-fields="descriptor.settingsListFilterFields"
                :empty-filter-message="$t('common.info.noDataFound')"
                @change="selectOption"
            >
                <template #empty>{{ $t('common.info.noDataFound') }}</template>
                <template #option="slotProps">
                    <div class="kn-list-item" :style="descriptor.listStyle.listItem">
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

export default defineComponent({
    name: 'general-settings-list',
    components: { Listbox },
    props: {
        dashboardModelProp: {
            type: Object as any,
            default() {
                return {}
            }
        }
    },
    emits: ['selectedOption'],
    setup() {
        const store = new mainStore()
        return { store }
    },
    data() {
        return {
            descriptor
        }
    },
    computed: {
        settingsList() {
            const headerEnabled = this.dashboardModelProp.configuration.menuWidgets.enableCustomHeader
            const optionsList = headerEnabled ? deepcopy(descriptor.settingsList) : deepcopy(descriptor.settingsList.filter((settings: { icon: string; label: string; value: string }) => settings.value !== 'Custom Header'))

            return this.store.isEnterprise ? optionsList : optionsList.filter((settings: { icon: string; label: string; value: string }) => settings.value !== 'Themes')
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
