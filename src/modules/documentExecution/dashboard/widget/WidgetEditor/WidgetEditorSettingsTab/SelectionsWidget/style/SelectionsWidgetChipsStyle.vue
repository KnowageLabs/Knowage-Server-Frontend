<template>
    <div v-if="chipsStyleModel" class="q-px-md q-pb-md">
        <div class="row q-col-gutter-sm q-pb-sm">
            <div class="col-12">
                <q-input v-model.number="chipsStyleModel.height" type="number" :label="$t('common.height')" outlined dense :disable="chipsStyleDisabled" @blur="chipsStyleChanged" />
            </div>
        </div>
        <WidgetEditorStyleToolbar :options="descriptor.chipsToolbarStyleOptions" :prop-model="chipsStyleModel.properties" :disabled="chipsStyleDisabled" @change="onStyleToolbarChange" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectionWidgetChipsStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectionsWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import descriptor from '../SelectionsWidgetSettingsDescriptor.json'
import WidgetEditorStyleToolbar from '../../common/styleToolbar/WidgetEditorStyleToolbar.vue'

export default defineComponent({
    name: 'selections-widget-chips-style',
    components: { WidgetEditorStyleToolbar },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ISelectionWidgetChipsStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            chipsStyleModel: null as ISelectionWidgetChipsStyle | null
        }
    },
    computed: {
        chipsStyleDisabled() {
            if (this.themeStyle) return false
            return !this.widgetModel || this.widgetModel.settings.configuration.type !== 'chips'
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadChipsStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadChipsStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadChipsStyleModel)
        },
        loadChipsStyleModel() {
            if (this.widgetModel?.settings?.style?.chips) this.chipsStyleModel = this.widgetModel.settings.style.chips
            else if (this.themeStyle) this.chipsStyleModel = this.themeStyle
        },
        chipsStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        },
        onStyleToolbarChange(model: IWidgetStyleToolbarModel) {
            if (!this.chipsStyleModel) return
            this.chipsStyleModel.properties['background-color'] = model['background-color'] ?? 'rgb(137, 158, 175)'
            this.chipsStyleModel.properties.color = model.color ?? 'rgb(255, 255, 255)'
            this.chipsStyleModel.properties['justify-content'] = model['justify-content'] ?? 'center'
            ;((this.chipsStyleModel.properties['font-size'] = model['font-size'] ?? '14px'), (this.chipsStyleModel.properties['font-family'] = model['font-family'] ?? ''), (this.chipsStyleModel.properties['font-style'] = model['font-style'] ?? 'normal'), (this.chipsStyleModel.properties['font-weight'] = model['font-weight'] ?? ''))
            this.chipsStyleChanged()
        }
    }
})
</script>
