<template>
    <div class="associations-list">
        <div class="row items-center no-wrap q-pa-sm">
            <q-input v-model="search" outlined dense clearable hide-bottom-space :placeholder="$t('common.search')" class="col kn-field-compact" data-test="association-search">
                <template #prepend>
                    <q-icon name="search" size="16px" />
                </template>
            </q-input>
            <q-btn unelevated dense no-caps color="primary" icon="add" :label="$t('common.add')" class="kn-editor-add-button q-ml-sm q-px-sm" data-test="add-association-button" @click="$emit('createNewAssociation')">
                <q-tooltip :delay="500">{{ $t('dashboard.datasetEditor.addAssociation') }}</q-tooltip>
            </q-btn>
        </div>
        <q-separator />
        <WidgetEditorDrawerList :searchable="false" :items="filteredAssociations" item-key="id" :active-key="selectedAssociationProp?.id ?? null" @item-click="(association) => $emit('associationSelected', association)">
            <template #leading="{ item }">
                <q-icon v-if="item.fields.length < 2" name="error" size="14px" class="associations-list__error" data-test="association-error-icon" />
                <q-icon v-else name="link" size="14px" class="associations-list__icon" />
            </template>
            <template #label="{ item }">
                <span data-test="association-list-item">
                    {{ getSummary(item) }}
                    <q-tooltip :delay="500">{{ getSummary(item) }}</q-tooltip>
                </span>
            </template>
            <template #trailing="{ item }">
                <q-btn flat round dense size="sm" icon="delete" class="kn-editor-action" data-test="delete-association-button" @click.stop="confirmDelete(item)">
                    <q-tooltip :delay="500">{{ $t('common.delete') }}</q-tooltip>
                </q-btn>
            </template>
        </WidgetEditorDrawerList>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IAssociation } from '../../../Dashboard'
import WidgetEditorDrawerList from '../../../widget/WidgetEditor/common/WidgetEditorDrawerList.vue'
import { getAssociationSummary } from '../DatasetEditorAssociationsHelper'

export default defineComponent({
    name: 'dataset-editor-associations-list',
    components: { WidgetEditorDrawerList },
    props: { dashboardAssociationsProp: { required: true, type: Array as PropType<IAssociation[]> }, selectedAssociationProp: { type: Object as PropType<IAssociation | null>, default: null }, selectedDatasetsProp: { required: true, type: Array as any } },
    emits: ['createNewAssociation', 'associationSelected', 'associationDeleted'],
    data() {
        return {
            search: '' as string | null
        }
    },
    computed: {
        filteredAssociations(): IAssociation[] {
            const search = (this.search ?? '').trim().toLowerCase()
            if (!search) return this.dashboardAssociationsProp
            return this.dashboardAssociationsProp.filter((association) => this.getSummary(association).toLowerCase().includes(search))
        }
    },
    methods: {
        getSummary(association: IAssociation): string {
            return getAssociationSummary(association, this.selectedDatasetsProp) || this.$t('dashboard.datasetEditor.newAssociation')
        },
        confirmDelete(association: IAssociation) {
            this.$q
                .dialog({
                    title: this.$t('common.toast.deleteConfirmTitle'),
                    message: this.$t('common.toast.deleteMessage'),
                    cancel: true,
                    persistent: true
                })
                .onOk(() => this.$emit('associationDeleted', association.id))
        }
    }
})
</script>

<style lang="scss" scoped>
.associations-list__icon {
    color: var(--kn-editor-list-icon-color);
}

.associations-list__error {
    color: var(--kn-color-error);
}
</style>
