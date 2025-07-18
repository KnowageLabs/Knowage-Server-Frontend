<template>
    <div id="document-browser-sidebar">
        <Toolbar id="document-detail-toolbar" class="kn-toolbar kn-toolbar--secondary">
            <template #start>
                <div id="document-icons-container" class="p-d-flex p-flex-row p-jc-around">
                    <i v-if="user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_USER_MANAGEMENT)" v-tooltip.top="$t('documentBrowser.executeDocument')" class="fa fa-play-circle document-pointer p-mx-4" data-test="execution" @click="executeDocument" />
                    <template v-if="canEditDocument">
                        <i v-tooltip.top="$t('documentBrowser.editDocument')" class="pi pi-pencil document-pointer p-mx-4" @click="$emit('showDocumentDetails', document)" />
                        <i v-if="document.typeCode != 'DOSSIER'" v-tooltip.top="$t('documentBrowser.cloneDocument')" class="far fa-copy document-pointer p-mx-4" @click="cloneDocumentConfirm" />
                        <i v-if="user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_DELETE_MANAGEMENT)" v-tooltip.top="$t('documentBrowser.deleteDocument')" class="far fa-trash-alt document-pointer p-mx-4" @click="deleteDocumentConfirm" />
                    </template>
                    <i v-if="user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_MOVE_UP_STATE) && document.stateCode === 'TEST'" v-tooltip.left="$t('documentBrowser.moveUpDocumentState')" class="fa fa-arrow-up document-pointer p-mx-4" @click="changeStateDocumentConfirm('UP')" />
                    <i v-if="user?.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_MOVE_DOWN_STATE) && (document.stateCode === 'TEST' || document.stateCode === 'REL')" v-tooltip.left="$t('documentBrowser.moveDownDocumentState')" class="fa fa-arrow-down document-pointer p-mx-4" @click="changeStateDocumentConfirm('DOWN')" />
                </div>
            </template>
        </Toolbar>
        <div class="p-m-2 sidebarInfoContainer">
            <div v-if="selectedDocument?.previewFile" class="p-text-center p-my-3">
                <img id="image-preview" :src="getImageUrl" />
            </div>
            <div v-if="document.name" class="p-my-3">
                <h3 class="p-m-0">{{ $t('common.name') }}</h3>
                <p class="p-m-0" :title="document.name">{{ document.name }}</p>
            </div>
            <div v-if="document.label" class="p-my-3">
                <h3 class="p-m-0">{{ $t('common.label') }}</h3>
                <p class="p-m-0" :title="document.label">{{ document.label }}</p>
            </div>
            <div v-if="document.creationUser" class="p-my-3">
                <h3 class="p-m-0">{{ $t('common.author') }}</h3>
                <p class="p-m-0" :title="document.creationUser">{{ document.creationUser }}</p>
            </div>
            <div v-if="document.description" class="kn-truncated p-my-3">
                <h3 class="p-m-0">{{ $t('common.description') }}</h3>
                <p class="p-m-0" :title="document.description">{{ document.description }}</p>
            </div>
            <div v-if="document.stateCodeStr" class="p-my-3">
                <h3 class="p-m-0">{{ $t('common.state') }}</h3>
                <p class="p-m-0" :title="document.stateCodeStr">{{ document.stateCodeStr }}</p>
            </div>
            <div v-if="document.typeCode" class="p-my-3">
                <h3 class="p-m-0">{{ $t('common.type') }}</h3>
                <p class="p-m-0" :title="document.typeCode">{{ document.typeCode }}</p>
            </div>
            <div v-if="document.creationDate" class="p-my-3">
                <h3 class="p-m-0">{{ $t('common.creationDate') }}</h3>
                <p class="p-m-0" :title="document.creationDate">{{ getFormatedDate(document.creationDate) }}</p>
            </div>
            <div v-if="document.visible" class="p-my-3">
                <h3 class="p-m-0">{{ $t('common.visibility') }}</h3>
                <p class="p-m-0">{{ document.visible ? $t('common.visible') : $t('common.notVisible') }}</p>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { formatDate } from '@/helpers/commons/localeHelper'
import mainStore from '../../../../App.store'
import UserFunctionalitiesConstants from '@/UserFunctionalitiesConstants.json'

export default defineComponent({
    name: 'document-browser-sidebar',
    props: { selectedDocument: { type: Object } },
    emits: ['documentCloneClick', 'documentDeleteClick', 'itemSelected', 'documentChangeStateClicked', 'showDocumentDetails'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            UserFunctionalitiesConstants,
            document: null as any,
            user: null as any
        }
    },
    computed: {
        isSuperAdmin(): boolean {
            return this.user?.isSuperadmin
        },
        getImageUrl(): string {
            return `${import.meta.env.VITE_HOST_URL}${import.meta.env.VITE_KNOWAGE_CONTEXT}/servlet/AdapterHTTP?ACTION_NAME=MANAGE_PREVIEW_FILE_ACTION&SBI_ENVIRONMENT=DOCBROWSER&LIGHT_NAVIGATOR_DISABLED=TRUE&operation=DOWNLOAD&fileName=${this.selectedDocument?.previewFile}`
        },
        canEditDocument(): boolean {
            if (!this.user) return false
            switch (this.document.stateCode) {
                case 'TEST':
                    return this.user.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_TEST_MANAGEMENT)
                case 'DEV':
                    return this.user.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_DEV_MANAGEMENT)
                case 'REL':
                    return this.user.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT)
                case 'SUSPENDED':
                case 'SUSP':
                    return this.user.functionalities.includes(UserFunctionalitiesConstants.DOCUMENT_ADMIN_MANAGEMENT)
                default:
                    return false
            }
        }
    },
    watch: {
        selectedDocument() {
            this.loadDocument()
        }
    },
    created() {
        this.loadDocument()
        this.user = (this.store.$state as any).user
    },
    methods: {
        loadDocument() {
            this.document = this.selectedDocument
        },
        getFormatedDate(date: any) {
            return formatDate(date, 'MMM DD, YYYY h:mm:ss A')
        },
        cloneDocumentConfirm() {
            this.$confirm.require({
                header: this.$t('common.toast.cloneConfirmTitle'),
                accept: () => this.$emit('documentCloneClick', this.document)
            })
        },
        deleteDocumentConfirm() {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.$emit('documentDeleteClick', this.document)
            })
        },
        changeStateDocumentConfirm(direction: string) {
            this.$confirm.require({
                message: this.$t('documentBrowser.changeStateMessage'),
                header: this.$t('documentBrowser.changeStateTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.$emit('documentChangeStateClicked', { document: this.document, direction: direction })
            })
        },
        executeDocument() {
            this.$emit('itemSelected', { item: this.document, mode: 'execute' })
        }
    }
})
</script>
<style lang="scss" scoped>
#document-detail-toolbar .p-toolbar-group-left {
    width: 100%;
}
#document-icons-container {
    width: 100%;
}
.document-pointer:hover {
    cursor: pointer;
}
#image-preview {
    max-width: 100%;
    max-height: 200px;
}
#document-browser-sidebar {
    z-index: 150;
    background-color: white;
    height: 100%;
}
.sidebarInfoContainer {
    h3 {
        font-size: 1.3rem;
    }
    p {
        font-size: 0.9rem;
    }
}
</style>
