<template>
    <div v-if="dateStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm">
            <!-- Design Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.widgetEditor.design') }}</label>

            <div class="col-12">
                <q-checkbox v-model="dateStyleModel.dense" label="Dense" @update:model-value="dateStyleChanged" />
            </div>

            <div class="col-12">
                <q-checkbox v-model="dateStyleModel.darkMode" label="Dark Mode" @update:model-value="dateStyleChanged" />
            </div>

            <!-- Coloring Section -->
            <label class="kn-material-input-label section-label col-12">{{ $t('common.color') }}</label>

            <div class="col-6">
                <q-input v-model="dateStyleModel.color" type="text" label="Text Color" outlined dense placeholder="red, #ff0000ff, rgb(255,0,0)" @update:model-value="dateStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="dateStyleModel.color" format-model="hexa" @update:model-value="dateStyleChanged" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <div class="col-6">
                <q-input v-model="dateStyleModel.bgColor" type="text" label="Background Color" outlined dense placeholder="red, #ff0000ff, #ff000080" @update:model-value="dateStyleChanged">
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="dateStyleModel.bgColor" format-model="hexa" @update:model-value="dateStyleChanged" />
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
import { ISelectorWidgetDateStyle } from '@/modules/documentExecution/dashboard/interfaces/DashboardSelectorWidget'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'selector-widget-date-style',
    props: {
        widgetModel: { type: Object as PropType<IWidget | null>, required: true },
        themeStyle: { type: Object as PropType<ISelectorWidgetDateStyle | null>, required: true }
    },
    emits: ['styleChanged'],
    data() {
        return {
            dateStyleModel: null as ISelectorWidgetDateStyle | null
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadDateStyleModel()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadDateStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadDateStyleModel)
        },
        loadDateStyleModel() {
            if (this.widgetModel?.settings?.style?.date) {
                this.dateStyleModel = this.widgetModel.settings.style.date
            } else if (this.themeStyle) {
                this.dateStyleModel = this.themeStyle
            }
        },
        dateStyleChanged() {
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
