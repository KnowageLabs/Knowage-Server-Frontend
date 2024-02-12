<template>
    <div class="kn-page">
        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />
        <TabView v-model:activeIndex="activeTab" lazy data-test="tab-view" class="internationalization-management kn-tab kn-page-content" scrollable @tab-click="switchTabConfirm($event.index)">
            <TabPanel v-for="language in languages" :key="language" style="height: 100%">
                <template #header>
                    <q-avatar size="sm" class="p-mr-1">
                        <img :src="getFlag(language.languageTag)" />
                    </q-avatar>
                    {{ language.language }}
                    <span v-if="language.defaultLanguage">{{ $t('managers.internationalizationManagement.defaultLanguage') }}</span>
                </template>
                <q-table :rows="messages" :columns="columns" :filter="filter" row-key="name" hide-pagination flat :pagination="{ rowsPerPage: 0 }" style="height: 100%">
                    <template #top>
                        <q-input v-model="filter" rounded outlined debounce="300" :label="$t('common.search')" color="primary">
                            <template #append>
                                <q-icon name="search" />
                            </template>
                        </q-input>
                        <q-checkbox v-model="showOnlyEmptyFields" :label="$t('managers.internationalizationManagement.showBlankMessages')" @update:model-value="filterEmptyMessages" />

                        <q-space />
                        <q-btn v-if="language.defaultLanguage" color="primary" :disable="loading" :label="$t('managers.internationalizationManagement.table.addLabel')" @click="addEmptyLabel" />
                    </template>
                    <template #header-cell="props">
                        <q-th :props="props"> {{ $t(String(props.col.label)) }} </q-th>
                    </template>
                    <template #body-cell-label="props">
                        <q-td key="label" :props="props" :class="{ newValue: props.row['label_default'] && props.row['label_default'] != props.value }">
                            <q-input v-model="props.value" dense :filled="language.defaultLanguage" :borderless="!language.defaultLanguage" :disable="!language.defaultLanguage" @keyup="updateModel($event, props.rowIndex, 'label')" />
                        </q-td>
                    </template>
                    <template #body-cell-message="props">
                        <q-td key="message" :props="props" :class="{ newValue: props.row['message_default'] && props.row['message_default'] != props.value }"> <q-input v-model="props.value" dense filled @keyup="updateModel($event, props.rowIndex, 'message')" /> </q-td>
                    </template>
                    <template #body-cell-buttons="props">
                        <q-td key="buttons" :props="props" auto-width>
                            <q-btn v-tooltip.top="$t('common.save')" flat round color="primary" icon="save" @click="saveLabel(language, props.row)" />
                            <q-btn v-tooltip.top="language.defaultLanguage ? $t('common.delete') : $t('common.cancel')" flat round color="primary" :icon="language.defaultLanguage ? 'delete' : 'cancel'" @click="deleteLabelConfirm(language, props.row, props.rowIndex, language.defaultLanguage)" />
                        </q-td>
                    </template>
                </q-table>
            </TabPanel>
        </TabView>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iLanguage, iMessage } from './InternationalizationManagement'
import intDescriptor from './InternationalizationManagementDescriptor.json'
import { AxiosResponse } from 'axios'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import { mapActions } from 'pinia'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'internationalization-management',
    components: {
        TabView,
        TabPanel
    },
    data() {
        return {
            loading: false,
            intDescriptor,
            languages: [] as iLanguage[],
            defaultLanguage: {} as iLanguage,
            selectedLanguage: {} as iLanguage,
            messages: [] as iMessage[],
            allMessages: [] as iMessage[],
            defaultLangMessages: [] as iMessage[],
            showOnlyEmptyFields: false,
            initialShowEmptyFields: false,
            activeTab: 0,
            previousActiveTab: -1,
            filter: ''
        }
    },

    computed: {
        columns() {
            if (this.selectedLanguage.defaultLanguage) {
                return intDescriptor.defaultLanguageColumns
            } else {
                return intDescriptor.notDefaultLanguageColumns
            }
        }
    },
    async created() {
        await this.getLanguages()
        this.setDefaultLanguage()
        this.getMessages(this.defaultLanguage)
    },
    methods: {
        ...mapActions(mainStore, ['setError', 'setInfo']),
        filterEmptyMessages() {
            this.messages = this.showOnlyEmptyFields ? [...this.allMessages.filter((message) => !message.message)] : [...this.allMessages]
        },

        setDefaultLanguage() {
            let defaultLanguageIndex
            for (const language in this.languages) {
                if (this.languages[language].defaultLanguage) {
                    defaultLanguageIndex = language
                    this.defaultLanguage = this.languages[language]
                }
            }
            this.languages.unshift(this.languages.splice(defaultLanguageIndex, 1)[0])
            this.selectLanguage(0)
        },

        addEmptyLabel() {
            const tempMessage = {
                language: '',
                label: '',
                message: ''
            }
            this.messages.unshift(tempMessage)
        },

        selectLanguage(index) {
            const selectedTab = this.languages[index]
            this.selectedLanguage = this.languages[index]
            this.getMessages(selectedTab)
        },

        async switchTabConfirm(index) {
            if (this.messages.some((i) => i['message_default'] || i['label_default'])) {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.switchTab(index)
                        this.messages.map((i) => {
                            delete i['message_default']
                            delete i['label_default']
                            return i
                        })
                    },
                    reject: () => {
                        this.activeTab = this.previousActiveTab
                    }
                })
            } else {
                this.switchTab(index)
                this.previousActiveTab = this.activeTab
            }
        },
        switchTab(index) {
            this.initialShowEmptyFields = this.showOnlyEmptyFields.valueOf()
            this.showOnlyEmptyFields = false
            this.activeTab = index
            this.selectLanguage(index)
        },

        initCheck() {
            if (this.initialShowEmptyFields) {
                this.showOnlyEmptyFields = true
                this.filterEmptyMessages()
            }
        },
        async setDataForDefaultLanguage(response: AxiosResponse<any>) {
            if (response.data.length == 0) {
                this.addEmptyLabel()
            } else {
                await this.setDefaultLanguageValues(response)
                this.initCheck()
            }
        },
        async setDefaultLanguageValues(response: AxiosResponse<any>) {
            this.defaultLangMessages = response.data
            this.messages = response.data
        },

        async setEmptyDatatableData(selectedTab) {
            this.defaultLangMessages.forEach((defMess) => {
                const newMess = {} as any
                newMess.language = selectedTab.languageTag
                newMess.label = defMess.label
                newMess.defaultMessageCode = defMess.message
                newMess.message = ''
                this.messages.push(newMess)
            })
        },

        async checkForMessages(response, selectedTab) {
            if (response.data.length != 0) {
                await this.setFilledDatatableData(response, selectedTab)
            } else {
                await this.setEmptyDatatableData(selectedTab)
            }
            this.initCheck()
        },

        async setFilledDatatableData(response, selectedTab) {
            this.defaultLangMessages.forEach((defMess) => {
                const translatedMessage = response.data.find((item) => {
                    return item.label == defMess.label
                })
                if (translatedMessage) {
                    translatedMessage.defaultMessageCode = defMess.message
                    this.messages.push(translatedMessage)
                } else {
                    const message = {
                        language: selectedTab.languageTag,
                        label: defMess.label,
                        defaultMessageCode: defMess.message,
                        message: ''
                    }
                    this.messages.push(message)
                }
            })
        },

        getMessages(selectedTab) {
            this.messages = []
            this.loading = true
            return this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/i18nMessages/internationalization/?currLanguage=' + selectedTab.languageTag)
                .then((response: AxiosResponse<any>) => {
                    if (selectedTab.defaultLanguage) {
                        this.setDataForDefaultLanguage(response)
                    } else {
                        this.checkForMessages(response, selectedTab)
                    }
                    this.allMessages = [...this.messages]
                })
                .finally(() => (this.loading = false))
        },

        async getLanguages() {
            this.loading = true
            return this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/internationalization/languages')
                .then((response: AxiosResponse<any>) => {
                    this.languages = response.data
                })
                .finally(() => (this.loading = false))
        },

        saveOrUpdateMessage(url, toSave, langObj) {
            if (toSave.id) {
                delete toSave.defaultMessageCode

                return this.$http.put(url, toSave)
            } else {
                if (toSave.defaultMessageCode) delete toSave.defaultMessageCode
                toSave.language = langObj.languageTag
                return this.$http.post(url, toSave)
            }
        },

        saveLabel(langObj, message) {
            this.loading = true
            const url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/i18nMessages'
            const bkDefault = { message_default: message['message_default'], label_default: message['label_default'] }
            delete message['message_default']
            delete message['label_default']
            const toSave = { ...message } as iMessage
            this.saveOrUpdateMessage(url, toSave, langObj).then((response: AxiosResponse<any>) => {
                if (response.data.errors) {
                    message['message_default'] = bkDefault['message_default']
                    message['label_default'] = bkDefault['label_default']
                    this.setError({ msg: response.data.errors })
                } else {
                    this.setInfo({ msg: this.$t('common.toast.updateSuccess') })
                }
                this.getMessages(langObj)
                this.loading = false
            })
            this.initialShowEmptyFields = false
            this.showOnlyEmptyFields = false
        },

        deleteLabelConfirm(langObj, message, rowIndex, isDefault) {
            const msgToDelete = message
            if (msgToDelete.id) {
                let url = ''
                if (msgToDelete.defaultMessageCode) {
                    url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/i18nMessages/'
                    this.$confirm.require({
                        message: this.$t('managers.internationalizationManagement.delete.deleteMessage'),
                        header: this.$t('managers.internationalizationManagement.delete.deleteMessageTitle'),
                        icon: 'pi pi-exclamation-triangle',
                        accept: () => this.deleteLabel(url, msgToDelete.id, langObj)
                    })
                } else {
                    url = import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/i18nMessages/deletedefault/'
                    this.$confirm.require({
                        message: this.$t('managers.internationalizationManagement.delete.deleteDefault'),
                        header: this.$t('managers.internationalizationManagement.delete.deleteDefaultTitle'),

                        icon: 'pi pi-exclamation-triangle',
                        accept: () => this.deleteLabel(url, msgToDelete.id, langObj)
                    })
                }
            } else {
                isDefault ? this.messages.splice(rowIndex, 1) : this.setError({ title: this.$t('managers.internationalizationManagement.delete.deleteDefaultTitle'), msg: this.$t('managers.internationalizationManagement.delete.cantDelete') })
            }
        },

        updateModel(event, rowIndex, column) {
            if (!this.messages[rowIndex][column + '_default']) this.messages[rowIndex][column + '_default'] = this.messages[rowIndex][column]
            this.messages[rowIndex][column] = event.target.value
        },

        async deleteLabel(url, id, langObj) {
            await this.$http.delete(url + id).then((response: AxiosResponse<any>) => {
                if (response.data.errors) {
                    this.setError({ title: 'Error', msg: response.data.errors })
                } else {
                    this.setInfo({ title: this.$t('common.toast.deleteTitle'), msg: this.$t('common.toast.deleteSuccess') })
                    this.getMessages(langObj)
                }
            })
            this.initialShowEmptyFields = false
            this.showOnlyEmptyFields = false
        },

        getFlag(locale) {
            return `${import.meta.env.VITE_PUBLIC_PATH}images/flags/${locale.toLowerCase().substring(locale.length - 2)}.svg`
        }
    }
})
</script>

<style lang="scss">
.internationalization-management {
    .q-table__middle {
        max-height: calc(100vh - 110px);
    }
    .q-table {
        td {
            &.newValue {
                background-color: var(--kn-color-warning-alpha);
            }
        }
    }
}
</style>
