<template>
    <div class="dashboard-editor-list-card-container p-m-3">
        <div class="dashboard-editor-list-card">
            <div class="p-d-flex p-m-2" :style="associationListDescriptor.style.buttonContainer">
                <Button :label="$t('dashboard.datasetEditor.addAssociation')" icon="pi pi-plus-circle" class="p-button-outlined kn-flex p-mr-1" @click="$emit('createNewAssociation')"></Button>
                <!--Button :label="$t('dashboard.datasetEditor.addIndexes')" icon="pi pi-plus-circle" class="p-button-outlined kn-flex" @click="$emit('addIndexesOnAssociations')"></Button-->
            </div>
            <Listbox
                v-model="selectedAssociation"
                class="kn-list kn-list-no-border-right dashboard-editor-list"
                :options="dashboardAssociationsProp"
                :filter="true"
                :filter-placeholder="$t('common.search')"
                option-label="label"
                filter-match-mode="contains"
                :filter-fields="['label']"
                :empty-filter-message="$t('common.info.noDataFound')"
                @change="selectAssociation"
            >
                <template #empty>{{ $t('common.info.noDataFound') }}</template>
                <template #option="slotProps">
                    <div v-tooltip.right="slotProps.option.fields.length" class="kn-list-item" :style="associationListDescriptor.style.list.listItem">
                        <i v-if="slotProps.option.fields.length === 0" class="fa-solid fa-circle-exclamation p-ml-1 details-warning-color" />
                        <!-- <div v-for="(field, index) of slotProps.option.fields" :key="index">
                            {{ field.column }}
                            <i class="fa-solid fa-arrows-left-right p-mr-1" v-if="index != slotProps.option.fields.length - 1" />
                        </div> -->
                        <span class="p-mx-2">{{ $t('dashboard.datasetEditor.association') }} - {{ slotProps.index }}</span>
                        <Button icon="far fa-trash-alt" class="p-button-text p-button-rounded p-button-plain p-ml-auto" @click.stop="deleteAssociation(slotProps.option.id)" />
                    </div>
                </template>
            </Listbox>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { IAssociation } from '../../../Dashboard'
import Listbox from 'primevue/listbox'
import dashStore from '../../../Dashboard.store'
import associationListDescriptor from './DatasetEditorAssociationsListDescriptor.json'

export default defineComponent({
    name: 'dataset-editor-data-list',
    components: { Listbox },
    props: { dashboardAssociationsProp: { required: true, type: Array as any }, selectedAssociationProp: { required: true, type: Object as any } },
    emits: ['createNewAssociation', 'associationSelected', 'associationDeleted', 'addIndexesOnAssociations'],
    setup() {
        const dashboardStore = dashStore()
        return { dashboardStore }
    },
    data() {
        return {
            associationListDescriptor,
            selectedAssociation: {} as IAssociation
        }
    },
    watch: {
        selectedAssociationProp() {
            this.selectedAssociation = this.selectedAssociationProp
        }
    },
    created() {},
    methods: {
        selectAssociation(event) {
            this.$emit('associationSelected', event.value)
        },
        deleteAssociation(associationId) {
            this.$emit('associationDeleted', associationId)
        }
    }
})
</script>
