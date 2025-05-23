<template>
    <Toolbar class="kn-toolbar kn-toolbar--primary p-m-0">
        <template #start>{{ selectedKpi.name }}</template>
        <template #end>
            <Button :label="$t('kpi.kpiDefinition.aliasToolbarTitle')" :style="tabViewDescriptor.style.aliasButton" class="p-button-text p-button-rounded p-button-plain" @click="toggleAlias" />
            <Button icon="pi pi-save" class="p-button-text p-button-rounded p-button-plain" :disabled="buttonDisabled" data-test="save-button" @click="showSaveDialog = true" />
            <Button icon="pi pi-times" class="p-button-text p-button-rounded p-button-plain" data-test="close-button" @click="closeTemplateConfirm" />
        </template>
    </Toolbar>

    <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />

    <div class="p-d-flex p-flex-row">
        <div class="card kn-flex">
            <TabView v-model:activeIndex="activeTab" class="tabview-custom" data-test="tab-view">
                <TabPanel>
                    <template #header>
                        <span>{{ $t('kpi.kpiDefinition.formulaTitle') }}</span>
                    </template>

                    <KpiDefinitionFormulaTab
                        :prop-kpi="selectedKpi"
                        :measures="measureList"
                        :loading="loading"
                        :alias-to-input="aliasToInput"
                        :check-formula="checkFormula"
                        :active-tab="activeTab"
                        :reload-kpi="reloadKpi"
                        :show-guide="showGuide"
                        @updateFormulaToSave="onUpdateFormulaToSave"
                        @errorInFormula="ifErrorInFormula"
                        @touched="setTouched"
                        @onGuideClose="$emit('onGuideClose')"
                    />
                </TabPanel>

                <TabPanel>
                    <template #header>
                        <span>{{ $t('kpi.kpiDefinition.cardinalityTtitle') }}</span>
                    </template>

                    <KpiDefinitionCardinalityTab :selected-kpi="selectedKpi" :loading="loading" :update-measure-list="updateMeasureList" @measureListUpdated="updateMeasureList = false" />
                </TabPanel>

                <TabPanel>
                    <template #header>
                        <span>{{ $t('kpi.kpiDefinition.tresholdTitle') }}</span>
                    </template>

                    <KpiDefinitionThresholdTab :selected-kpi="selectedKpi" :thresholds-list="tresholdList" :severity-options="severityOptions" :threshold-type-list="thresholdTypeList" :loading="loading" @touched="setTouched" />
                </TabPanel>
            </TabView>
        </div>

        <div v-if="isAliasVisible">
            <Toolbar class="kn-toolbar kn-toolbar--secondary" :style="tabViewDescriptor.style.aliasList">
                <template #start>{{ $t('kpi.kpiDefinition.aliasToolbarTitle') }}</template>
            </Toolbar>
            <Listbox
                class="kn-list--column"
                :options="measureList"
                :filter="true"
                :filter-placeholder="$t('common.search')"
                option-label="alias"
                filter-match-mode="contains"
                :filter-fields="tabViewDescriptor.filterFields"
                :empty-filter-message="$t('common.info.noDataFound')"
                data-test="kpi-list"
                @change="insertAlias($event.value.alias)"
            >
                <template #empty>{{ $t('common.info.noDataFound') }}</template>
                <template #option="slotProps">
                    <div class="kn-list-item" data-test="list-item">
                        <div class="kn-list-item-text">
                            <span>{{ slotProps.option.alias }}</span>
                        </div>
                    </div>
                </template>
            </Listbox>
        </div>

        <Dialog id="saveDialog" class="kn-dialog--toolbar--primary importExportDialog" :style="tabViewDescriptor.style.saveDialog" :visible="showSaveDialog" footer="footer" :closable="false" modal>
            <template #header>
                <h4>{{ $t('kpi.kpiDefinition.addKpiAssociations') }}</h4>
            </template>
            <form class="p-fluid p-formgrid p-grid">
                <div class="p-field p-col-12 p-mt-4">
                    <span class="p-float-label p-mb-2">
                        <AutoComplete
                            v-model="v$.selectedKpi.category.$model"
                            :class="{
                                'p-invalid': v$.selectedKpi.category.$invalid && v$.selectedKpi.category.$dirty
                            }"
                            :suggestions="filteredCategories"
                            field="valueName"
                            @complete="setAutocompleteCategory($event)"
                        />
                        <label for="name" class="kn-material-input-label"> {{ $t('managers.configurationManagement.headers.category') }} *</label>
                    </span>
                    <KnValidationMessages
                        :v-comp="v$.selectedKpi.category"
                        :additional-translate-params="{
                            fieldName: $t('managers.configurationManagement.headers.category')
                        }"
                    >
                    </KnValidationMessages>
                </div>
                <div class="p-field-checkbox p-ml-2">
                    <Checkbox id="versioning" v-model="selectedKpi.enableVersioning" :binary="true" />
                    <label for="versioning">{{ $t('kpi.kpiDefinition.enableVersioning') }}</label>
                </div>
            </form>
            <template #footer>
                <div>
                    <Button class="kn-button kn-button--secondary" :label="$t('common.cancel')" data-test="close-button" @click="showSaveDialog = false" />
                    <Button class="kn-button kn-button--primary" :label="$t('common.save')" :disabled="v$.$invalid" data-test="submit-button" @click="saveKpi" />
                </div>
            </template>
        </Dialog>
    </div>
</template>

<script lang="ts">
import { AxiosResponse } from 'axios'
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import tabViewDescriptor from './KpiDefinitionDetailDescriptor.json'
import KpiDefinitionFormulaTab from './KpiDefinitionFormulaTab/KpiDefinitionFormulaTab.vue'
import KpiDefinitionCardinalityTab from './KpiDefinitionCardinalityTab/KpiDefinitionCardinalityTab.vue'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import KpiDefinitionThresholdTab from './KpiDefinitionThresholdTab/KpiDefinitionThresholdTab.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Listbox from 'primevue/listbox'
import Dialog from 'primevue/dialog'
import AutoComplete from 'primevue/autocomplete'
import Checkbox from 'primevue/checkbox'
import mainStore from '../../../../App.store'

export default defineComponent({
    components: { TabView, TabPanel, KnValidationMessages, Listbox, KpiDefinitionThresholdTab, KpiDefinitionFormulaTab, Dialog, AutoComplete, Checkbox, KpiDefinitionCardinalityTab },
    props: { id: { type: String, required: false }, version: { type: String, required: false }, cloneKpiVersion: { type: Number }, cloneKpiId: { type: Number } },
    emits: ['touched', 'closed', 'kpiCreated', 'kpiUpdated'],
    setup() {
        const store = mainStore()
        return { store }
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
            showSaveDialog: false,
            aliasToInput: null as string | null,
            activeTab: 0,
            previousActiveTab: -1,
            selectedKpi: {} as any,
            kpiToSave: {} as any,
            measureList: [] as any,
            tresholdList: [] as any,
            severityOptions: [] as any,
            thresholdTypeList: [] as any,
            kpiCategoryList: [] as any,
            filteredCategories: [] as any,
            formulaToSave: '',
            formulaHasErrors: false
        }
    },
    computed: {
        buttonDisabled(): any {
            if (this.selectedKpi.threshold) {
                if (this.formulaHasErrors === true || !this.selectedKpi.threshold.name) {
                    return true
                }
            }
            return false
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
            this.activeTab = 0
        },
        cloneKpiId() {
            this.cloneKpiConfirm(this.cloneKpiId, this.cloneKpiVersion)
        }
    },
    async created() {
        this.loadPersistentData()
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
            if (this.activeTab === 0) {
                this.aliasToInput = selectedAlias
            }
        },
        ifErrorInFormula(event) {
            debugger
            if (event) {
                this.activeTab = 0
                this.formulaHasErrors = true
            } else {
                this.updateMeasureList = true
                this.formulaHasErrors = false
            }
        },

        closeTemplateConfirm() {
            if (!this.touched) {
                this.closeTemplate()
            } else {
                this.$confirm.require({
                    message: this.$t('common.toast.unsavedChangesMessage'),
                    header: this.$t('common.toast.unsavedChangesHeader'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => {
                        this.touched = false
                        this.closeTemplate()
                    }
                })
            }
        },
        closeTemplate() {
            this.$router.push('/kpi-definition')
            this.$emit('closed')
        },

        cloneKpiConfirm(kpiId, kpiVersion) {
            this.$confirm.require({
                icon: 'pi pi-exclamation-triangle',
                message: this.$t('kpi.kpiDefinition.confirmClone'),
                header: this.$t(' '),
                accept: () => this.cloneKpi(kpiId, kpiVersion)
            })
        },
        async cloneKpi(kpiId, kpiVersion) {
            await this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/kpi/${kpiId}/${kpiVersion}/loadKpi`).then((response: AxiosResponse<any>) => {
                response.data.id = undefined
                response.data.name = this.$t('kpi.kpiDefinition.copyOf') + response.data.name

                this.selectedKpi = { ...response.data }
            })
        },
        setAutocompleteCategory(event) {
            setTimeout(() => {
                if (!event.query.trim().length) {
                    this.filteredCategories = [...this.kpiCategoryList] as any[]
                } else {
                    this.filteredCategories = this.kpiCategoryList.filter((category: any) => {
                        return category.valueCd.toLowerCase().startsWith(event.query.toLowerCase())
                    })
                }
            }, 250)
        },

        async saveKpi() {
            this.showSaveDialog = false
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
