<template>
    <div class="p-grid p-m-0 kn-theme-management">
        <div class="kn-list--column kn-page p-col-2 p-sm-2 p-md-3 p-p-0">
            <Toolbar class="kn-toolbar kn-toolbar--primary">
                <template #start> Dashboard {{ $t('managers.themeManagement.title') }} </template>
                <template #end>
                    <FabButton icon="fas fa-plus" @click="toggleAddThemeMenu" />
                    <Menu ref="menu" :model="addMenuItems" :popup="true" style="width: 240px"></Menu>
                </template>
            </Toolbar>
            <!-- <KnInputFile label="" :change-function="uploadTheme" accept="application/json,application/zip" :trigger-input="triggerInput" /> -->
            <KnInputFile label="" accept="application/json,application/zip" :trigger-input="triggerInput" />
            <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
            <!-- <KnListBox :options="availableThemes" :selected="selectedTheme" :settings="descriptor.knListSettings" @click="selectTheme" @delete.stop="deleteThemeConfirm" /> -->
            <KnListBox :options="availableThemes" :selected="selectedTheme" :settings="descriptor.knListSettings" @click="selectTheme" />
        </div>

        <div class="p-col p-p-0 p-m-0 kn-page form-container">
            <KnHint v-if="!selectedTheme.themeName" :title="$t('managers.themeManagement.title')" :hint="$t('managers.themeManagement.hint')"></KnHint>
            <Toolbar v-if="selectedTheme.themeName" class="kn-toolbar kn-toolbar--secondary">
                <template #start> {{ selectedTheme.themeName }} </template>
                <template #end>
                    <Button icon="pi pi-download" class="p-button-text p-button-rounded p-button-plain" :title="$t('managers.themeManagement.download')" />
                </template>
            </Toolbar>
            <DashboardThemeManagementEditor v-if="selectedTheme.themeName" :selected-theme-prop="selectedTheme" />
        </div>

        <div v-if="selectedTheme.themeName" class="theme-manager-examples kn-page p-p-0 kn-overflow dashboard-scrollbar">
            <ThemeExamples :selected-theme-prop="selectedTheme" />
        </div>
    </div>
</template>

<script lang="ts">
// import { AxiosResponse } from 'axios'
import { defineComponent } from 'vue'
import FabButton from '@/components/UI/KnFabButton.vue'
import ThemeManagementDescriptor from '@/modules/managers/dashboardThemeManagement/DashboardThemeManagementDescriptor.json'
import themeHelper from '@/helpers/themeHelper/themeHelper'
import KnInputFile from '@/components/UI/KnInputFile.vue'
// import { downloadDirect } from '@/helpers/commons/fileHelper'
import Menu from 'primevue/menu'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import { mapActions, mapState } from 'pinia'
import mainStore from '../../../App.store'
import KnHint from '@/components/UI/KnHint.vue'
import DashboardThemeManagementEditor from './DashboardThemeManagementEditor.vue'
import { IDashboardTheme } from './DashboardThememanagement'
import deepcopy from 'deepcopy'
import { getDefaultDashboardThemeConfig } from './DashboardThemeHelper'
import { IDashboardThemeConfig } from './DashboardThememanagement'
import ThemeExamples from './dashboardThemeManagementExamples/DashboardThemeManagementExamples.vue'

export default defineComponent({
    name: 'dashboard-theme-management',
    components: { FabButton, Menu, KnInputFile, KnListBox, KnHint, DashboardThemeManagementEditor, ThemeExamples },
    data() {
        return {
            descriptor: ThemeManagementDescriptor,
            selectedTheme: { config: {} } as IDashboardTheme,
            availableThemes: [] as any[],
            triggerInput: false,
            loading: false,
            themeHelper: new themeHelper(),
            addMenuItems: [
                { label: this.$t('managers.themeManagement.new'), icon: 'fas fa-plus', command: () => this.addTheme() },
                {
                    label: this.$t('managers.themeManagement.import'),
                    icon: 'fas fa-file-import',
                    command: () => {
                        this.triggerInputFile(true)
                    }
                }
            ]
        }
    },
    computed: {
        ...mapState(mainStore, ['defaultTheme'])
    },
    mounted() {
        this.loading = true
        // this.getAllThemes()
        this.loading = false
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setTheme']),
        triggerInputFile(value) {
            this.triggerInput = value
        },
        addTheme() {
            this.selectedTheme = deepcopy(this.descriptor.emptyTheme) as IDashboardTheme
            this.selectedTheme.config = getDefaultDashboardThemeConfig() as IDashboardThemeConfig

            console.log(this.selectedTheme)
        },
        toggleAddThemeMenu(event) {
            // eslint-disable-next-line
            // @ts-ignore
            this.$refs.menu.toggle(event)
            this.triggerInputFile(false)
        },
        selectTheme(event) {
            console.log('selectTheme.item', event.item)
        }
    }
})
</script>

<style lang="scss">
.kn-theme-management {
    .p-fieldset-content {
        padding: 0;
    }
    .p-float-label {
        display: flex;
        .kn-material-input {
            flex: 1;
        }
    }
    .form-container {
        border-right: 1px solid #cccccc;
    }
    @media screen and (max-width: 1100px) {
        .theme-manager-examples {
            -webkit-transition: width 0.3s;
            transition: flex 0.3s;
            flex: 0;
        }
    }
    @media screen and (min-width: 1101px) {
        .theme-manager-examples {
            -webkit-transition: width 0.3s;
            transition: flex 0.3s;
            flex: 0.9;
        }
    }
}
</style>
