<template>
    <Dialog class="p-fluid kn-dialog--toolbar--primary" :content-style="documentExecutionLinkDialogDescriptor.dialog.style" :visible="visible" :modal="true" :closable="false">
        <template #header>
            <Toolbar class="kn-toolbar kn-toolbar--primary p-p-0 p-m-0 p-col-12">
                <template #start>
                    {{ $t('documentExecution.main.linkToDocument ') }}
                </template>
            </Toolbar>
        </template>

        <div class="p-m-2">
            <Message v-if="linkInfo && !linkInfo.isPublic" class="kn-flex p-m-2" severity="info" :closable="false">
                {{ $t('documentExecution.main.publicUrlExecutionDisabled') }}
            </Message>
            <div class="p-m-2">
                <p>{{ $t('documentExecution.main.copyLinkAndShare') }}</p>
            </div>

            <div class="p-fluid p-formgrid p-grid p-m-2">
                <div class="p-field p-col-12">
                    <Textarea v-if="embedHTML" v-model="publicUrl" class="kn-material-input" :rows="6"></Textarea>
                    <InputText v-else v-model="publicUrl" class="kn-material-input p-inputtext-sm" />
                </div>
            </div>

            <div class="p-fluid p-formgrid p-grid p-m-2">
                <div v-if="embedHTML" class="p-field p-col-12">
                    <div class="p-d-flex p-flex-column p-m-2">
                        <label class="kn-material-input-label p-mr-2">{{ $t('common.width') }}</label>
                        <InputNumber v-model="iframeWidth" class="kn-material-input p-inputtext-sm" @blur="onInputNumberChanged" />
                    </div>
                    <div class="p-d-flex p-flex-column p-m-2">
                        <label class="kn-material-input-label p-mr-2">{{ $t('common.height') }}</label>
                        <InputNumber v-model="iframeHeight" class="kn-material-input p-inputtext-sm" @blur="onInputNumberChanged" />
                    </div>
                </div>
                <div v-else class="p-d-flex p-jc-around p-col-12">
                    <div class="kn-flex p-m-2">
                        <label class="kn-material-input-label p-mr-4">{{ $t('documentExecution.main.showMenu') }}</label>
                        <InputSwitch v-model="showMenu" @change="createLink" />
                    </div>
                    <div class="kn-flex p-m-2">
                        <label class="kn-material-input-label p-mr-4">{{ $t('documentExecution.main.showToolbar') }}</label>
                        <InputSwitch v-model="showToolbar" @change="createLink" />
                    </div>
                </div>
            </div>
        </div>

        <template #footer>
            <div class="p-d-flex p-flex-row p-jc-end">
                <Button class="kn-button kn-button--primary" @click="closeDialog"> {{ $t('common.cancel') }}</Button>
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iParameter } from '@/components/UI/KnParameterSidebar/KnParameterSidebar'
import { mapState } from 'pinia'
import Dialog from 'primevue/dialog'
import documentExecutionLinkDialogDescriptor from './DocumentExecutionLinkDialogDescriptor.json'
import Textarea from 'primevue/textarea'
import mainStore from '@/App.store'
import Message from 'primevue/message'
import InputNumber from 'primevue/inputnumber'
import InputSwitch from 'primevue/inputswitch'

export default defineComponent({
    name: 'document-execution-link-dialog',
    components: { Dialog, Message, Textarea, InputNumber, InputSwitch },
    props: {
        visible: { type: Boolean },
        linkInfo: { type: Object as PropType<{ isPublic: boolean; noPublicRoleError: boolean } | null> },
        embedHTML: { type: Boolean },
        propDocument: { type: Object },
        filtersData: { type: Object as PropType<{ filterStatus: iParameter[]; isReadyForExecution: boolean }> }
    },
    emits: ['close'],
    setup() {
        const store = mainStore()
        return { store }
    },
    data() {
        return {
            documentExecutionLinkDialogDescriptor,
            publicUrl: '',
            document: null as any,
            showMenu: false,
            showToolbar: false,
            iframeWidth: null as number | null,
            iframeHeight: null as number | null
        }
    },
    computed: {
        ...mapState(mainStore, {
            user: 'user'
        })
    },
    watch: {
        visible() {
            this.loadLink()
        },
        propDocument() {
            this.loadLink()
        },
        linkParameters() {
            this.loadLink()
        }
    },
    created() {
        this.loadLink()
    },
    methods: {
        loadLink() {
            this.loadDocument()
            this.getPublicUrl()
        },
        loadDocument() {
            this.document = this.propDocument
        },
        getPublicUrl() {
            //  const tenet = (this.store.$state as any).user.organization

            if (!this.document) return

            this.createLink()

            // if (this.document.typeCode === 'DATAMART' || this.document.typeCode === 'DOSSIER') {
            //     if (this.embedHTML) {
            //         this.publicUrl = `<iframe width="600" height="600" src="${location.origin}${this.$route.fullPath}" frameborder="0"></iframe>`
            //     } else {
            //         this.publicUrl = location.origin + this.$route.fullPath
            //     }
            // } else {
            //     if (this.embedHTML) {
            //         this.publicUrl = `<iframe width="600" height="600" src="${location.origin}/knowage${this.linkInfo?.isPublic ? '/public' : ''}/servlet/AdapterHTTP?ACTION_NAME=EXECUTE_DOCUMENT_ACTION&OBJECT_LABEL=${
            //             this.document.label
            //         }&TOOLBAR_VISIBLE=true&ORGANIZATION=${tenet}&NEW_SESSION=true&PARAMETERS= frameborder="0"></iframe>`
            //     } else {
            //         this.publicUrl = location.origin + `/knowage${this.linkInfo?.isPublic ? '/public' : ''}/servlet/AdapterHTTP?ACTION_NAME=EXECUTE_DOCUMENT_ACTION&OBJECT_LABEL=${this.document.label}&TOOLBAR_VISIBLE=true&ORGANIZATION=${tenet}&NEW_SESSION=true&PARAMETERS=`
            //     }
            // }
        },
        createLink() {
            if (!this.document || !this.user) return
            console.log('----------- DOCUMENT: ', this.document)
            console.log('----------- USER: ', this.user)
            const documentType = this.getocumentType()
            this.publicUrl = import.meta.env.VITE_HOST_URL + import.meta.env.VITE_PUBLIC_PATH + `${documentType}/${this.document.label}?toolbar=${this.showToolbar}&menu=${this.showMenu}&role='${this.user.sessionRole}'`
            console.log('---------- CREATED LINK: ', this.publicUrl)
        },
        getocumentType() {
            switch (this.document?.typeCode) {
                case 'DOCUMENT_COMPOSITE':
                    return 'document-composite'
                case 'DASHBOARD':
                    return 'dashboard'
                default:
                    return ''
            }
        },
        onInputNumberChanged() {
            setTimeout(() => this.createLink(), 250)
        },
        closeDialog() {
            this.$emit('close')
            this.publicUrl = ''
        }
    }
})
</script>
