<template>
    <q-card class="q-ma-sm">
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>{{ $t('managers.datasetManagement.fieldsMetadata') }}</q-toolbar-title>
        </q-toolbar>
        <q-card-section>
            <q-table v-if="dataset.meta && (dataset.meta.ccolumns || dataset.meta.dataset)" flat dense :columns="columns" :rows="fieldsMetadata" row-key="fieldAlias" hide-pagination class="metadataTable">
                <template v-slot:body-cell-fieldType="props">
                    <q-td :props="props">
                        <q-select dense borderless v-model="props.row.fieldType" :options="fieldMetadataTypes" option-label="value" option-value="value" @update:model-value="saveFieldsMetadata('fieldType')" />
                    </q-td>
                </template>
                <template v-slot:body-cell-description="props">
                    <q-td :props="props">
                        <q-btn :flat="!props.row.description || props.row.description == ''" round color="primary" icon="info" @click="openDescriptionDialog(props.rowIndex)">
                            <q-tooltip v-if="props.row.description && props.row.description !== ''" anchor="top middle" self="bottom middle" :offset="[0, 10]">
                                {{ props.row.description }}
                            </q-tooltip>
                        </q-btn>
                    </q-td>
                </template>
                <template v-slot:body-cell-personal="props">
                    <q-td :props="props">
                        <q-checkbox size="xs" id="personal" v-model="props.row.personal" @update:model-value="saveFieldsMetadata('personal')" />
                    </q-td>
                </template>
                <template v-slot:body-cell-decrypt="props">
                    <q-td :props="props">
                        <q-checkbox size="xs" id="decrypt" v-model="props.row.decrypt" @update:model-value="saveFieldsMetadata('decrypt')" />
                    </q-td>
                </template>
                <template v-slot:body-cell-subjectId="props">
                    <q-td :props="props">
                        <q-checkbox size="xs" id="subjectId" v-model="props.row.subjectId" @update:model-value="saveFieldsMetadata('subjectId')" />
                    </q-td>
                </template>
            </q-table>
            <div v-if="!dataset.meta || dataset.meta.length == 0">
                <q-banner rounded dense class="bg-info col-6 text-center">
                    <template v-slot:avatar>
                        <q-icon name="info" />
                    </template>
                    {{ $t('managers.datasetManagement.metadataInfo') }}
                </q-banner>
            </div>
        </q-card-section>
    </q-card>
    <q-dialog v-model="descriptionDialog">
        <q-card style="min-width: 350px">
            <q-card-section>
                <div class="text-h6">{{ `${fieldsMetadata[rowIndex].fieldAlias} - ${$t('common.description')}` }}</div>
            </q-card-section>
            <q-card-section class="q-pt-none">
                <q-input filled v-if="fieldsMetadata[rowIndex]" type="textarea" rows="3" v-model="fieldsMetadata[rowIndex].description" autofocus />
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat :label="$t('common.close')" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import linkTabDescriptor from './DatasetManagementMetadataCardDescriptor.json'
import mainStore from '../../../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    props: {
        selectedDataset: { type: Object as any }
    },
    emits: ['touched'],
    data() {
        return {
            linkTabDescriptor,
            fieldMetadataTypes: linkTabDescriptor.fieldsMetadataTypes,
            valueTypes: linkTabDescriptor.valueTypes,
            dataset: {} as any,
            fieldsMetadata: [] as any,
            descriptionDialog: false as boolean,
            rowIndex: 0 as number,
            columns: [
                { name: 'fieldAlias', label: this.$t('managers.datasetManagement.fieldAlias'), align: 'left', field: 'fieldAlias', sortable: true },
                { name: 'type', label: this.$t('common.type'), align: 'left', field: 'Type', sortable: true, format: (val) => this.valueTypes.find((item) => item.name === val).value },
                { name: 'fieldType', label: this.$t('managers.datasetManagement.fieldType'), align: 'left', field: 'fieldType', sortable: true, style: 'width: 400px' },
                { name: 'description', label: this.$t('common.description'), align: 'center', field: 'description', style: 'width: 100px' },
                { name: 'personal', label: this.$t('managers.datasetManagement.personal'), align: 'center', field: 'fieldType', style: 'width: 100px' },
                { name: 'decrypt', label: this.$t('managers.datasetManagement.decrypt'), align: 'center', field: 'decrypt', style: 'width: 100px' },
                { name: 'subjectId', label: this.$t('managers.datasetManagement.subjectId'), align: 'center', field: 'subjectId', style: 'width: 100px' }
            ] as any
        }
    },
    watch: {
        selectedDataset() {
            this.dataset = this.selectedDataset
            this.dataset.meta ? this.exctractFieldsMetadata(this.dataset.meta.columns) : ''
        }
    },
    created() {
        this.dataset = this.selectedDataset
        this.dataset.meta ? this.exctractFieldsMetadata(this.dataset.meta.columns) : ''
    },

    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError']),
        exctractFieldsMetadata(array) {
            const object = {}

            for (const item in array) {
                let element = object[array[item].column]
                if (!element) {
                    element = {}
                    object[array[item].column] = element
                    element['column'] = array[item].column
                }
                element[array[item].pname] = array[item].pvalue
            }

            const fieldsMetadata = []

            for (const item in object) {
                fieldsMetadata.push(object[item])
            }

            this.fieldsMetadata = fieldsMetadata
        },
        saveFieldsMetadata(fieldName) {
            this.warnForDuplicateSpatialFields()
            this.applyMetadataChangesToFields(fieldName)
        },
        applyMetadataChangesToFields(fieldName) {
            for (let i = 0; i < this.fieldsMetadata.length; i++) {
                for (let j = 0; j < this.dataset.meta.columns.length; j++) {
                    if (this.fieldsMetadata[i].column == this.dataset.meta.columns[j].column && this.dataset.meta.columns[j].pname == fieldName) {
                        this.dataset.meta.columns[j].pvalue = this.fieldsMetadata[i][fieldName]
                    }
                }
            }
        },
        warnForDuplicateSpatialFields() {
            let numberOfSpatialAttribute = 0
            for (let i = 0; i < this.fieldsMetadata.length; i++) {
                if (this.fieldsMetadata[i].fieldType == 'SPATIAL_ATTRIBUTE') {
                    numberOfSpatialAttribute++
                    if (numberOfSpatialAttribute > 1) {
                        this.setError({ title: this.$t('common.error.saving'), msg: this.$t('managers.datasetManagement.duplicateSpatialAttribute') })
                        return
                    }
                }
            }
        },
        openDescriptionDialog(rowIndex) {
            this.rowIndex = rowIndex
            this.descriptionDialog = true
        }
    }
})
</script>
<style lang="scss">
.metadataTable {
    .q-field--auto-height.q-field--dense .q-field__control,
    .q-field--auto-height.q-field--dense .q-field__native {
        min-height: 30px;
        height: 30px;
    }
    .q-field--dense .q-field__control,
    .q-field--dense .q-field__marginal {
        min-height: 30px;
        height: 30px;
    }
}
</style>
