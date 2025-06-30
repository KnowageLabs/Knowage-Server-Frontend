<template>
    <q-toolbar class="kn-toolbar kn-toolbar--secondary">
        <q-toolbar-title>{{ menuNode.name }}</q-toolbar-title>

        <q-btn flat round dense icon="save" :disable="formValid" data-test="submit-button" @click="save">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.save') }}</q-tooltip>
        </q-btn>
        <q-btn flat round dense icon="cancel" data-test="close-button" @click="closeForm">
            <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.cancel') }}</q-tooltip>
        </q-btn>
    </q-toolbar>

    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" data-test="progress-bar" />

    <div class="kn-detail col">
        <Card class="q-ma-md q-mb-sm">
            <template #content>
                <div class="row q-col-gutter-sm">
                    <kn-icon-picker v-if="chooseIconModalShown" :enable-base64="true" :current-icon="selectedIcon" @save="onChosenIcon" @close="closeFontAwesomeSelectionModal"></kn-icon-picker>
                    <q-input filled class="col" v-model="v$.menuNode.name.$model" :error="v$.menuNode.name.$invalid && v$.menuNode.name.$dirty" :error-message="$t('common.validation.required', { fieldName: $t('managers.menuManagement.form.name') })" :label="$t('managers.menuManagement.form.name') + '*'" @update:model-value="onDataChange(v$.menuNode.name)" data-test="name-input">
                        <template #before v-if="isIconSelectorShown(menuNode)">
                            <div class="relative-position">
                                <q-btn v-if="isCustomIconShown(menuNode)" flat size="lg" @click="openFontAwesomeSelectionModal()">
                                    <q-avatar size="42px">
                                        <img :src="menuNode?.custIcon?.src" />
                                    </q-avatar>
                                    <q-tooltip :delay="500">{{ $t('managers.menuManagement.chooseIcon') }}</q-tooltip>
                                </q-btn>
                                <q-btn v-else flat :icon="iconToShow" size="lg" @click="openFontAwesomeSelectionModal()">
                                    <q-tooltip :delay="500">{{ $t('managers.menuManagement.chooseIcon') }}</q-tooltip>
                                </q-btn>
                                <q-btn v-if="menuNode?.icon?.className || menuNode?.custIcon?.src" dense flat rounded @click.stop="clearSelectedIcon()" class="clearIcon">
                                    <q-icon name="highlight_off" size="sm" />
                                    <q-tooltip :delay="500">{{ $t('common.clear') }}</q-tooltip>
                                </q-btn>
                            </div>
                        </template>
                    </q-input>
                    <q-select filled class="col" emit-value map-options v-model="v$.menuNode.menuNodeContent.$model" :options="menuNodeContent" option-label="name" option-value="value" :label="$t('managers.menuManagement.form.menuNodeContent') + '*'" @update:model-value="onMenuNodeChange(v$.menuNode.menuNodeContent)" />
                </div>
                <div class="row q-col-gutter-sm">
                    <q-input class="col" rows="2" filled type="textarea" v-model="v$.menuNode.descr.$model" :error="v$.menuNode.descr.$invalid && v$.menuNode.descr.$dirty" :error-message="$t('common.validation.required', { fieldName: $t('common.description') })" max-length="255" :label="$t('common.description') + '*'" @update:model-value="onDataChange(v$.menuNode.descr)" data-test="description-input" />
                </div>

                <div v-if="!staticPageHidden" class="row q-col-gutter-sm">
                    <q-select filled class="col" emit-value map-options v-model="v$.menuNode.staticPage.$model" :options="staticPagesList" option-label="name" option-value="name" :label="$t('managers.menuManagement.form.staticPage') + '*'" @update:model-value="onStaticPageSelect()">
                        <template #no-option>
                            <div class="row justify-center q-pa-sm">{{ $t('common.info.noAvailableItems') }}</div>
                        </template>
                    </q-select>
                </div>

                <div v-if="!documentHidden" class="row q-col-gutter-sm">
                    <q-input class="col" filled readonly v-model="v$.menuNode.document.$model" :error="v$.menuNode.document.$invalid && v$.menuNode.document.$dirty" :error-message="$t('common.validation.required', { fieldName: $t('managers.menuManagement.form.document') })" :label="$t('managers.menuManagement.form.document') + '*'" @update:model-value="onDataChange(v$.menuNode.document)">
                        <template v-slot:before>
                            <q-btn flat icon="find_in_page" size="lg" @click="openRelatedDocumentModal()">
                                <q-tooltip :delay="500">{{ $t('managers.menuManagement.selectDocument') }}</q-tooltip>
                            </q-btn>
                        </template>
                    </q-input>
                    <q-input class="hidden" v-model="v$.menuNode.objId.$model" @update:model-value="onDataChange(v$.menuNode.objId)" />
                    <q-input class="col" filled v-model="v$.menuNode.objParameters.$model" :label="$t('managers.menuManagement.form.objParameters')" @update:model-value="onDataChange(v$.menuNode.objParameters)">
                        <template v-slot:append>
                            <q-btn flat round icon="format_list_bulleted" @click="showParamsModal">
                                <q-tooltip :delay="500">{{ $t('Format Parameters') }}</q-tooltip>
                            </q-btn>
                        </template>
                    </q-input>

                    <q-dialog v-model="displayModal">
                        <q-card style="min-width: 50vw; max-width: 60vw">
                            <q-card-section>
                                <RelatedDocumentList :loading="loading" data-test="related-documents-list" @selectedDocument="onDocumentSelect"></RelatedDocumentList>
                            </q-card-section>
                        </q-card>
                    </q-dialog>
                    <q-dialog v-model="displayModalParams">
                        <q-card style="min-width: 50vw; max-width: 60vw">
                            <q-card-section>
                                <MenuManagementParameterDialog :parameters-string="menuNode.objParameters" @close="displayModalParams = false" @save="updateParameters"></MenuManagementParameterDialog>
                            </q-card-section>
                        </q-card>
                    </q-dialog>
                </div>

                <div v-if="!externalAppHidden" class="row q-col-gutter-sm">
                    <q-input
                        class="col"
                        filled
                        v-model="v$.menuNode.externalApplicationUrl.$model"
                        :error="v$.menuNode.externalApplicationUrl.$invalid && v$.menuNode.externalApplicationUrl.$dirty"
                        :error-message="$t('common.validation.required', { fieldName: $t('managers.menuManagement.form.externalApplicationUrl') })"
                        :label="$t('managers.menuManagement.form.externalApplicationUrl') + '*'"
                        @update:model-value="onDataChange(v$.menuNode.externalApplicationUrl)"
                    />
                </div>

                <div v-if="!functionalityHidden" class="row q-col-gutter-sm">
                    <q-select filled class="col" emit-value map-options v-model="v$.menuNode.functionality.$model" :options="menuNodeContentFunctionalies" option-label="name" option-value="value" :label="$t('managers.menuManagement.form.functionality') + '*'" @update:model-value="onFunctionalityTypeChange(v$.menuNode.functionality)"></q-select>

                    <q-input v-if="!documentTreeHidden" class="col" readonly filled v-model="v$.menuNode.initialPath.$model" :label="$t('managers.menuManagement.form.initialPath', { functionality: $t('documentBrowser.title') })" @update:model-value="onDataChange(v$.menuNode.initialPath.$model)">
                        <template v-slot:before>
                            <q-btn flat icon="folder_open" size="lg" @click="openDocumentBrowserSelector()">
                                <q-tooltip :delay="500">{{ $t('managers.menuManagement.form.initialPathDialog', { functionality: $t('workspace.menuLabels.menuTitle') }) }}</q-tooltip>
                            </q-btn>
                        </template>
                    </q-input>
                    <q-dialog v-model="showDocumentBrowserFolders">
                        <q-card style="min-width: 50vw; max-width: 60vw">
                            <q-card-section>
                                <DocumentBrowserTree :selected="v$.menuNode.initialPath.$model" :loading="loading" @selectedDocumentNode="onSelectedDocumentNode"></DocumentBrowserTree>
                            </q-card-section>
                        </q-card>
                    </q-dialog>

                    <q-select v-if="!workspaceInitialHidden" filled class="col" emit-value map-options v-model="v$.menuNode.initialPath.$model" :options="workspaceOptions" option-label="name" option-value="value" :label="$t('managers.menuManagement.form.initialPath', { functionality: $t('workspace.menuLabels.menuTitle') })"></q-select>
                </div>
            </template>
        </Card>
        <RolesCard :hidden="hideForm" :roles-list="roles" :parent-node-roles="parentNodeRoles" :selected="selectedMenuNode.roles" @changed="setSelectedRoles($event)"></RolesCard>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import { iMenuNode } from '../MenuManagement'
import { iRole } from '../../usersManagement/UsersManagement'
import useValidate from '@vuelidate/core'
import { createValidations } from '@/helpers/commons/validationHelper'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import RelatedDocumentList from '../RelatedDocumentsList/MenuManagementRelatedDocumentList.vue'
import RolesCard from '../RolesCard/MenuManagementRolesCard.vue'
import DocumentBrowserTree from '../DocumentBrowserTree/MenuManagementDocumentBrowserTree.vue'
import KnIconPicker from '@/components/UI/KnIconPicker/KnIconPicker.vue'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import MenuConfigurationDescriptor from '../MenuManagementDescriptor.json'
import MenuConfigurationValidationDescriptor from './MenuManagementValidationDescriptor.json'
import MenuManagementElementDetailDescriptor from './MenuManagementElementDetailDescriptor.json'
import MenuManagementParameterDialog from './MenuManagementParameterDialog.vue'
import mainStore from '../../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    name: 'profile-attributes-detail',
    components: { Dropdown, DocumentBrowserTree, RelatedDocumentList, KnIconPicker, KnValidationMessages, Dialog, RolesCard, MenuManagementParameterDialog },
    props: { roles: { type: Array }, selectedMenuNode: { type: Object, required: true }, selectedRoles: { type: Array }, staticPagesList: { type: Array }, menuNodes: { type: Array }, parentNodeRoles: { type: Array } },
    emits: ['refreshRecordSet', 'closesForm', 'dataChanged'],
    data() {
        return {
            v$: useValidate() as any,
            apiUrl: import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/',
            menuNode: {} as iMenuNode,
            loading: false as boolean,
            hideForm: false as boolean,
            documentHidden: true as boolean,
            staticPageHidden: true as boolean,
            externalAppHidden: true as boolean,
            functionalityHidden: true as boolean,
            workspaceInitialHidden: true as boolean,
            documentTreeHidden: true as boolean,
            dirty: false as boolean,
            displayModal: false as boolean,
            chooseIconModalShown: false as boolean,
            relatedDocuments: [],
            selectedRelatedDocument: null as string | null,
            selectedIcon: undefined as string | undefined,
            selectedFunctionality: {},
            menuNodeContent: MenuConfigurationDescriptor.menuNodeContent,
            workspaceOptions: MenuConfigurationDescriptor.workspaceOptions,
            menuNodeContentFunctionalies: MenuConfigurationDescriptor.menuNodeContentFunctionalies,
            menuManagementElementDetailDescriptor: MenuManagementElementDetailDescriptor.importantfields,
            nodes: [] as iMenuNode[],
            showDocumentBrowserFolders: false as boolean,
            displayModalParams: false as boolean,
            tempParams: [] as any[]
        }
    },
    computed: {
        formValid(): any {
            return this.v$.$invalid
        },
        iconToShow(): string {
            return this.menuNode.icon ? this.menuNode.icon.className : 'bookmark_add'
        }
    },
    watch: {
        selectedMenuNode: {
            handler: function (node) {
                this.v$.$reset()
                this.loadNode(node)
            }
        },
        menuNodes() {
            this.loadNodes()
        },
        'menuNode.functionality': {
            handler: function (newFunctionality, oldFunctionality) {
                if (oldFunctionality && newFunctionality != oldFunctionality) this.menuNode.initialPath = null
            }
        }
    },
    validations() {
        return {
            menuNode: createValidations('menuNode', MenuConfigurationValidationDescriptor.validations.menuNode)
        }
    },
    async created() {
        this.loadNodes()
        if (this.selectedMenuNode) {
            this.loadNode(this.selectedMenuNode)
        }
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError']),
        loadNodes() {
            this.nodes = this.menuNodes as iMenuNode[]
        },
        resetForm() {
            Object.keys(this.menuNode).forEach((k) => delete this.menuNode[k])
        },
        openRelatedDocumentModal() {
            this.displayModal = true
        },
        openDocumentBrowserSelector() {
            this.showDocumentBrowserFolders = true
        },
        closeDocumentBrowserFolders() {
            this.showDocumentBrowserFolders = false
        },
        closeRelatedDocumentModal() {
            this.displayModal = false
        },
        showForm() {
            this.resetForm()
            this.hideForm = false
        },
        clearSelectedIcon() {
            this.selectedIcon = ''
            this.menuNode.custIcon = null
            this.menuNode.icon = null
        },
        setSelectedRoles(roles: iRole[]) {
            this.menuNode.roles = roles
        },
        toggleDocument() {
            this.functionalityHidden = this.staticPageHidden = this.externalAppHidden = this.documentTreeHidden = this.workspaceInitialHidden = true
            this.documentHidden = false
        },
        toggleStaticPage() {
            this.functionalityHidden = this.externalAppHidden = this.documentHidden = this.documentTreeHidden = this.workspaceInitialHidden = true
            this.staticPageHidden = false
        },
        toggleExternalApp() {
            this.functionalityHidden = this.documentHidden = this.staticPageHidden = this.documentTreeHidden = this.workspaceInitialHidden = true
            this.externalAppHidden = false
        },
        toggleFunctionality() {
            this.externalAppHidden = this.documentHidden = this.staticPageHidden = true
            this.functionalityHidden = false
            if (this.menuNode.functionality == 'WorkspaceManagement') {
                this.toggleWorkspaceInitial()
            } else if (this.menuNode.functionality == 'DocumentUserBrowser') {
                this.toggleDocumentTreeSelect()
            }
        },
        isIconSelectorShown(node: iMenuNode) {
            if (node.level == 1) {
                return true
            }
        },
        isFaIconShown(node: iMenuNode) {
            if (node.level == 1 && node.icon != null) {
                return true
            }
        },
        isCustomIconShown(node: iMenuNode) {
            if (node.level == 1 && node.custIcon != null) {
                return true
            }
        },
        toggleEmpty() {
            this.functionalityHidden = this.externalAppHidden = this.documentHidden = this.staticPageHidden = this.documentTreeHidden = this.workspaceInitialHidden = true
        },
        toggleWorkspaceInitial() {
            this.workspaceInitialHidden = false
            this.documentTreeHidden = true
        },
        toggleDocumentTreeSelect() {
            this.documentTreeHidden = false
            this.workspaceInitialHidden = true
        },
        onMenuNodeChange(menuNodeContent) {
            if (menuNodeContent.$model == 1) {
                this.toggleDocument()
            } else if (menuNodeContent.$model == 3) {
                this.toggleStaticPage()
            } else if (menuNodeContent.$model == 2) {
                this.toggleExternalApp()
            } else if (menuNodeContent.$model == 4) {
                this.toggleFunctionality()
            } else {
                this.toggleEmpty()
            }
        },
        onFunctionalityTypeChange(functionality) {
            if (functionality.$model == 'WorkspaceManagement') {
                this.toggleWorkspaceInitial()
            } else if (functionality.$model == 'DocumentUserBrowser') {
                this.toggleDocumentTreeSelect()
            }
        },
        openFontAwesomeSelectionModal() {
            this.chooseIconModalShown = true
        },
        closeFontAwesomeSelectionModal() {
            this.chooseIconModalShown = false
        },
        setBase64Image(base64image) {
            this.menuNode.icon = null
            this.menuNode.custIcon = {
                id: null,
                className: 'custom',
                unicode: null,
                category: 'custom',
                label: 'logo.png',
                src: base64image.image,
                visible: true
            }
            this.selectedIcon = base64image
        },
        onChosenIcon(choosenIcon) {
            if (choosenIcon.category === 'custom') {
                this.setBase64Image(choosenIcon)
            } else {
                this.menuNode.icon = choosenIcon

                this.menuNode.custIcon = null
                this.selectedIcon = this.menuNode.icon.className
            }

            this.closeFontAwesomeSelectionModal()
        },
        onDocumentSelect(document) {
            this.menuNode.objId = document.DOCUMENT_ID
            this.menuNode.document = document.DOCUMENT_NAME
            this.closeRelatedDocumentModal()
        },
        async save() {
            if (this.checkIfNodeExists()) {
                this.setError({ title: this.$t('managers.menuManagement.info.errorTitle'), msg: this.$t('managers.menuManagement.info.duplicateErrorMessage') })
                return
            }

            let response: AxiosResponse<any>

            if (this.menuNode.menuId != null) {
                response = await this.$http.put(this.apiUrl + 'menu/' + this.menuNode.menuId, this.getMenuDataForSave())
            } else {
                response = await this.$http.post(this.apiUrl + 'menu/', this.getMenuDataForSave())
            }

            if (response.status == 200) {
                if (response.data.errors) {
                    this.setError({ title: this.$t('managers.menuManagement.info.errorTitle'), msg: this.$t('managers.menuManagement.info.errorMessage') })
                } else {
                    this.setInfo({ title: this.$t('managers.menuManagement.info.saveTitle'), msg: this.$t('managers.menuManagement.info.saveMessage') })
                }
            }
            this.$emit('refreshRecordSet')
            this.resetForm()
        },
        checkIfNodeExists() {
            let exists = false
            const menuItemForSave = this.getMenuDataForSave()

            if (!menuItemForSave.parentId) menuItemForSave.parentId = null

            for (let i = 0; i < this.nodes.length; i++) {
                const tempNode = this.nodes[i] as iMenuNode
                if (tempNode.menuId != menuItemForSave.menuId && tempNode.parentId === menuItemForSave.parentId && tempNode.name === menuItemForSave.name) {
                    exists = true
                    break
                }
            }

            return exists
        },
        closeForm() {
            this.$emit('closesForm')
        },
        onAttributeSelect(event: any) {
            this.populateForm(event.data)
        },
        populateForm(menuNode: iMenuNode) {
            this.hideForm = false
            this.menuNode = { ...menuNode }
            if (menuNode.objId) {
                this.getDocumentNameByID(menuNode.objId)
            }

            if (menuNode.custIcon != null) {
                //var base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
                this.selectedIcon = menuNode.custIcon.src || undefined
            } else if (menuNode.icon != null) {
                this.selectedIcon = menuNode.icon.className
            } else {
                this.selectedIcon = undefined
            }
            if (this.menuNode.functionality != null) {
                this.menuNode.menuNodeContent = 4
                this.toggleFunctionality()
            } else if (this.menuNode.externalApplicationUrl != null) {
                this.menuNode.menuNodeContent = 2
                this.toggleExternalApp()
            } else if (this.menuNode.objId != null) {
                this.menuNode.menuNodeContent = 1
                this.toggleDocument()
            } else if (this.menuNode.staticPage != null && this.menuNode.staticPage != '') {
                this.menuNode.menuNodeContent = 3
                this.toggleStaticPage()
            } else {
                this.menuNode.menuNodeContent = 0
                this.toggleEmpty()
            }
        },
        getMenuDataForSave() {
            const menuNodeForSave = { ...this.menuNode }

            const fieldsList: string[] = this.menuManagementElementDetailDescriptor.fieldsList
            const fieldToSave: any = this.menuManagementElementDetailDescriptor.filedsToSave[menuNodeForSave.menuNodeContent]

            fieldsList.forEach((field) => !fieldToSave.fields.includes(field) && (menuNodeForSave[field] = null))

            delete menuNodeForSave.menuNodeContent

            if (!menuNodeForSave.parentId) menuNodeForSave.parentId = null

            return menuNodeForSave
        },
        async getDocumentNameByID(id: any) {
            await this.$http.get(this.apiUrl + 'documents/' + id).then((response: AxiosResponse<any>) => {
                this.menuNode.document = response.data.name
            })
        },
        onStaticPageSelect() {
            this.menuNode.initialPath = this.menuNode.functionality = this.menuNode.objParameters = this.menuNode.objId = this.menuNode.externalApplicationUrl = null
        },
        onDataChange(v$Comp) {
            v$Comp.$touch()
            this.$emit('dataChanged')
        },
        loadNode(menuNode) {
            if (menuNode.menuId === null) {
                this.resetForm()
                return
            }
            this.populateForm(menuNode)
        },

        onSelectedDocumentNode(documentInitialPath) {
            this.menuNode.initialPath = documentInitialPath
            this.closeDocumentBrowserFolders()
        },

        showParamsModal() {
            this.displayModalParams = true
        },

        updateParameters(paramsString: string) {
            this.menuNode.objParameters = paramsString
            this.displayModalParams = false
            this.$emit('dataChanged')
        }
    }
})
</script>

<style lang="scss" scoped>
.clearIcon {
    position: absolute;
    right: -10px;
    top: -10px;
}
.table-header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    @media screen and (max-width: 960px) {
        align-items: start;
    }
}

.record-image {
    width: 50px;
    box-shadow: 0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23);
}

.p-dialog .record-image {
    width: 50px;
    margin: 0 auto 2rem auto;
    display: block;
}

.confirmation-content {
    display: flex;
    align-items: center;
    justify-content: center;
}
@media screen and (max-width: 960px) {
    ::v-deep(.p-toolbar) {
        flex-wrap: wrap;

        .p-button {
            margin-bottom: 0.25rem;
        }
    }
}
</style>
