<template>
    <q-layout view="hHh lpR fFf" container>
        <q-header>
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-btn flat round dense icon="menu_open" @click="$emit('toggleDrawer')">
                    <q-tooltip>{{ $t('common.close') }}</q-tooltip>
                </q-btn>
                <q-toolbar-title>{{ selectedKpi.name }}</q-toolbar-title>
                <q-space />
                <q-btn flat round dense icon="alternate_email" data-test="alias-button" @click="toggleAlias">
                    <q-tooltip>{{ $t('kpi.kpiDefinition.aliasToolbarTitle') }}</q-tooltip>
                </q-btn>
                <q-btn flat round dense icon="close" data-test="close-button" @click="closeTemplateConfirm">
                    <q-tooltip>{{ $t('common.close') }}</q-tooltip>
                </q-btn>
            </q-toolbar>
        </q-header>

        <q-page-container>
            <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />

            <q-page class="column no-wrap">
                <q-stepper ref="stepper" v-model="currentStep" class="col kpi-stepper q-pa-none" header-class="prio" color="primary" animated flat keep-alive header-nav vertical>
                    <q-step :name="0" class="column no-wrap" :title="$t('kpi.kpiDefinition.formulaTitle')" :caption="$t('kpi.kpiDefinition.formulaCaption')" icon="functions" :done="formulaValidated" :header-nav="formulaValidated">
                        <div class="col q-pt-md">
                            <KpiDefinitionFormulaTab ref="formulaTab" :prop-kpi="selectedKpi" :measures="measureList" :loading="loading" :alias-to-input="aliasToInput" :reload-kpi="reloadKpi" @updateFormulaToSave="onUpdateFormulaToSave" @formulaChanged="onFormulaChanged" @touched="setTouched" />
                        </div>

                        <q-stepper-navigation class="row">
                            <q-btn v-if="!formulaValidated" unelevated color="primary" :label="$t('kpi.kpiDefinition.validateFormula')" :loading="isValidating" :disable="!canValidateFormula" @click="validateFormula" />
                            <q-btn v-else unelevated color="primary" :label="$t('common.next')" @click="currentStep = 1" />
                        </q-stepper-navigation>
                    </q-step>

                    <q-step :name="1" class="column no-wrap" :title="$t('kpi.kpiDefinition.cardinalityTtitle')" icon="grid_on" :done="currentStep > 1" :header-nav="currentStep > 1">
                        <div class="col q-pt-md">
                            <KpiDefinitionCardinalityTab :selected-kpi="selectedKpi" :loading="loading" :update-measure-list="updateMeasureList" @measureListUpdated="updateMeasureList = false" />
                        </div>

                        <q-stepper-navigation class="row">
                            <q-btn unelevated color="primary" :label="$t('common.next')" @click="currentStep = 2" />
                            <q-btn flat color="secondary" :label="$t('common.back')" @click="currentStep = 0" />
                        </q-stepper-navigation>
                    </q-step>

                    <q-step :name="2" class="column no-wrap" :title="$t('kpi.kpiDefinition.tresholdTitle')" icon="warning" :done="currentStep > 2" :header-nav="currentStep > 2">
                        <div class="col q-pt-md">
                            <KpiDefinitionThresholdTab :selected-kpi="selectedKpi" :thresholds-list="tresholdList" :severity-options="severityOptions" :threshold-type-list="thresholdTypeList" :loading="loading" @touched="setTouched" />
                        </div>

                        <q-stepper-navigation class="row">
                            <q-btn unelevated color="primary" :label="$t('common.next')" @click="currentStep = 3" />
                            <q-btn flat color="secondary" :label="$t('common.back')" @click="currentStep = 1" />
                        </q-stepper-navigation>
                    </q-step>

                    <q-step :name="3" class="column no-wrap" :title="$t('kpi.kpiDefinition.detailsTitle')" icon="info" :header-nav="currentStep >= 3">
                        <div class="col q-pt-md">
                            <KpiDefinitionDetailsTab :prop-kpi="selectedKpi" :kpi-category-list="kpiCategoryList" :loading="loading" @touched="setTouched" />
                        </div>

                        <q-stepper-navigation class="row">
                            <q-btn unelevated color="primary" :label="$t('common.save')" :disable="buttonDisabled" data-test="save-button" @click="saveKpi" />
                            <q-btn flat color="secondary" :label="$t('common.back')" @click="currentStep = 2" />
                        </q-stepper-navigation>
                    </q-step>
                </q-stepper>
            </q-page>
        </q-page-container>

        <q-drawer id="aliasList" v-model="isAliasVisible" class="column no-wrap" side="right" bordered :width="300" :breakpoint="500">
            <q-input v-model="aliasSearchFilter" class="q-ma-sm" :placeholder="$t('common.search')" dense outlined clearable square>
                <template v-slot:prepend>
                    <q-icon name="search" />
                </template>
            </q-input>

            <q-scroll-area class="col">
                <q-list v-if="filteredMeasureList.length > 0" dense>
                    <q-item v-for="measure in filteredMeasureList" :key="measure.alias" clickable data-test="list-item" @click="insertAlias(measure.alias)">
                        <q-item-section>
                            <q-item-label class="kn-list-item-text">{{ measure.alias }}</q-item-label>
                        </q-item-section>
                    </q-item>
                </q-list>
                <div v-else class="q-pa-md text-center text-grey">
                    {{ $t('common.info.noDataFound') }}
                </div>
            </q-scroll-area>
        </q-drawer>
    </q-layout>
</template>

<script lang="ts">
import { AxiosResponse } from 'axios'
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import { useQuasar } from 'quasar'
import useValidate from '@vuelidate/core'
import { useRouter } from 'vue-router'
import tabViewDescriptor from './KpiDefinitionDetailDescriptor.json'
import KpiDefinitionFormulaTab from './steps/KpiDefinitionFormulaTab.vue'
import KpiDefinitionCardinalityTab from './steps/KpiDefinitionCardinalityTab.vue'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import KpiDefinitionThresholdTab from './steps/KpiDefinitionThresholdTab.vue'
import KpiDefinitionDetailsTab from './steps/KpiDefinitionDetailsTab.vue'
import ProgressBar from 'primevue/progressbar'
import mainStore from '../../../../App.store'

export default defineComponent({
    components: { KnValidationMessages, KpiDefinitionThresholdTab, KpiDefinitionFormulaTab, KpiDefinitionCardinalityTab, KpiDefinitionDetailsTab, ProgressBar },
    props: { id: { type: String, required: false }, version: { type: String, required: false }, cloneKpiVersion: { type: Number }, cloneKpiId: { type: Number }, drawerVisible: { type: Boolean, required: true } },
    emits: ['touched', 'closed', 'kpiCreated', 'kpiUpdated', 'toggleDrawer'],
    setup() {
        const store = mainStore()
        const router = useRouter()
        const $q = useQuasar()

        return { store, router, $q }
    },
    data() {
        return {
            v$: useValidate() as any,
            tabViewDescriptor,
            touched: false,
            loading: false,
            isAliasVisible: false,
            reloadKpi: false,
            updateMeasureList: false,
            aliasToInput: '' as string | undefined,
            currentStep: 0,
            formulaValidated: false,
            canValidateFormula: true,
            isValidating: false,
            aliasSearchFilter: '',
            selectedKpi: {} as any,
            kpiToSave: {} as any,
            measureList: [] as any,
            tresholdList: [] as any,
            severityOptions: [] as any,
            thresholdTypeList: [] as any,
            kpiCategoryList: [] as any,
            formulaToSave: '',
            formulaHasErrors: false
        }
    },
    computed: {
        buttonDisabled(): any {
            if (this.v$.$invalid) return true
            if ((this.selectedKpi.threshold && this.formulaHasErrors === true) || !this.selectedKpi.threshold.name) return true

            return false
        },
        filteredMeasureList(): any[] {
            if (!this.aliasSearchFilter) return this.measureList

            const searchLower = this.aliasSearchFilter.toLowerCase()
            return this.measureList.filter((measure: any) => measure.alias?.toLowerCase().includes(searchLower))
        }
    },
    validations() {
        return {
            selectedKpi: createValidations('selectedKpi', tabViewDescriptor.validations.selectedKpi)
        }
    },
    watch: {
        id() {
            this.loadSelectedKpi()
            this.currentStep = 0
            this.formulaValidated = false
            this.canValidateFormula = true
        },
        cloneKpiId() {
            this.cloneKpiConfirm(this.cloneKpiId, this.cloneKpiVersion)
        }
    },
    async created() {
        await this.loadPersistentData()
    },
    methods: {
        async loadPersistentData() {
            this.loading = true
            await this.createGetKpiDataUrl('listMeasure').then((response: AxiosResponse<any>) => {
                this.measureList = [...response.data]
            })
            await this.createGetKpiDataUrl('listThreshold').then((response: AxiosResponse<any>) => {
                this.tresholdList = [...response.data]
            })
            await this.createGetTabViewDataUrl('SEVERITY').then((response: AxiosResponse<any>) => {
                this.severityOptions = [...response.data]
            })
            await this.createGetTabViewDataUrl('THRESHOLD_TYPE').then((response: AxiosResponse<any>) => {
                this.thresholdTypeList = [...response.data]
            })
            await this.createCategories('KPI_KPI_CATEGORY').then((response: AxiosResponse<any>) => {
                this.kpiCategoryList = [...response.data]
            })
            await this.loadSelectedKpi()
            this.loading = false
        },

        createGetTabViewDataUrl(dataType: string) {
            return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/2.0/domains/listByCode/${dataType}`)
        },
        createCategories(dataType: string) {
            return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/3.0/category/listByCode/${dataType}`)
        },
        createGetKpiDataUrl(dataType: string) {
            return this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/kpi/${dataType}`)
        },
        async loadSelectedKpi() {
            if (this.id) {
                await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/kpi/${this.id}/${this.version}/loadKpi`).then((response: AxiosResponse<any>) => {
                    this.selectedKpi = { ...response.data }
                    const definitionFormula = JSON.parse(this.selectedKpi.definition)
                    this.formulaToSave = definitionFormula.formula
                })
            } else {
                this.selectedKpi = { ...tabViewDescriptor.emptyKpi }
            }
        },
        onUpdateFormulaToSave(event) {
            this.formulaToSave = event
        },
        setTouched() {
            this.touched = true
        },
        toggleAlias() {
            this.isAliasVisible = this.isAliasVisible ? false : true
        },
        insertAlias(selectedAlias: string) {
            if (this.currentStep === 0) this.aliasToInput = selectedAlias
        },
        async validateFormula() {
            this.isValidating = true
            try {
                const formulaTab = this.$refs.formulaTab as any
                if (formulaTab && formulaTab.checkFormulaForErrors) {
                    const result = await formulaTab.checkFormulaForErrors()
                    if (result && Object.keys(result).length > 0) {
                        this.formulaValidated = true
                        this.formulaHasErrors = false
                        this.updateMeasureList = true
                    } else {
                        this.formulaValidated = false
                        this.formulaHasErrors = true
                    }
                }
            } finally {
                this.isValidating = false
            }
        },
        onFormulaChanged() {
            this.formulaValidated = false
            this.canValidateFormula = true
            this.setTouched()
        },

        closeTemplateConfirm() {
            if (!this.touched) {
                this.closeTemplate()
            } else {
                this.$q
                    .dialog({
                        title: this.$t('common.toast.unsavedChangesHeader'),
                        message: this.$t('common.toast.unsavedChangesMessage'),
                        cancel: true,
                        persistent: true
                    })
                    .onOk(() => {
                        this.touched = false
                        this.closeTemplate()
                    })
            }
        },
        closeTemplate() {
            this.router.push('/kpi-definition')
            this.$emit('closed')
        },

        cloneKpiConfirm(kpiId, kpiVersion) {
            this.$q
                .dialog({
                    title: this.$t('common.clone'),
                    message: this.$t('kpi.kpiDefinition.confirmClone'),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => this.cloneKpi(kpiId, kpiVersion))
        },
        async cloneKpi(kpiId, kpiVersion) {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/kpi/${kpiId}/${kpiVersion}/loadKpi`).then((response: AxiosResponse<any>) => {
                response.data.id = undefined
                response.data.name = this.$t('kpi.kpiDefinition.copyOf') + response.data.name

                this.selectedKpi = { ...response.data }
            })
        },

        async saveKpi() {
            const isFormCorrect = await this.v$.$validate()
            if (!isFormCorrect) return

            this.touched = false
            this.kpiToSave = { ...this.selectedKpi }

            if (typeof this.kpiToSave.category !== 'object') this.kpiToSave.category = { valueCd: this.kpiToSave.category }

            this.correctColors(this.kpiToSave.threshold.thresholdValues)
            if (typeof this.kpiToSave.definition === 'object') {
                this.kpiToSave.definition.formula = this.formulaToSave
                this.kpiToSave.definition = JSON.stringify(this.kpiToSave.definition)
            }
            if (typeof this.kpiToSave.cardinality === 'object') {
                this.kpiToSave.cardinality = JSON.stringify(this.kpiToSave.cardinality)
            }
            await this.$http
                .post(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/1.0/kpi/saveKpi', this.kpiToSave)
                .then(() => {
                    this.store.setInfo({ title: this.$t('common.toast.success') })
                    this.kpiToSave.id === undefined ? this.$emit('kpiCreated', this.kpiToSave.name) : this.$emit('kpiUpdated')
                    this.reloadKpi = true
                    setTimeout(() => {
                        this.reloadKpi = false
                    }, 250)
                })
                .catch((response: AxiosResponse<any>) => {
                    this.store.setError({
                        title: this.$t('common.error.generic'),
                        msg: response
                    })
                })
        },
        correctColors(thresholdValues) {
            thresholdValues.forEach((value: any) => {
                if (!value.color.includes('#')) {
                    const fixedColor = '#' + value.color
                    value.color = fixedColor
                }
            })
        }
    }
})
</script>

<style scoped>
/* .kpi-stepper,
.kpi-stepper :deep(.q-stepper__content),
.kpi-stepper :deep(.q-panel-parent),
.kpi-stepper :deep(.q-panel),
.kpi-stepper :deep(.q-stepper__step),
.kpi-stepper :deep(.q-stepper__step-content),
.kpi-stepper :deep(.q-stepper__step-inner) {
    display: flex !important;
    flex-direction: column !important;
    flex: 1 !important;
}

.kpi-stepper :deep(.q-stepper__content),
.kpi-stepper :deep(.q-panel-parent),
.kpi-stepper :deep(.q-panel),
.kpi-stepper :deep(.q-stepper__step) {
    height: 100% !important;
}

.kpi-stepper :deep(.q-stepper__step-content) {
    overflow: hidden !important;
}

.kpi-stepper :deep(.q-stepper__step-inner) {
    overflow: auto !important;
    padding: 0px !important;
}

.kpi-stepper :deep(.q-stepper__nav) {
    flex-shrink: 0 !important;
    border-top: 1px solid rgba(0, 0, 0, 0.12);
    background: white;
} */
</style>
