<template>
    <q-card class="q-ma-sm">
        <q-card-section>
            <q-table v-if="fieldsMetadata" flat dense :columns="columns" :rows="fieldsMetadata" row-key="fieldAlias" :pagination="{ rowsPerPage: 0 }" hide-pagination class="metadataTable">
                <template v-slot:body-cell-fieldType="props">
                    <q-td :props="props">
                        <q-select dense borderless emit-value map-options v-model="props.row.fieldType" :options="fieldMetadataTypes" option-label="value" option-value="value" @update:model-value="saveFieldsMetadata('fieldType')" />
                    </q-td>
                </template>
                <template v-slot:body-cell-description="props">
                    <q-td :props="props">
                        <q-btn size="sm" :flat="!props.row.description || props.row.description == ''" round color="primary" icon="info" @click="openDescriptionDialog(props.rowIndex)">
                            <q-tooltip v-if="props.row.description && props.row.description !== ''" anchor="top middle" self="bottom middle" :offset="[0, 10]">
                                {{ props.row.description }}
                            </q-tooltip>
                        </q-btn>
                    </q-td>
                </template>
                <
            </q-table>
        </q-card-section>
    </q-card>
    <q-dialog v-model="descriptionDialog">
        <q-card style="min-width: 350px">
            <q-card-section>
                <div class="text-h6">{{ `${fieldsMetadata[rowIndex].fieldAlias} - ${$t('common.description')}` }}</div>
            </q-card-section>
            <q-card-section class="q-pt-none">
                <q-input filled v-if="fieldsMetadata[rowIndex]" :debounce="300" type="textarea" rows="3" v-model="fieldsMetadata[rowIndex].description" autofocus />
            </q-card-section>

            <q-card-actions align="right">
                <q-btn flat :label="$t('common.close')" v-close-popup />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import linkTabDescriptor from '@/modules/managers/datasetManagement/detailView/metadataCard/DatasetManagementMetadataCardDescriptor.json'
import mainStore from '../../../../App.store'
import { mapActions } from 'pinia'

export default defineComponent({
    props: { propMetadata: { type: Array as any } },
    emits: ['touched'],
    data() {
        return {
            linkTabDescriptor,
            fieldMetadataTypes: linkTabDescriptor.fieldsMetadataTypes,
            valueTypes: linkTabDescriptor.valueTypes,
            fieldsMetadata: [] as any,
            descriptionDialog: false as boolean,
            rowIndex: 0 as number,
            columns: [
                { name: 'fieldAlias', label: this.$t('managers.datasetManagement.fieldAlias'), align: 'left', field: 'fieldAlias', sortable: true },
                { name: 'type', label: this.$t('common.type'), align: 'left', field: 'Type', sortable: true, format: (val) => this.valueTypes.find((item) => item.name === val).value },
                { name: 'fieldType', label: this.$t('managers.datasetManagement.fieldType'), align: 'left', field: 'fieldType', sortable: true, style: 'width: 400px' },
                { name: 'description', label: this.$t('common.description'), align: 'center', field: 'description', style: 'width: 100px' }
            ] as any
        }
    },
    watch: {
        propMetadata: {
            handler() {
                this.fieldsMetadata = this.propMetadata
            },
            deep: true
        }
    },
    created() {
        this.fieldsMetadata = this.propMetadata
    },
    methods: {
        ...mapActions(mainStore, ['setInfo', 'setError']),
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
