<template>
    <q-card flat bordered class="dataset-detail-card">
        <div class="dataset-grid">
            <div class="dataset-grid__row dataset-grid__row--header kn-editor-card-label">
                <div>{{ $t('common.parameter') }}</div>
                <div>{{ $t('common.type') }}</div>
                <div>{{ $t('common.value') }}</div>
                <div></div>
            </div>
            <div v-for="(parameter, index) of selectedDataset.parameters" :key="index" class="dataset-grid__row" data-test="parameter-row">
                <q-input :model-value="parameter.name" readonly outlined dense hide-bottom-space class="kn-field-compact">
                    <q-tooltip :delay="500">{{ parameter.name }}</q-tooltip>
                </q-input>
                <q-select v-model="parameter.modelType" :options="parameterTypes" emit-value map-options outlined dense hide-bottom-space options-dense class="kn-field-compact" @update:model-value="onParameterTypeChange(parameter)" />
                <q-select
                    v-if="parameter.modelType === 'static' && parameter.multiValue"
                    :model-value="getChipValues(parameter)"
                    multiple
                    use-chips
                    use-input
                    new-value-mode="add-unique"
                    hide-dropdown-icon
                    input-debounce="0"
                    outlined
                    dense
                    hide-bottom-space
                    class="kn-field-compact dataset-grid__chips"
                    @update:model-value="parameter.value = $event ?? []"
                    @input-value="typedValue = $event"
                    @blur="addTypedValue(parameter)"
                />
                <q-input v-else v-model="parameter.value" outlined dense hide-bottom-space class="kn-field-compact" />
                <div class="dataset-grid__actions">
                    <q-btn v-if="parameter.modelType === 'dynamic' && documentDriversProp && documentDriversProp.filterStatus.length > 0" flat round dense size="sm" icon="link" class="kn-editor-action" data-test="driver-link-button">
                        <q-tooltip :delay="500">{{ $t('common.driver') }}</q-tooltip>
                        <q-menu>
                            <q-list dense style="min-width: 160px" data-test="menu">
                                <q-item v-for="driver in documentDriversProp.filterStatus" :key="driver.urlName" v-close-popup clickable @click="addDriverValueToParameter(driver.urlName, parameter.name)">
                                    <q-item-section>{{ driver.label }}</q-item-section>
                                </q-item>
                            </q-list>
                        </q-menu>
                    </q-btn>
                </div>
            </div>
        </div>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'dataset-editor-data-detail-parameters',
    props: { selectedDatasetProp: { required: true, type: Object }, documentDriversProp: { type: Object as any } },
    data() {
        return {
            selectedDataset: {} as any,
            typedValue: ''
        }
    },
    computed: {
        parameterTypes(): { label: string; value: string }[] {
            return [
                { label: this.$t('dashboard.datasetEditor.static'), value: 'static' },
                { label: this.$t('dashboard.datasetEditor.dynamic'), value: 'dynamic' }
            ]
        }
    },
    watch: {
        selectedDatasetProp() {
            this.selectedDataset = this.selectedDatasetProp
            this.initParameterDefaults()
        }
    },
    created() {
        this.selectedDataset = this.selectedDatasetProp
        this.initParameterDefaults()
    },
    methods: {
        initParameterDefaults() {
            this.selectedDataset?.parameters?.forEach((parameter: any) => {
                if (!parameter.modelType) parameter.modelType = 'static'
                if (parameter.value === undefined || parameter.value === null) parameter.value = parameter.defaultValue ?? ''
            })
        },
        addDriverValueToParameter(driverUrl, paramName) {
            this.selectedDataset.parameters.find((parameter) => parameter.name === paramName).value = '$P{' + driverUrl + '}'
        },
        onParameterTypeChange(parameter: any) {
            if (parameter.multiValue) parameter.value = parameter.modelType === 'static' ? [] : ''
        },
        // The PrimeVue Chips added the typed text on blur; q-select drops it unless it is added here
        addTypedValue(parameter: any) {
            const typed = this.typedValue.trim()
            this.typedValue = ''
            if (!typed) return
            const values = this.getChipValues(parameter)
            if (!values.includes(typed)) parameter.value = [...values, typed]
        },
        // A static multivalue parameter can still hold the '' default; show it as no chips
        getChipValues(parameter: any): string[] {
            if (Array.isArray(parameter.value)) return parameter.value
            return parameter.value ? [parameter.value] : []
        }
    }
})
</script>

<style lang="scss">
// Grid rows shared by the parameter and driver cards: the header and the rows use the same columns
.dataset-grid {
    &__row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 140px minmax(0, 1.5fr) 72px;
        gap: 8px;
        align-items: center;
        min-height: 44px;
        padding: 6px 12px;

        &:not(:last-child) {
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
        }

        &:not(.dataset-grid__row--header):hover {
            background-color: var(--kn-editor-row-hover-background);
        }

        &--header {
            min-height: 0;
            padding-top: 8px;
            padding-bottom: 4px;
        }

        // White fields, so the row hover does not make them look disabled (same as the widget editor column tables)
        .q-field--outlined .q-field__control {
            background-color: var(--kn-editor-panel-background);
        }
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
    }

    // Chip fields keep the 32 px height of the other fields: one line of small chips, the rest is cut
    &__chips {
        .q-field__native {
            flex-wrap: nowrap;
            overflow: hidden;
        }

        .q-chip {
            flex-shrink: 0;
            height: 22px;
            margin: 0 4px 0 0;
            font-size: 12px;
        }
    }
}
</style>
