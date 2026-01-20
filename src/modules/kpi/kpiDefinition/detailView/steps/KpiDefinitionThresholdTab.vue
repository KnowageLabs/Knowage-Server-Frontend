<template>
    <q-card v-if="!loading">
        <q-card-section>
            <q-banner v-if="kpi.threshold.usedByKpi" inline-actions class="text-white bg-info q-mb-md" rounded>
                <template v-slot:avatar>
                    <q-icon name="info" color="white" />
                </template>
                {{ $t('kpi.kpiDefinition.thresholdReused') }}
                <template v-slot:action>
                    <q-btn flat color="white" :label="$t('kpi.kpiDefinition.clone')" data-test="clone-button" @click="cloneExistingThreshold" />
                </template>
            </q-banner>

            <div class="row q-col-gutter-md">
                <div class="col-12 col-md-4">
                    <q-input v-model="v$.threshold.name.$model" :label="$t('common.name') + ' *'" dense maxlength="100" :error="v$.threshold.name.$invalid && v$.threshold.name.$dirty" data-test="name-input" @blur="v$.threshold.name.$touch()" @update:model-value="$emit('touched')"> </q-input>
                </div>

                <div class="col-12 col-md-4">
                    <q-input v-model="v$.threshold.description.$model" :label="$t('common.description')" dense maxlength="500" :error="v$.threshold.description.$invalid && v$.threshold.description.$dirty" data-test="description-input" @blur="v$.threshold.description.$touch()" @update:model-value="$emit('touched')">
                        <template v-slot:error>
                            <KnValidationMessages :v-comp="v$.threshold.description" :additional-translate-params="{ fieldName: $t('common.description') }" />
                        </template>
                    </q-input>
                </div>

                <div class="col-12 col-md-4">
                    <q-select v-model="threshold.typeId" :options="thresholdTypeList" :label="$t('common.type')" dense option-label="translatedValueName" option-value="valueId" emit-value map-options @update:model-value="setTypeCd" />
                </div>
            </div>
            <q-linear-progress v-if="loading" indeterminate class="q-mt-md" data-test="progress-bar" />

            <q-markup-table v-if="!loading" flat bordered class="q-mt-xs threshold-table" data-test="messages-table">
                <thead>
                    <tr>
                        <th :colspan="tableColumns.length + 2" class="bg-grey-2">
                            <div class="row justify-between items-center q-py-sm">
                                <q-btn flat dense color="primary" :label="$t('kpi.kpiDefinition.thresholdsListTitle')" @click="thresholdListVisible = true" />
                                <q-btn flat dense color="primary" icon="add" :label="$t('kpi.kpiDefinition.addNewThreshold')" data-test="new-button" @click="addNewThresholdItem" />
                            </div>
                        </th>
                    </tr>
                    <tr>
                        <th style="width: 50px"></th>
                        <th v-for="col in tableColumns" :key="col.name" :class="'text-' + col.align">
                            {{ col.label }}
                        </th>
                        <th style="text-align: right"></th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(element, index) in kpi.threshold.thresholdValues" :key="element.id || index" draggable="true" :class="{ 'row-dragging': draggedIndex === index }" @dragstart="onDragStart($event, index)" @dragend="onDragEnd" @dragover="onDragOver($event, index)" @drop="onDrop($event, index)">
                        <td>
                            <q-icon name="drag_indicator" class="cursor-move" size="sm" />
                        </td>

                        <td>
                            <q-input v-model="element.label" dense @update:model-value="$emit('touched')" />
                        </td>

                        <td>
                            <q-input v-model.number="element.minValue" type="number" dense @update:model-value="$emit('touched')" />
                        </td>

                        <td class="text-center">
                            <q-checkbox v-model="element.includeMin" dense @update:model-value="$emit('touched')" />
                        </td>

                        <td>
                            <q-input v-model.number="element.maxValue" type="number" dense @update:model-value="$emit('touched')" />
                        </td>

                        <td class="text-center">
                            <q-checkbox v-model="element.includeMax" dense @update:model-value="$emit('touched')" />
                        </td>

                        <td>
                            <q-select v-model="element.severityId" :options="severityOptions" option-label="valueCd" option-value="valueId" emit-value map-options dense @update:model-value="setSeverityCdFromValue(element)" />
                        </td>

                        <td>
                            <div class="row items-center q-gutter-sm no-wrap">
                                <q-btn round size="sm" square :style="{ backgroundColor: element.color }">
                                    <q-popup-proxy>
                                        <q-color v-model="element.color" @change="$emit('touched')" />
                                    </q-popup-proxy>
                                </q-btn>
                            </div>
                        </td>

                        <td class="text-right">
                            <q-btn flat dense color="primary" icon="delete" data-test="delete-button" @click="deleteThresholdItemConfirm(index)" />
                        </td>
                    </tr>
                </tbody>
            </q-markup-table>
        </q-card-section>
    </q-card>

    <Sidebar v-model:visible="thresholdListVisible" class="mySidebar" :show-close-icon="false" position="right">
        <Toolbar class="kn-toolbar kn-toolbar--secondary">
            <template #start>{{ $t('kpi.kpiDefinition.thresholdsListTitle') }}</template>
        </Toolbar>
        <Listbox class="kn-list--column" :options="thresholdsList" :filter="true" :filter-placeholder="$t('common.search')" filter-match-mode="contains" :filter-fields="tabViewDescriptor.filterFields" :empty-filter-message="$t('common.info.noDataFound')" data-test="search-input" @change="confirmToLoadThreshold">
            <template #empty>{{ $t('common.info.noDataFound') }}</template>
            <template #option="slotProps">
                <div class="kn-list-item" data-test="list-item">
                    <div class="kn-list-item-text">
                        <span>{{ slotProps.option.name }}</span>
                        <span class="kn-list-item-text-secondary">{{ slotProps.option.description }}</span>
                    </div>
                </div>
            </template>
        </Listbox>
    </Sidebar>

    <Dialog class="kn-dialog--toolbar--primary importExportDialog" :visible="overrideDialogVisible" footer="footer" :header="$t('kpi.kpiDefinition.reusedTitle')" :closable="false" modal>
        <p class="p-mt-4">{{ $t('kpi.kpiDefinition.thresholdReused') }}</p>
        <template #footer>
            <div class="p-d-flex p-jc-center">
                <Button class="kn-button kn-button--primary" :label="$t('common.cancel')" data-test="close-button" @click="overrideDialogVisible = false" />
                <Button class="kn-button kn-button--primary" :label="$t('kpi.kpiDefinition.useIt')" data-test="close-button-use-threshold" @click="cloneSelectedThreshold('use')" />
                <Button class="kn-button kn-button--primary" :label="$t('kpi.kpiDefinition.clone')" data-test="clone-button-threshold" @click="cloneSelectedThreshold('clone')" />
            </div>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { AxiosResponse } from 'axios'
import { defineComponent } from 'vue'
import { createValidations } from '@/helpers/commons/validationHelper'
import useValidate from '@vuelidate/core'
import tabViewDescriptor from '../KpiDefinitionDetailDescriptor.json'
import tresholdTabDescriptor from './KpiDefinitionThresholdTabDescriptor.json'
import KnValidationMessages from '@/components/UI/KnValidatonMessages.vue'
import Sidebar from 'primevue/sidebar'
import Listbox from 'primevue/listbox'
import Dialog from 'primevue/dialog'

export default defineComponent({
    components: { KnValidationMessages, Sidebar, Listbox, Dialog },
    props: { selectedKpi: { type: Object as any }, thresholdsList: Array, severityOptions: { type: Array as any, required: false }, thresholdTypeList: { type: Array as any, required: false }, loading: Boolean },
    emits: ['touched'],

    data() {
        return {
            v$: useValidate() as any,
            tabViewDescriptor,
            tresholdTabDescriptor,
            kpi: {} as any,
            threshold: {} as any,
            thresholdToClone: {} as any,
            thresholdListVisible: false,
            overrideDialogVisible: false,
            draggedIndex: null as any,
            dragOverIndex: null as any
        }
    },
    computed: {
        tableColumns() {
            return [
                { name: 'label', label: this.$t('common.label'), field: 'label', align: 'left' as const },
                { name: 'minValue', label: this.$t('kpi.kpiDefinition.min'), field: 'minValue', align: 'left' as const },
                { name: 'includeMin', label: this.$t('kpi.kpiDefinition.minInclude'), field: 'includeMin', align: 'center' as const },
                { name: 'maxValue', label: this.$t('kpi.kpiDefinition.max'), field: 'maxValue', align: 'left' as const },
                { name: 'includeMax', label: this.$t('kpi.kpiDefinition.maxInclude'), field: 'includeMax', align: 'center' as const },
                { name: 'severityId', label: 'Severity', field: 'severityId', align: 'left' as const },
                { name: 'color', label: this.$t('kpi.kpiDefinition.color'), field: 'color', align: 'left' as const }
            ]
        }
    },
    created() {
        if (this.selectedKpi) {
            this.kpi = this.selectedKpi as any
            if (this.kpi.threshold) this.threshold = this.kpi.threshold
        }
    },
    watch: {
        selectedKpi() {
            this.kpi = this.selectedKpi as any
            this.threshold = this.kpi.threshold
        }
    },

    validations() {
        return {
            threshold: createValidations('threshold', tresholdTabDescriptor.validations.kpi)
        }
    },

    methods: {
        onDragStart(event: DragEvent, index: any) {
            this.draggedIndex = index
            event.dataTransfer!.effectAllowed = 'move'
            event.dataTransfer!.setData('text/plain', index.toString())
        },

        onDragEnd() {
            this.draggedIndex = null
            this.dragOverIndex = null
        },

        onDragOver(event: DragEvent, index: any) {
            event.preventDefault()
            this.dragOverIndex = index
        },

        onDrop(event: DragEvent, dropIndex: any) {
            event.preventDefault()

            const draggedIdx = this.draggedIndex !== null ? this.draggedIndex : parseInt(event.dataTransfer!.getData('text/plain'), 10)

            if (draggedIdx === null || isNaN(draggedIdx) || draggedIdx === dropIndex) {
                this.draggedIndex = null
                this.dragOverIndex = null
                return
            }

            const items = [...this.kpi.threshold.thresholdValues]
            const draggedItem = items[draggedIdx]

            // Remove from old position
            items.splice(draggedIdx, 1)

            // Insert at new position
            items.splice(dropIndex, 0, draggedItem)

            // Update positions
            items.forEach((item, idx) => {
                item.position = idx + 1
            })

            this.kpi.threshold.thresholdValues = items
            this.$emit('touched')

            this.draggedIndex = null
            this.dragOverIndex = null
        },

        setPositionOnReorder(event) {
            this.kpi.threshold.thresholdValues = event.value
            this.kpi.threshold.thresholdValues.forEach((_, index) => {
                this.kpi.threshold.thresholdValues[index].position = index + 1
            })
        },

        setSeverityCdFromValue(data) {
            const index = this.severityOptions.findIndex((SO: any) => SO.valueId === data.severityId)
            data.severityCd = index >= 0 ? this.severityOptions[index].valueCd : ''
            this.$emit('touched')
        },

        setTypeCd() {
            const index = this.thresholdTypeList.findIndex((SO: any) => SO.valueId === this.threshold.typeId)
            this.threshold.type = index >= 0 ? this.thresholdTypeList[index].translatedValueName : ''
        },

        addNewThresholdItem() {
            const newThreshold = { ...tresholdTabDescriptor.newThreshold }
            newThreshold.position = this.kpi.threshold.thresholdValues.length + 1
            this.kpi.threshold.thresholdValues.push(newThreshold)
        },

        deleteThresholdItemConfirm(index) {
            this.$confirm.require({
                message: this.$t('common.toast.deleteMessage'),
                header: this.$t('common.toast.deleteTitle'),
                icon: 'pi pi-exclamation-triangle',
                accept: () => this.deleteThresholdItem(index)
            })
        },
        deleteThresholdItem(index) {
            this.kpi.threshold.thresholdValues.splice(index, 1)
        },

        confirmToLoadThreshold(event) {
            if (this.kpi.threshold.thresholdValues.length == 0 || this.kpi.threshold === tresholdTabDescriptor.newThreshold) {
                this.loadSelectedThreshold(event)
            } else {
                this.$confirm.require({
                    message: this.$t('kpi.kpiDefinition.confirmOverride'),
                    header: this.$t('kpi.kpiDefinition.thresholdAlreadyPresent'),
                    icon: 'pi pi-exclamation-triangle',
                    accept: () => this.loadSelectedThreshold(event)
                })
            }
        },
        loadSelectedThreshold(event) {
            this.thresholdToClone = []
            let url = ''
            this.kpi.id ? (url = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/kpi/${event.value.id}/loadThreshold?kpiId=${this.selectedKpi.id}`) : (url = import.meta.env.VITE_KNOWAGE_CONTEXT + `/restful-services/1.0/kpi/${event.value.id}/loadThreshold`)

            return this.$http.get(url).then((response: AxiosResponse<any>) => {
                this.thresholdToClone = { ...response.data }
                this.thresholdToClone.usedByKpi ? (this.overrideDialogVisible = true) : this.cloneSelectedThreshold()
            })
        },
        cloneSelectedThreshold(operation?) {
            if (this.thresholdToClone.usedByKpi) {
                if (operation === 'clone') {
                    this.thresholdToClone.name += ' (' + this.$t('kpi.kpiDefinition.clone') + ')'
                    this.thresholdToClone.id = undefined
                    this.thresholdToClone.usedByKpi = false
                } else if (operation === 'use') {
                    this.thresholdToClone.usedByKpi = true
                }
            }
            this.kpi.threshold = this.thresholdToClone
            this.threshold = this.kpi.threshold
            this.thresholdListVisible = false
            this.overrideDialogVisible = false
        },
        cloneExistingThreshold() {
            this.kpi.threshold.name += ' (' + this.$t('kpi.kpiDefinition.clone') + ')'
            this.kpi.threshold.id = undefined
            this.kpi.threshold.usedByKpi = false
        }
    }
})
</script>
<style lang="scss">
// vdeep not working correctly,need to find a working solution for the thresholds list padding...
.mySidebar.p-sidebar .p-sidebar-header,
.mySidebar.p-sidebar .p-sidebar-content {
    padding: 0 !important;
}
.mySidebar .p-listbox {
    height: calc(100% - 2.5rem);
}

.row-dragging {
    opacity: 0.5;
    background-color: #e3f2fd;
}

.threshold-table tbody tr {
    cursor: move;
}
</style>
