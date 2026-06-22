<template>
    <q-layout view="hHh lpR fFf" container>
        <q-header>
            <q-toolbar :class="['kn-toolbar', secondary ? 'kn-toolbar--secondary' : 'kn-toolbar--primary']">
                <q-btn flat round dense icon="menu_open" @click="$emit('toggleDrawer')">
                    <q-tooltip>{{ $t('common.toggle') }}</q-tooltip>
                </q-btn>
                <q-toolbar-title>{{ simpleNavigation.name || $t('managers.crossNavigationManagement.newNavigation') }}</q-toolbar-title>
                <q-space />
                <q-btn flat round dense icon="close" data-test="close-button" @click="closeTemplate">
                    <q-tooltip>{{ $t('common.close') }}</q-tooltip>
                </q-btn>
            </q-toolbar>
        </q-header>

        <q-page-container>
            <q-linear-progress v-if="loading" indeterminate color="primary" class="kn-progress-bar" />
            <q-page class="column no-wrap">
                <q-stepper ref="stepper" v-model="currentStep" class="col crossnav-stepper q-pa-none" color="primary" animated flat keep-alive header-nav vertical>
                    <q-step :name="0" :title="$t('managers.crossNavigationManagement.step1Title')" :caption="$t('managers.crossNavigationManagement.step1Caption')" icon="description" :done="step1Done" :header-nav="true">
                        <CrossNavStep1Docs :simple-navigation="simpleNavigation" :loading="loadingDocs" @doc-selected="handleDocSelected" @touched="setDirty" />
                        <q-stepper-navigation class="row q-gutter-sm">
                            <q-btn unelevated color="primary" :label="$t('common.next')" :disable="!step1Done" @click="currentStep = 1" />
                        </q-stepper-navigation>
                    </q-step>

                    <q-step :name="1" :title="$t('managers.crossNavigationManagement.step2Title')" :caption="$t('managers.crossNavigationManagement.step2Caption')" icon="link" :done="currentStep > 1" :header-nav="step1Done">
                        <CrossNavStep2Params :navigation="navigation" @touched="setDirty" />
                        <q-stepper-navigation class="row q-gutter-sm">
                            <q-btn unelevated color="primary" :label="$t('common.next')" @click="currentStep = 2" />
                            <q-btn flat color="secondary" :label="$t('common.back')" @click="currentStep = 0" />
                        </q-stepper-navigation>
                    </q-step>

                    <q-step :name="2" :title="$t('managers.crossNavigationManagement.step3Title')" :caption="$t('managers.crossNavigationManagement.step3Caption')" icon="info" :header-nav="step1Done">
                        <CrossNavStep3Details :simple-navigation="simpleNavigation" :v$="v$" @touched="setDirty" @hint-dialog="hintDialog" />
                        <q-stepper-navigation class="row q-gutter-sm">
                            <q-btn unelevated color="primary" :label="$t('common.save')" :disable="buttonDisabled" data-test="save-button" @click="handleSave" />
                            <q-btn flat color="secondary" :label="$t('common.back')" @click="currentStep = 1" />
                        </q-stepper-navigation>
                    </q-step>
                </q-stepper>
            </q-page>
        </q-page-container>

        <HintDialog :dialog-visible="hintDialogVisible" :message="hintDialogMessage" :title="hintDialogTitle" @close="hintDialogVisible = false" />
    </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import { AxiosResponse } from 'axios'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import useValidate from '@vuelidate/core'
import CrossNavStep1Docs from './steps/CrossNavStep1Docs.vue'
import CrossNavStep2Params from './steps/CrossNavStep2Params.vue'
import CrossNavStep3Details from './steps/CrossNavStep3Details.vue'
import HintDialog from './dialogs/CrossNavigationManagementHintDialog.vue'
import crossNavigationManagementValidator from './CrossNavigationManagementValidator.json'
import crossNavigationDescriptor from './CrossNavigationManagementDescriptor.json'
import mainStore from '../../../App.store'

export default defineComponent({
    name: 'cross-navigation-detail',
    components: { CrossNavStep1Docs, CrossNavStep2Params, CrossNavStep3Details, HintDialog },
    props: {
        id: { type: String },
        secondary: { type: Boolean, default: false },
        presetOriginDoc: { type: Object, default: undefined }
    },
    emits: ['close', 'touched', 'saved', 'toggleDrawer'],
    setup() {
        const store = mainStore()
        const $q = useQuasar()
        const router = useRouter()
        return { store, $q, router }
    },
    data() {
        return {
            navigation: {} as any,
            simpleNavigation: {} as any,
            loading: false,
            loadingDocs: false,
            currentStep: 0,
            hintDialogVisible: false,
            hintDialogTitle: '',
            hintDialogMessage: '',
            operation: 'insert',
            originParams: [] as any[],
            autoGeneratedName: '' as string,
            crossNavigationDescriptor,
            v$: useValidate() as any
        }
    },
    computed: {
        step1Done(): boolean {
            return !!(this.simpleNavigation.fromDocId && this.simpleNavigation.toDocId)
        },
        buttonDisabled(): boolean {
            return this.v$.$invalid
        }
    },
    watch: {
        async id() {
            if (this.id) {
                await this.loadNavigation()
                if (this.originParams.length > 0) {
                    this.navigation.fromPars = this.originParams
                    this.originParams = []
                }
            } else {
                this.initNew()
            }
        },
        'simpleNavigation.fromDoc'() {
            this.tryAutoName()
        },
        'simpleNavigation.toDoc'() {
            this.tryAutoName()
        }
    },
    created() {
        if (this.id) {
            this.loadNavigation()
        } else {
            this.initNew()
        }
    },
    validations() {
        return {
            simpleNavigation: createValidations('simpleNavigation', crossNavigationManagementValidator.validations.simpleNavigation)
        }
    },
    methods: {
        initNew() {
            this.navigation = {}
            this.simpleNavigation = { type: 3 }
            this.autoGeneratedName = ''
            this.currentStep = 0
            if (this.presetOriginDoc) {
                this.handleDocSelected('origin', this.presetOriginDoc)
            }
        },
        setDirty(): void {
            this.$emit('touched')
        },
        async loadNavigation() {
            this.loading = true
            await this.$http
                .get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/crossNavigation/' + this.id + '/load/')
                .then((response: AxiosResponse<any>) => {
                    this.navigation = response.data
                    if (this.navigation.simpleNavigation.type === 0 || this.navigation.simpleNavigation.type === 2) {
                        this.navigation.simpleNavigation.type = 3
                    }
                    this.simpleNavigation = this.navigation.simpleNavigation
                })
                .finally(() => (this.loading = false))
        },
        async handleDocSelected(docType: string, doc: any) {
            this.loadingDocs = true
            this.setDirty()
            switch (docType) {
                case 'origin':
                    this.simpleNavigation.fromDocId = doc.DOCUMENT_ID
                    this.simpleNavigation.fromDoc = doc.DOCUMENT_LABEL
                    this.navigation.simpleNavigation = this.simpleNavigation
                    await this.loadInputParams(doc.DOCUMENT_LABEL).then((response) => (this.navigation.fromPars = response))
                    await this.loadOutputParams(doc.DOCUMENT_ID).then((response) => (this.navigation.fromPars = this.navigation.fromPars.concat(response)))
                    this.removeAllLink()
                    this.autoLinkParams()
                    break
                case 'target':
                    this.simpleNavigation.toDocId = doc.DOCUMENT_ID
                    this.simpleNavigation.toDoc = doc.DOCUMENT_LABEL
                    this.navigation.simpleNavigation = this.simpleNavigation
                    await this.loadInputParams(doc.DOCUMENT_LABEL).then((response) => (this.navigation.toPars = response))
                    this.autoLinkParams()
                    break
            }
            this.loadingDocs = false
        },
        async loadInputParams(label: string) {
            let params: any[] = []
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/documents/' + label + '/parameters').then((response: AxiosResponse<any>) => (params = response.data.results.map((param: any) => ({ id: param.id, name: param.label, type: 1, parType: param.parType }))))
            return params
        },
        async loadOutputParams(id: number) {
            let params: any[] = []
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/2.0/documents/' + id + '/listOutParams').then((response: AxiosResponse<any>) => (params = response.data.map((param: any) => ({ id: param.id, name: param.name, type: 0, parType: param.type.valueCd }))))
            return params
        },
        removeAllLink() {
            this.navigation.toPars?.forEach((param: any) => {
                param.links = []
            })
        },
        tryAutoName() {
            const from = this.simpleNavigation.fromDoc
            const to = this.simpleNavigation.toDoc
            if (!from || !to) return
            const candidate = `${from}-${to}`
            if (!this.simpleNavigation.name || this.simpleNavigation.name === this.autoGeneratedName) {
                this.simpleNavigation.name = candidate
                this.autoGeneratedName = candidate
            }
        },
        autoLinkParams() {
            if (!this.navigation.fromPars?.length || !this.navigation.toPars?.length) return
            this.navigation.toPars.forEach((toPar: any) => {
                if (toPar.links?.length) return
                const fromPar = this.navigation.fromPars.find((f: any) => f.name.toLowerCase() === toPar.name.toLowerCase())
                if (fromPar && (fromPar.type === 2 || fromPar.parType === toPar.parType)) {
                    toPar.links = [fromPar]
                }
            })
        },
        handleSave() {
            this.navigation.simpleNavigation = this.simpleNavigation
            if (this.navigation.simpleNavigation.id === undefined) {
                this.operation = 'insert'
                this.navigation.newRecord = true
                this.originParams = this.navigation.fromPars
            } else {
                this.operation = 'update'
                this.originParams = []
            }
            delete this.navigation.simpleNavigation.popupOptions
            if (this.navigation.simpleNavigation.type === 3) {
                this.navigation.simpleNavigation.type = 0
            }
            this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/crossNavigation/save/', this.navigation, { headers: { 'X-Disable-Errors': 'true' } })
                .then(() => {
                    this.store.setInfo({
                        title: this.$t(this.crossNavigationDescriptor.operation[this.operation].toastTitle),
                        msg: this.$t(this.crossNavigationDescriptor.operation.success)
                    })
                    this.$emit('saved', this.operation, this.navigation.simpleNavigation.name)
                })
                .catch((error) => {
                    this.store.setError({
                        title: this.$t('common.error.saving'),
                        msg: error.message
                    })
                })
                .finally(() => {
                    if (this.navigation.simpleNavigation.type === 0) {
                        this.navigation.simpleNavigation.type = 3
                    }
                })
        },
        closeTemplate() {
            this.$emit('close')
        },
        hintDialog(type: string) {
            switch (type) {
                case 'desc':
                    this.hintDialogTitle = this.$t('managers.crossNavigationManagement.hindDesc')
                    this.hintDialogMessage = this.$t('managers.crossNavigationManagement.hindDescMessage')
                    break
                case 'bread':
                    this.hintDialogTitle = this.$t('managers.crossNavigationManagement.hindBread')
                    this.hintDialogMessage = this.$t('managers.crossNavigationManagement.hindBreadMessage')
                    break
            }
            this.hintDialogVisible = true
        }
    }
})
</script>
