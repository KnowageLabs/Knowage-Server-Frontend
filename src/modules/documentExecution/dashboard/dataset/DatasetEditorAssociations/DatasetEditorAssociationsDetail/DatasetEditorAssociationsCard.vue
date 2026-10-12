<template>
    <q-card flat bordered class="associations-card column no-wrap" :class="{ 'associations-card--linked': !!selectedColumn }" data-test="associations-card">
        <q-card-section class="associations-card__header row items-center no-wrap q-py-xs">
            <div class="kn-editor-card-label col ellipsis">
                {{ datasetProp.label }}
                <q-tooltip :delay="500">{{ datasetProp.name }}</q-tooltip>
            </div>
            <span v-if="selectedColumn" class="associations-card__selected ellipsis">{{ selectedColumn }}</span>
        </q-card-section>
        <q-separator />
        <div class="associations-card__body">
            <WidgetEditorDrawerList :searchable="false" :items="columnRows" item-key="key" :active-key="selectedColumn" @item-click="onRowClick">
                <template #leading="{ item }">
                    <q-icon :name="item.fieldType === 'ATTRIBUTE' ? 'fas fa-font' : 'fas fa-hashtag'" size="12px" class="associations-card__icon" />
                </template>
                <template #label="{ item }">
                    <span data-test="association-field">
                        {{ item.key }}
                        <q-tooltip v-if="item.name && item.name !== item.key" :delay="500">{{ item.name }}</q-tooltip>
                    </span>
                </template>
                <template #trailing="{ item }">
                    <div class="associations-card__trailing">
                        <span v-if="getUsage(item.key).length > 0" class="associations-card__dot" data-test="association-used-dot">
                            <q-tooltip :delay="300">{{ $t('dashboard.datasetEditor.usedInAssociation') }}: {{ getUsage(item.key).join(' | ') }}</q-tooltip>
                        </span>
                        <span class="associations-card__type">{{ item.typeLabel }}</span>
                        <q-icon name="check" size="14px" class="associations-card__check" :class="{ 'associations-card__check--on': item.key === selectedColumn }" />
                    </div>
                </template>
            </WidgetEditorDrawerList>

            <template v-if="parameterRows.length > 0">
                <div class="kn-editor-card-label associations-card__section">{{ $t('common.parameters') }}</div>
                <WidgetEditorDrawerList :searchable="false" :items="parameterRows" item-key="key" :active-key="selectedColumn" @item-click="onRowClick">
                    <template #label="{ item }">
                        <span data-test="association-field">{{ item.key }}</span>
                    </template>
                    <template #trailing="{ item }">
                        <div class="associations-card__trailing">
                        <span v-if="getUsage(item.key).length > 0" class="associations-card__dot" data-test="association-used-dot">
                            <q-tooltip :delay="300">{{ $t('dashboard.datasetEditor.usedInAssociation') }}: {{ getUsage(item.key).join(' | ') }}</q-tooltip>
                        </span>
                        <span class="associations-card__type">{{ item.typeLabel }}</span>
                        <q-icon name="check" size="14px" class="associations-card__check" :class="{ 'associations-card__check--on': item.key === selectedColumn }" />
                    </div>
                    </template>
                </WidgetEditorDrawerList>
            </template>
        </div>
    </q-card>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IAssociation } from '../../../Dashboard'
import WidgetEditorDrawerList from '../../../widget/WidgetEditor/common/WidgetEditorDrawerList.vue'
import { getParameterColumn } from '../DatasetEditorAssociationsHelper'
import descriptor from './DatasetEditorAssociationsDescriptor.json'

export default defineComponent({
    name: 'dataset-editor-associations-card',
    components: { WidgetEditorDrawerList },
    props: {
        datasetProp: { required: true, type: Object as any },
        selectedAssociationProp: { required: true, type: Object as PropType<IAssociation> },
        fieldUsage: { type: Function as PropType<(datasetId: number, column: string) => string[]>, required: true }
    },
    emits: ['fieldSelected', 'fieldUnselected'],
    computed: {
        datasetId(): number {
            return this.datasetProp.id.dsId
        },
        columnRows(): { key: string; name: string; fieldType: string; typeLabel: string }[] {
            return (this.datasetProp.metadata?.fieldsMeta ?? []).map((field) => ({ key: field.alias, name: field.name, fieldType: field.fieldType, typeLabel: descriptor.datasetTypes[field.type] ?? '' }))
        },
        parameterRows(): { key: string; typeLabel: string }[] {
            return (this.datasetProp.parameters ?? []).map((parameter) => ({ key: getParameterColumn(parameter.name), typeLabel: parameter.type }))
        },
        // The field of this dataset in the selected association (one per dataset)
        selectedColumn(): string | null {
            return this.selectedAssociationProp?.fields.find((field) => field.dataset === this.datasetId)?.column ?? null
        }
    },
    methods: {
        onRowClick(row: { key: string }) {
            if (row.key === this.selectedColumn) this.$emit('fieldUnselected', this.datasetId)
            else this.$emit('fieldSelected', { column: row.key, dataset: this.datasetId })
        },
        getUsage(column: string): string[] {
            return this.fieldUsage(this.datasetId, column)
        }
    }
})
</script>

<style lang="scss" scoped>
.associations-card {
    // Cards flow in CSS columns (see the detail); a card never splits across two columns
    break-inside: avoid;
    margin-bottom: 12px;
    border-radius: 4px;

    &--linked {
        border-color: var(--kn-color-primary);
        box-shadow: 0 0 0 1px var(--kn-color-primary);
    }

    &__header {
        min-height: 40px;
    }

    &__selected {
        max-width: 50%;
        font-size: 12px;
        color: var(--kn-color-primary);
    }

    &__section {
        padding: 10px 12px 4px;
        border-bottom: 1px solid var(--kn-list-border-color);
    }

    &__icon {
        color: var(--kn-editor-list-icon-color);
    }

    &__trailing {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
        margin-left: 6px;
    }

    &__type {
        font-size: 11px;
        color: var(--kn-list-item-text-secondary-color);
    }

    &__dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: var(--kn-color-primary);
        opacity: 0.6;
    }

    &__check {
        visibility: hidden;
        color: var(--kn-color-primary);
    }

    &__check--on {
        visibility: visible;
    }
}
</style>
