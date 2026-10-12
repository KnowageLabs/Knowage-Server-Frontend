<template>
    <div class="dataset-editor-tab row no-wrap">
        <aside class="dataset-editor-tab__list">
            <q-scroll-area class="fit">
                <AssociationsList :dashboard-associations-prop="dashboardAssociationsProp" :selected-association-prop="selectedAssociation" :selected-datasets-prop="selectedDatasets" @createNewAssociation="createNewAssociation" @associationDeleted="deleteAssociation" @associationSelected="associationSelected" />
            </q-scroll-area>
        </aside>
        <div class="dataset-editor-tab__content col kn-background">
            <q-scroll-area class="fit">
                <AssociationsDetail v-if="selectedAssociation" :dashboard-associations-prop="dashboardAssociationsProp" :selected-datasets-prop="selectedDatasets" :selected-association-prop="selectedAssociation" @fieldSelected="manageAssociationField" @fieldUnselected="unselectAssociationField" />
                <div v-else class="dataset-detail">
                    <KnHint :title="'dashboard.datasetEditor.associationsDetailTitle'" :hint="'dashboard.datasetEditor.associationsDetailMsg'"></KnHint>
                </div>
            </q-scroll-area>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IAssociation, IAssociationField } from '../../Dashboard'
import KnHint from '@/components/UI/KnHint.vue'
import AssociationsList from './DatasetEditorAssociationsList/DatasetEditorAssociationsList.vue'
import AssociationsDetail from './DatasetEditorAssociationsDetail/DatasetEditorAssociationsDetail.vue'

export default defineComponent({
    name: 'dataset-editor-associations',
    components: { AssociationsList, AssociationsDetail, KnHint },
    props: { selectedDatasetsProp: { required: true, type: Array as any }, dashboardAssociationsProp: { required: true, type: Array as PropType<IAssociation[]> }, selectedAssociationProp: { type: Object as PropType<IAssociation | null>, default: null } },
    emits: ['associationSelected'],
    data() {
        return {
            selectedAssociation: null as IAssociation | null,
            selectedDatasets: [] as any[],
            dashboardAssociations: [] as IAssociation[]
        }
    },
    watch: {
        selectedAssociationProp: {
            handler() {
                this.selectedAssociation = this.selectedAssociationProp as IAssociation
            },
            deep: true
        },
        dashboardAssociationsProp: {
            handler() {
                this.dashboardAssociations = this.dashboardAssociationsProp as IAssociation[]
            },
            deep: true
        },
        selectedDatasetsProp() {
            this.loadSelectedDatasets()
        }
    },
    created() {
        this.dashboardAssociations = this.dashboardAssociationsProp as IAssociation[]
        this.loadSelectedDatasets()
    },
    methods: {
        loadSelectedDatasets() {
            this.selectedDatasets = this.selectedDatasetsProp
        },
        createNewAssociation() {
            this.selectedAssociation = { fields: [], id: crypto.randomUUID() } as IAssociation
            this.dashboardAssociations.push(this.selectedAssociation)
            this.$emit('associationSelected', this.selectedAssociation)
        },
        associationSelected(associationToSelect) {
            this.selectedAssociation = associationToSelect as IAssociation
            this.$emit('associationSelected', associationToSelect)
        },
        deleteAssociation(associationId) {
            const index = this.dashboardAssociations.findIndex((association) => association.id === associationId)
            if (index !== -1) this.dashboardAssociations.splice(index, 1)
            if (this.selectedAssociation?.id === associationId) this.associationSelected(null)
        },
        // One field per dataset: a second pick in the same dataset replaces the first
        setAssociationField(association: IAssociation, selectedField: IAssociationField) {
            const fieldToEdit = association.fields.find((field) => selectedField.dataset === field.dataset)
            if (fieldToEdit) fieldToEdit.column = selectedField.column
            else association.fields.push(selectedField)
        },
        removeAssociationField(association: IAssociation, datasetId: number) {
            const fieldToUnselectIndex = association.fields.findIndex((field) => datasetId === field.dataset)
            if (fieldToUnselectIndex === -1) return
            association.fields.splice(fieldToUnselectIndex, 1)
        },
        manageAssociationField(selectedField: IAssociationField) {
            if (this.selectedAssociation) this.setAssociationField(this.selectedAssociation, selectedField)
        },
        unselectAssociationField(datasetId: number) {
            if (this.selectedAssociation) this.removeAssociationField(this.selectedAssociation, datasetId)
        }
    }
})
</script>
