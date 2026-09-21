<template>
    <div class="kn-page--row p-grid p-m-0 kn-theme-management">
        <div class="kn-list--column kn-page p-col-12 p-sm-4 p-md-3 p-p-0">
            <Toolbar class="kn-toolbar kn-toolbar--primary">
                <template #start>
                    {{ $t('managers.themeManagement.title') }}
                </template>
                <template #end>
                    <FabButton icon="fas fa-plus" @click="toggleAdd" />
                    <Menu ref="menu" :model="addMenuItems" :popup="true" style="width: 240px" data-test="menu"></Menu>
                </template>
            </Toolbar>
            <KnInputFile label="" :change-function="uploadTheme" accept="application/json,application/zip" :trigger-input="triggerInput" />
            <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />
            <KnListBox :options="availableThemes" :selected="selectedTheme" :settings="descriptor.knListSettings" @click="selectTheme" @delete.stop="deleteThemeConfirm" />
        </div>

        <div class="p-col p-p-0 p-m-0 kn-page">
            <KnHint v-if="!selectedTheme.themeName" :title="$t('managers.themeManagement.title')" :hint="$t('managers.themeManagement.hint')"></KnHint>
            <ThemeManagementExamples v-else :properties="selectedTheme.config"></ThemeManagementExamples>
        </div>

        <div v-if="selectedTheme.themeName" class="kn-list--column kn-page p-col-12 p-sm-4 p-md-3 p-p-0 theme-settings-panel">
            <Toolbar class="kn-toolbar kn-toolbar--secondary">
                <template #start>
                    {{ themeToSend.themeName }}
                </template>
                <template #end>
                    <Button v-if="selectedTheme.id" icon="pi pi-download" class="p-button-text p-button-rounded p-button-plain" @click="downloadTheme" :title="$t('managers.themeManagement.download')" />
                    <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" data-test="save-button" @click="handleSave" :title="$t('managers.themeManagement.save')" />
                </template>
            </Toolbar>
            <div class="theme-settings-header p-p-3">
                <q-input v-model="themeToSend.themeName" class="kn-flex" dense outlined square hide-bottom-space :label="$t('common.name')" />
                <div class="theme-active-switch">
                    <q-toggle v-model="themeToSend.active" dense :label="$t('common.active')" />
                </div>
            </div>
            <Divider class="p-my-0" />
            <div class="theme-settings-search p-px-3 p-pt-3">
                <q-input v-model="settingsSearch" class="kn-width-full" dense outlined square clearable hide-bottom-space type="search" :placeholder="$t('common.search')" @clear="clearSettingsSearch">
                    <template #prepend>
                        <q-icon name="search" />
                    </template>
                </q-input>
            </div>
            <div class="theme-settings-content p-p-3 kn-page-content">
                <template v-for="(value, key) in filteredThemeSettings" :key="key">
                    <section class="theme-settings-section">
                        <button class="theme-settings-section-header" type="button" :aria-expanded="isSettingsSectionExpanded(key)" @click="toggleSettingsSection(key)">
                            <q-icon :name="isSettingsSectionExpanded(key) ? 'remove' : 'add'" size="16px" />
                            <span>{{ value.label }} ({{ value.properties.length }})</span>
                        </button>
                        <div v-if="isSettingsSectionExpanded(key)" class="theme-settings-section-content">
                            <div v-for="property in value.properties" :key="property.key" class="theme-setting-field">
                            <label :for="`theme-setting-${property.key}`" class="theme-setting-label">{{ property.label }}</label>
                            <div v-if="property.type === 'color'" class="theme-setting-control">
                                <q-input :id="`theme-setting-${property.key}`" v-model="selectedTheme.config[property.key]" dense outlined square hide-bottom-space @update:model-value="updateModelToSend(property.key)" />
                                <label class="theme-color-picker" :for="`theme-color-${property.key}`" :style="{ backgroundColor: selectedTheme.config[property.key], color: getColorPickerIconColor(selectedTheme.config[property.key]) }" :title="property.label">
                                    <q-icon name="palette" size="16px" />
                                    <input :id="`theme-color-${property.key}`" v-model="selectedTheme.config[property.key]" class="theme-color-picker-input" type="color" :aria-label="property.label" @change="updateModelToSend(property.key)" />
                                </label>
                            </div>
                            <q-input v-else-if="property.type === 'text'" :id="`theme-setting-${property.key}`" v-model="selectedTheme.config[property.key]" dense outlined square hide-bottom-space @update:model-value="updateModelToSend(property.key)" />
                            <div v-else-if="property.type === 'icon'" class="theme-setting-control">
                                <q-input :id="`theme-setting-${property.key}`" v-model="selectedTheme.config[property.key]" dense outlined square hide-bottom-space @update:model-value="updateModelToSend(property.key)" />
                                <Button :icon="selectedTheme.config[property.key] || 'pi pi-image'" class="p-button-outlined p-button-secondary theme-icon-picker-button" :aria-label="property.label" @click="openIconPicker(property.key)" />
                            </div>
                            </div>
                        </div>
                    </section>
                </template>
                <div v-if="!hasThemeSettings" class="theme-settings-empty">
                    {{ $t('common.info.noDataFound') }}
                </div>
            </div>
        </div>
        <kn-icon-picker v-if="iconPickerVisible" :enable-base64="true" :current-icon="selectedTheme.config[currentIconProp]" @save="onChoosenIcon" @close="closeIconPicker"></kn-icon-picker>
    </div>
</template>

<script lang="ts">
import { AxiosResponse } from 'axios'
import { defineComponent } from 'vue'
import FabButton from '@/components/UI/KnFabButton.vue'
import ThemeManagementDescriptor from '@/modules/managers/themeManagement/ThemeManagementDescriptor.json'
import ThemeManagementExamples from '@/modules/managers/themeManagement/ThemeManagementExamples.vue'
import themeHelper from '@/helpers/themeHelper/themeHelper'
import KnInputFile from '@/components/UI/KnInputFile.vue'
import { downloadDirect } from '@/helpers/commons/fileHelper'
import Divider from 'primevue/divider'
import Menu from 'primevue/menu'
import KnListBox from '@/components/UI/KnListBox/KnListBox.vue'
import KnHint from '@/components/UI/KnHint.vue'
import { mapActions, mapState } from 'pinia'
import mainStore from '../../../App.store'
import KnIconPicker from '@/components/UI/KnIconPicker/KnIconPicker.vue'
import deepcopy from 'deepcopy'
import { QIcon, QInput, QToggle } from 'quasar'

interface IThemeProperty {
    key: string
    label: string
    type: 'color' | 'icon' | 'text'
}

interface IThemeSettingsSection {
    label: string
    properties: IThemeProperty[]
}

interface IThemeHelper {
    descriptor: Record<string, IThemeSettingsSection>
    getDefaultKnowageTheme: () => Record<string, string>
    setTheme: (variables: Record<string, string>) => void
}

export default defineComponent({
    name: 'theme-management',
    components: { Divider, FabButton, Menu, KnHint, KnInputFile, KnListBox, ThemeManagementExamples, KnIconPicker, QIcon, QInput, QToggle },
    data() {
        return {
            descriptor: ThemeManagementDescriptor,
            currentTheme: {} as Record<string, string>,
            selectedTheme: { config: {} } as any,
            themeToSend: { config: {} } as any,
            availableThemes: [] as any[],
            triggerInput: false,
            loading: false,
            themeHelper: new themeHelper() as unknown as IThemeHelper,
            addMenuItems: [] as any[],
            iconPickerVisible: false,
            settingsSearch: '',
            expandedSettings: {} as Record<string, boolean>,
            /**
             * @param currentIconProp Defines which icon property in theme management is being edited, for some reason when dialogs render in v-for, they dont catch the index correctly so this is a roundabout way of fixing that issue.
             */
            currentIconProp: ''
        }
    },
    mounted() {
        this.loading = true
        this.currentTheme = this.themeHelper.getDefaultKnowageTheme()
        this.getAllThemes()
        this.addMenuItems = [
            { label: this.$t('managers.themeManagement.new'), icon: 'fas fa-plus', command: () => this.addTheme() },
            {
                label: this.$t('managers.themeManagement.import'),
                icon: 'fas fa-file-import',
                command: () => {
                    this.triggerInputFile(true)
                }
            }
        ]
    },
    computed: {
        ...mapState(mainStore, ['defaultTheme']),
        filteredThemeSettings(): Record<string, IThemeSettingsSection> {
            const searchTerm = this.settingsSearch.trim().toLocaleLowerCase()

            if (!searchTerm) return this.themeHelper.descriptor

            return Object.entries(this.themeHelper.descriptor).reduce((sections, [key, section]) => {
                const sectionMatches = section.label.toLocaleLowerCase().includes(searchTerm)
                const properties = sectionMatches ? section.properties : section.properties.filter((property) => `${property.label} ${property.key}`.toLocaleLowerCase().includes(searchTerm))

                if (properties.length) sections[key] = { ...section, properties }
                return sections
            }, {} as Record<string, IThemeSettingsSection>)
        },
        hasThemeSettings(): boolean {
            return Object.keys(this.filteredThemeSettings).length > 0
        }
    },
    watch: {
        settingsSearch(value: string) {
            this.expandedSettings = {}
            if (value.trim()) Object.keys(this.filteredThemeSettings).forEach((key) => (this.expandedSettings[key] = true))
        }
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setTheme']),
        triggerInputFile(value) {
            this.triggerInput = value
        },
        addTheme() {
            this.overrideDefaultValues(this.descriptor.emptyTheme)
        },
        toggleAdd(event) {
            // eslint-disable-next-line
            // @ts-ignore
            this.$refs.menu.toggle(event)
            this.triggerInputFile(false)
        },
        deleteThemeConfirm(event: any) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteTheme(event)
            })
        },
        async deleteTheme(event) {
            this.loading = true
            await this.$http.delete(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/thememanagement/${event.item.id}`).then(() => {
                this.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })

                this.themeToSend = { config: {} }
                this.selectedTheme = { config: {} }

                this.getAllThemes()
            })
            this.loading = false
        },
        async getAllThemes(fullRefresh = true) {
            this.loading = true
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/thememanagement`).then((response: AxiosResponse<any>) => {
                this.availableThemes = response.data

                if (fullRefresh) this.overrideDefaultValues(this.availableThemes.filter((item) => item.active === true)[0])

                if (this.availableThemes.filter((item) => item.active === true).length == 0) {
                    this.setActiveTheme({})
                    this.themeToSend = { config: {} }
                    this.selectedTheme = { config: {} }
                }
            })
            this.loading = false
        },

        async handleSave() {
            await this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/thememanagement`, this.themeToSend).then((response) => {
                this.setInfo({ title: this.$t('common.toast.updateTitle'), msg: this.$t('common.toast.updateSuccess') })
                if (!this.themeToSend.id) {
                    this.themeToSend.id = response.data
                    this.selectedTheme.id = response.data
                }
            })
            await this.getAllThemes(false)
            if (this.themeToSend.active) {
                this.setActiveTheme(this.themeToSend)
            }
            this.loading = false
        },
        overrideDefaultValues(newValues) {
            // no default theme
            if (newValues) {
                this.themeToSend = deepcopy(newValues)
                this.selectedTheme.id = newValues.id
                this.selectedTheme.themeName = newValues.themeName
                this.selectedTheme.active = newValues.active
                this.selectedTheme.config = deepcopy({ ...this.currentTheme, ...newValues.config })
            } else {
                this.setTheme({})
                this.themeHelper.setTheme(this.defaultTheme)
            }
        },
        selectTheme(event) {
            this.overrideDefaultValues(event.item)
        },
        setActiveTheme(theme) {
            const newTheme = { ...this.defaultTheme, ...theme.config }
            this.setTheme(newTheme)
            this.themeHelper.setTheme(newTheme)
        },
        updateModelToSend(key) {
            this.themeToSend.config[key] = this.selectedTheme.config[key]
        },
        isSettingsSectionExpanded(key: string): boolean {
            return this.expandedSettings[key] === true
        },
        toggleSettingsSection(key: string) {
            this.expandedSettings[key] = !this.isSettingsSectionExpanded(key)
        },
        clearSettingsSearch() {
            this.settingsSearch = ''
        },
        getColorPickerIconColor(color?: string): string {
            const normalizedColor = color?.trim() || ''
            let red: number | undefined
            let green: number | undefined
            let blue: number | undefined

            if (/^#[\da-f]{3,8}$/i.test(normalizedColor)) {
                const hex = normalizedColor.slice(1)
                const shorthand = hex.length === 3 || hex.length === 4
                red = parseInt(shorthand ? hex[0] + hex[0] : hex.slice(0, 2), 16)
                green = parseInt(shorthand ? hex[1] + hex[1] : hex.slice(2, 4), 16)
                blue = parseInt(shorthand ? hex[2] + hex[2] : hex.slice(4, 6), 16)
            } else {
                const rgbValues = normalizedColor.match(/\d+(?:\.\d+)?/g)
                if (rgbValues && rgbValues.length >= 3) [red, green, blue] = rgbValues.slice(0, 3).map(Number)
            }

            if (red === undefined || green === undefined || blue === undefined) return '#ffffff'

            const luminance = (red * 0.299 + green * 0.587 + blue * 0.114) / 255
            return luminance > 0.6 ? '#1f2937' : '#ffffff'
        },
        uploadTheme(event): void {
            const reader = new FileReader()
            reader.onload = this.onReaderLoad
            reader.readAsText(event.target.files[0])
            this.triggerInputFile(false)
            event.target.value = ''
        },
        onReaderLoad(event) {
            const json = JSON.parse(event.target.result)
            json.active = false
            this.importWidget(json)
        },
        importWidget(json: any) {
            if (this.availableThemes.find((i) => i.themeName === json.themeName)) json.themeName = json.themeName + '_copy'
            this.$http.post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/thememanagement', json).then(() => {
                this.setInfo({ title: this.$t('managers.themeManagement.uploadTheme'), msg: this.$t('managers.themeManagement.themeSuccessfullyUploaded') })

                this.getAllThemes()
            })
        },
        downloadTheme(): void {
            const themeToDownload = { ...this.selectedTheme }
            if (themeToDownload.id) delete themeToDownload.id
            downloadDirect(JSON.stringify(themeToDownload), themeToDownload.themeName, 'application/json')
        },
        openIconPicker(currentProp: string) {
            this.currentIconProp = currentProp
            this.iconPickerVisible = true
        },
        closeIconPicker() {
            this.iconPickerVisible = false
        },
        onChoosenIcon(choosenIcon) {
            this.selectedTheme.config[this.currentIconProp] = choosenIcon.className
            this.updateModelToSend(this.currentIconProp)
            this.closeIconPicker()
        }
    }
})
</script>

<style lang="scss">
.kn-theme-management {
    .p-fieldset-content {
        padding: 0.5rem;
    }
    .theme-settings-panel {
        min-width: 280px;
    }
    .theme-settings-header {
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .theme-active-switch {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        white-space: nowrap;
    }
    .theme-settings-search {
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    .theme-settings-content {
        overflow-y: auto;
    }
    .theme-settings-section {
        margin-bottom: 0.5rem;
        border: 1px solid var(--kn-table-border-color, #dfe3e8);
        border-radius: 0;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        &:hover {
            border-color: var(--kn-button-primary-background-color, #3b82f6);
        }
    }
    .theme-settings-section-header {
        display: flex;
        align-items: center;
        width: 100%;
        min-height: 2.25rem;
        gap: 0.5rem;
        padding: 0 0.75rem;
        border: 0;
        border-bottom: 1px solid transparent;
        background: var(--kn-page-background-color, #ffffff);
        color: var(--kn-color, #495057);
        cursor: pointer;
        font-family: inherit;
        font-size: 0.875rem;
        font-weight: 600;
        text-align: left;
        text-transform: capitalize;
        &:hover,
        &:focus-visible {
            background: var(--kn-hover-background-color, #f4f6f8);
            outline: none;
        }
        &[aria-expanded='true'] {
            border-bottom-color: var(--kn-table-border-color, #edf0f2);
        }
    }
    .theme-settings-section-content {
        padding: 0.5rem;
    }
    .theme-setting-field {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        padding: 0.25rem 0;
    }
    .theme-setting-label {
        color: var(--kn-color, #495057);
        font-size: 0.875rem;
        font-weight: 600;
    }
    .theme-setting-control {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        .q-field {
            flex: 1;
            min-width: 0;
        }
    }
    .theme-color-picker {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 2.25rem;
        height: 2.25rem;
        border: 2px solid var(--kn-table-border-color, #ced4da);
        border-radius: 50%;
        box-shadow: inset 0 0 0 1px rgb(255 255 255 / 55%);
        color: #ffffff;
        cursor: pointer;
        overflow: hidden;
        transition: box-shadow 0.2s ease, transform 0.2s ease;
        &:hover,
        &:focus-within {
            box-shadow: 0 0 0 2px var(--kn-button-primary-background-color, #3b82f6);
            transform: scale(1.05);
        }
        .q-icon {
            color: inherit;
            pointer-events: none;
        }
    }
    .theme-color-picker-input {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        opacity: 0;
        cursor: pointer;
    }
    .theme-icon-picker-button {
        min-width: 2.25rem;
        height: 2.25rem;
    }
    .theme-settings-empty {
        padding: 2rem 1rem;
        color: var(--kn-color, #6c757d);
        text-align: center;
    }
    @media screen and (max-width: 767px) {
        &.kn-page--row {
            align-content: flex-start;
            overflow-y: auto;
        }
        > .kn-page {
            flex: 0 0 100%;
            width: 100%;
            height: auto;
            min-height: 24rem;
        }
        > .theme-settings-panel {
            min-width: 0;
        }
    }
    @media screen and (max-width: 576px) {
        .theme-settings-header {
            align-items: stretch;
            flex-direction: column;
        }
        .theme-active-switch {
            justify-content: space-between;
        }
    }
}
</style>
