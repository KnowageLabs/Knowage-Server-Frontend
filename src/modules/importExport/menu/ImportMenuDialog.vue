<template>
    <q-dialog :model-value="true" persistent class="import-menu-dialog" square>
        <q-card class="kn-dialog--toolbar--primary">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ $t('common.import') }}</q-toolbar-title>
            </q-toolbar>
            <q-stepper ref="stepper" v-model="step" color="primary" animated class="kn-width-full">
                <q-step :name="1" title="Upload File" icon="settings" :done="step > 1">
                    <q-file v-model="uploadedFiles" accept=".zip" max-file-size="10000000" :label="uploadedFiles && uploadedFiles.length > 0 ? '' : $t('common.dragAndDropFileHere')" outlined square @update:model-value="onUpload">
                        <template #prepend>
                            <q-icon name="attach_file" />
                        </template>
                        <template #hint v-if="fileUploadedMessage">
                            {{ fileUploadedMessage }}
                        </template>
                    </q-file>
                </q-step>

                <q-step :name="2" title="Exported Menu" icon="assignment" :done="step > 2">
                    <form class="p-fluid p-formgrid p-grid kn-toolbar--secondary p-mt-0">
                        <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.source') }}</b>
                        <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.target') }}</b>
                    </form>
                    <div class="p-grid p-mt-0 roles-list">
                        <div class="p-col-6 menu-tree-container">
                            <q-tree :nodes="exportedMenuTree" node-key="menuId" default-expand-all>
                                <template #default-header="{ node }">
                                    <div class="row items-center full-width">
                                        <q-icon :name="node.children && node.children.length > 0 ? 'folder' : 'description'" class="q-mr-sm" />
                                        <span>{{ node.name }}</span>
                                    </div>
                                </template>
                            </q-tree>
                        </div>
                        <div class="p-col-6 menu-tree-container">
                            <q-tree :nodes="currentMenuTree" node-key="menuId" default-expand-all>
                                <template #default-header="{ node }">
                                    <div class="row items-center full-width">
                                        <q-icon :name="node.children && node.children.length > 0 ? 'folder' : 'description'" class="q-mr-sm" />
                                        <span>{{ node.name }}</span>
                                    </div>
                                </template>
                            </q-tree>
                        </div>
                    </div>
                </q-step>

                <q-step :name="3" title="Exported Roles" icon="create_new_folder" :done="step > 3">
                    <form class="p-fluid p-formgrid p-grid kn-toolbar--secondary p-m-0">
                        <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.source') }}</b>

                        <b class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">{{ $t('common.target') }}</b>
                    </form>
                    <ul class="roles-list p-mt-0">
                        <li v-for="(expRol, index) in importData.roles.exportedRoles" :key="index">
                            <form class="p-fluid p-formgrid p-grid p-m-1">
                                <p class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0 role-name-text">
                                    {{ expRol.name }}
                                </p>

                                <p v-if="importData.roles.associatedRoles[expRol.id]?.fixed == true" class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0 role-name-text">
                                    {{ importData.roles.associatedRoles[expRol.id].name }}
                                </p>

                                <span v-else class="p-field p-col-6 p-d-flex p-jc-center p-ai-center p-m-0">
                                    <q-select v-model="importData.roles.associatedRoles[expRol.id]" class="datasource-dropdown" style="min-width: 50%; margin-bottom: 0 !important" :options="getSelectableRoles(expRol)" option-label="name" clearable outlined dense square />
                                </span>
                            </form>
                        </li>
                    </ul>
                </q-step>

                <template #navigation>
                    <q-stepper-navigation class="p-d-flex p-flex-row">
                        <q-btn flat :label="$t('common.cancel')" @click="closeDialog" />
                        <span class="p-ml-auto">
                            <q-btn v-if="step > 1" flat :label="$t('common.back')" class="kn-button kn-button--secondary" @click=";($refs.stepper as any).previous()" />
                            <q-btn :label="step === 3 ? $t('common.finish') : $t('common.next')" class="kn-button kn-button--primary q-ml-sm" :disable="disableStep1" @click="goToNextStep" />
                        </span>
                    </q-stepper-navigation>
                </template>
            </q-stepper>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import mainStore from '../../../App.store'
import { AxiosResponse } from 'axios'
import { importExportEmitter } from '../ImportExportEmitter'

export default defineComponent({
    name: 'import-dialog',
    components: {},
    props: {},
    emits: ['close', 'import'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            step: 1,
            uploadedFiles: null as any,
            loading: false,
            fileUploadedMessage: '',
            importData: {} as any,
            exportedMenuTree: [] as any[],
            currentMenuTree: [] as any[]
        }
    },
    computed: {
        disableStep1() {
            if (this.step === 1) return !this.uploadedFiles
        }
    },
    created() {},
    methods: {
        closeDialog() {
            this.$emit('close')
        },
        emitImport(): void {
            this.$emit('import', { files: this.uploadedFiles })
        },
        onUpload(file) {
            if (file) this.sendFileForImport()
        },
        goToNextStep() {
            switch (this.step) {
                case 1:
                    ;(this.$refs.stepper as any).next()
                    break
                case 2:
                    ;(this.$refs.stepper as any).next()
                    break
                case 3:
                    this.sendExportedRolesAndMenuForImport()
                default:
                    break
            }
        },
        //Step 1
        sendFileForImport() {
            const importParams = new FormData()
            importParams.append('exportedArchive', this.uploadedFiles)
            importParams.append('importAssociationKind', 'noAssociations')

            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/menu/import', importParams)
                .then((response: AxiosResponse<any>) => {
                    this.importData.roles = { currentRoles: response.data.currentRoles, exportedRoles: response.data.exportedRoles, associatedRoles: response.data.associatedRoles }
                    this.importData.menu = { menuToImport: response.data.menu, currentMenu: response.data.currentMenu }
                    this.importData.objects = { currentObjects: response.data.currentObjects, exportedObjects: response.data.exportedObjects }
                    this.importData.notImportable = response.data.notImportable ?? []

                    this.buildMenuTrees()

                    this.fileUploadedMessage = `${(this.uploadedFiles as any).name} ${this.$t('managers.importExportDocs.fileUploadSuccess')}`
                })
                .catch((error) => {
                    this.uploadedFiles = null
                    console.error(error)
                    this.store.setError({ title: this.$t('common.error.uploading'), msg: error })

                    this.fileUploadedMessage = `${this.$t('managers.importExportDocs.fileUploadFail')}`
                })
                .finally(() => {
                    this.store.setLoading(false)
                })
        },
        //Step 3
        sendExportedRolesAndMenuForImport() {
            this.store.setLoading(true)

            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/document/associateRoles', this.getExportedRoles())
                .then((response: AxiosResponse<any>) => {
                    if (response.data.STATUS == 'NON OK') {
                        this.store.setError({ title: this.$t('common.error.uploading'), msg: response.data?.ERROR })
                        this.store.setLoading(false)
                    } else {
                        // After roles are associated, import the menu
                        this.$http
                            .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/serverManager/importExport/menu/importMenuInDB', {
                                rolesFromFile: this.importData.roles.exportedRoles,
                                obj: [],
                                overwrite: false,
                                tree: this.exportedMenuTree
                            })
                            .then((menuResponse: AxiosResponse<any>) => {
                                if (menuResponse.data.STATUS == 'NON OK') {
                                    this.store.setError({ title: this.$t('common.error.uploading'), msg: menuResponse.data?.ERROR })
                                } else {
                                    this.store.setInfo({ title: this.$t('common.toast.success'), msg: this.$t('common.toast.importSuccess') })
                                    importExportEmitter.emit('menuImported')
                                    this.closeDialog()
                                }
                            })
                            .catch((error) => {
                                console.error(error)
                                this.store.setError({ title: this.$t('common.error.uploading'), msg: error })
                            })
                            .finally(() => {
                                this.store.setLoading(false)
                            })
                    }
                })
                .catch((error) => {
                    console.error(error)
                    this.store.setError({ title: this.$t('common.error.uploading'), msg: error })
                    this.store.setLoading(false)
                })
        },
        getExportedRoles() {
            const exportingRoles = [] as any
            for (const key in this.importData.roles.associatedRoles) {
                if (this.importData.roles.associatedRoles[key]) exportingRoles.push({ roleAssociateId: this.importData.roles.associatedRoles[key].id, expRoleId: key })
            }

            return exportingRoles
        },
        getSelectableRoles(expRol) {
            if (!this.importData.roles?.currentRoles) return []

            return this.importData.roles.currentRoles.filter((role) => {
                return this.currentRoleIsSelectable(role, expRol)
            })
        },
        currentRoleIsSelectable(role, exprole) {
            //importData.roles.currentRoles
            let roleinl = -1 as any
            for (const i in this.importData.roles.associatedRoles) {
                if (this.importData.roles.associatedRoles[i]?.name == role?.name) {
                    roleinl = i
                }
            }

            //roles.exportedRoles
            if (roleinl != -1 && roleinl != exprole.id) {
                return false
            }
            return true
        },
        buildMenuTrees() {
            this.exportedMenuTree = this.buildTree(this.importData.menu?.menuToImport || [])
            this.currentMenuTree = this.buildTree(this.importData.menu?.currentMenu || [])
        },
        buildTree(menuItems: any[]): any[] {
            if (!menuItems || menuItems.length === 0) return []

            const normalizedItems = menuItems.map((item: any) => ({
                ...item,
                menuId: Number(item.menuId),
                parentId: item.parentId === null || item.parentId === undefined ? null : Number(item.parentId)
            }))

            const itemsMap = new Map<number, any>()
            const roots: any[] = []

            normalizedItems.forEach((item) => {
                itemsMap.set(item.menuId, { ...item, label: item.name, children: [] })
            })

            normalizedItems.forEach((item) => {
                const node = itemsMap.get(item.menuId)
                if (item.parentId === null) {
                    roots.push(node)
                } else {
                    const parent = itemsMap.get(item.parentId)
                    if (parent) parent.children.push(node)
                }
            })

            return roots
        }
    }
})
</script>
<style lang="scss">
.import-menu-dialog .q-card {
    max-width: 90vw;
    width: min(1000px, 90vw);
    padding: 0 !important;
}

.q-stepper--horizontal .q-stepper__nav {
    padding: 0 12px 12px;
}

.roles-list {
    padding: 0;
    list-style-type: none;
    line-height: 1.5em;
    border: 1px solid rgba(0, 0, 0, 0.12);
    overflow: auto;
    max-height: 410px;
    li {
        border-bottom: 1px solid rgba(0, 0, 0, 0.12);
    }
    li:last-child {
        border: none;
    }
}

.menu-tree-container {
    max-height: 400px;
    overflow: auto;
}

.menu-tree-container .q-card {
    height: 100%;
}

.role-name-text {
    word-break: break-word;
    overflow-wrap: break-word;
    white-space: normal;
}
</style>
