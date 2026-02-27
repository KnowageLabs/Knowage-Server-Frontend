<template>
    <div v-if="dateRangeStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <!-- Design Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.design') }}</label>

            <div class="col-12">
                <q-checkbox v-model="dateRangeStyleModel.dense" label="Dense" @update:model-value="styleChanged" />
            </div>

            <div class="col-12">
                <q-checkbox v-model="dateRangeStyleModel.darkMode" label="Dark Mode" @update:model-value="styleChanged" />
            </div>

            <!-- Coloring Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.color') }}</label>

            <div class="col-6">
                <q-input v-model="dateRangeStyleModel.color" type="text" :label="$t('common.color')" outlined dense placeholder="red, #ff0000ff, rgb(255,0,0)" @update:model-value="styleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="dateRangeStyleModel.color" format-model="hexa" @update:model-value="styleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="dateRangeStyleModel.bgColor" type="text" :label="$t('dashboard.widgetEditor.selectorWidget.dropdown.bgColor')" outlined dense placeholder="red, #ff0000ff, #ff000080" @update:model-value="styleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="dateRangeStyleModel.bgColor" format-model="hexa" @update:model-value="styleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/dashboard/Dashboard'
import { ISelectorWidgetDateRangeStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-date-range-style',
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Object as PropType<ISelectorWidgetDateRangeStyle | null>, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            dateRangeStyleModel: null as ISelectorWidgetDateRangeStyle | null
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadDateRangeStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadDateRangeStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadDateRangeStyleModel)
        },
        loadDateRangeStyleModel() {
            if (this.widgetModel?.settings?.style?.dateRange) {
                this.dateRangeStyleModel = this.widgetModel.settings.style.dateRange
            } else if (this.themeStyle) {
                this.dateRangeStyleModel = this.themeStyle
            }
        },
        styleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        }
    }
})
</script>

<style lang="scss" scoped>
.section-label {
    font-weight: bold;
    margin-top: 12px;
}
</style>
