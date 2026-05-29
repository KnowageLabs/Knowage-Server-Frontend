<template>
    <div v-if="model?.accessibility" class="q-px-md q-pb-lg">
        <div class="row q-mb-sm">
            <div class="col-12">
                <q-input v-model="model.accessibility.description" :label="$t('common.description')" type="textarea" outlined dense autogrow maxlength="250" :disable="accessibilityDisabled" @change="modelChanged" />
            </div>
        </div>
        <div class="row items-center q-mb-sm">
            <q-toggle v-model="model.accessibility.keyboardNavigation.enabled" :disable="accessibilityDisabled" :label="$t('dashboard.widgetEditor.accessibility.enabelKeyboardNavigation')" dense @update:model-value="modelChanged" />
        </div>
        <div class="row q-mb-sm">
            <div class="col-12">
                <q-select v-model="model.accessibility.keyboardNavigation.order" :label="$t('dashboard.widgetEditor.accessibility.keyboardNavigationOrder')" multiple use-chips emit-value map-options outlined dense :options="descriptor.keyboardNavigationOrderOptions" option-value="value" option-label="label" :disable="accessibilityDisabled" :hint="$t('dashboard.widgetEditor.accessibility.keyboardNavigationOrderHint')" @update:model-value="modelChanged">
                    <template #selected-item="slotProps">
                        <q-chip dense :label="getTranslatedLabel(slotProps.opt.value, descriptor.keyboardNavigationOrderOptions, $t)" />
                    </template>
                    <template #option="slotProps">
                        <q-item v-bind="slotProps.itemProps">
                            <q-item-section>
                                <q-item-label>{{ $t(slotProps.opt.label) }}</q-item-label>
                            </q-item-section>
                        </q-item>
                    </template>
                </q-select>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '../../../../../../Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import { getTranslatedLabel } from '@/helpers/commons/dropdownHelper'
import { IHighchartsChartModel } from '@/modules/documentExecution/dashboard/interfaces/highcharts/DashboardHighchartsWidget'
import descriptor from '../HighchartsWidgetSettingsDescriptor.json'

export default defineComponent({
    name: 'hihgcharts-accessibility-settings',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            descriptor,
            model: null as IHighchartsChartModel | null,
            getTranslatedLabel
        }
    },
    computed: {
        accessibilityDisabled(): boolean {
            return !this.model || !this.model.accessibility.enabled
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel.settings.chartModel ? this.widgetModel.settings.chartModel.model : null
        },
        modelChanged() {
            emitter.emit('refreshChart', this.widgetModel.id)
        }
    }
})
</script>

<style lang="scss" scoped>
.p-multiselect {
    width: 100%;
}

::v-deep(.multiselect-keyboardNavigation) {
    .p-multiselect-label:not(.p-placeholder) {
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
    }

    .option-item-value {
        padding: 0.25rem 0.5rem;
        border-radius: 3px;
        display: inline-flex;
        margin-right: 0.5rem;
        background-color: var(--primary-color);
        color: var(--primary-color-text);
    }
}
</style>
