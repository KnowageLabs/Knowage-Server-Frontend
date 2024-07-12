<template>
    <div v-if="paddingStyleModel" class="p-ai-center kn-flex p-p-4">
        <span v-if="themeStyle" class="p-d-flex p-flex-row p-ai-center p-mb-2"> {{ $t('common.enabled') }} <q-toggle v-model="paddingStyleModel.enabled" color="black" /> </span>

        <div class="p-d-flex p-flex-row">
            <i
                v-tooltip="paddingStyleModel.properties.unlinked ? $t('dashboard.widgetEditor.padding.linkAllHint') : $t('dashboard.widgetEditor.padding.unlinkAllHint')"
                :class="paddingStyleModel.properties.unlinked ? 'fa fa-link' : 'fa fa-unlink'"
                class="kn-cursor-pointer p-mr-2 p-mb-3 p-as-center"
                @click="onLinkIconClicked"
            />
            <form class="p-fluid p-formgrid p-grid kn-flex">
                <div :class="paddingStyleModel.properties.unlinked ? 'p-field p-col-12 p-md-6 p-lg-3' : 'p-field p-col-12'">
                    <span class="p-float-label">
                        <InputText v-model="paddingStyleModel.properties['padding-left']" v-tooltip.top="$t('dashboard.widgetEditor.inputHintForPixels')" class="kn-material-input p-inputtext-sm" :disabled="paddingStyleDisabled" @input="onPaddingLeftInputChange" />
                        <label class="kn-material-input-label p-mr-2">{{ paddingStyleModel.properties.unlinked ? $t('dashboard.widgetEditor.padding.paddingLeft') : $t('dashboard.widgetEditor.padding.title') }}</label>
                    </span>
                </div>
                <div v-if="paddingStyleModel.properties.unlinked" class="p-field p-col-12 p-md-6 p-lg-3">
                    <span class="p-float-label">
                        <InputText v-model="paddingStyleModel.properties['padding-top']" v-tooltip.top="$t('dashboard.widgetEditor.inputHintForPixels')" class="kn-material-input p-inputtext-sm" :disabled="paddingStyleDisabled" @change="paddingStyleChanged" />
                        <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.padding.paddingTop') }}</label>
                    </span>
                </div>
                <div v-if="paddingStyleModel.properties.unlinked" class="p-field p-col-12 p-md-6 p-lg-3">
                    <span class="p-float-label">
                        <InputText v-model="paddingStyleModel.properties['padding-right']" v-tooltip.top="$t('dashboard.widgetEditor.inputHintForPixels')" class="kn-material-input p-inputtext-sm" :disabled="paddingStyleDisabled" @change="paddingStyleChanged" />
                        <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.padding.paddingRight') }}</label>
                    </span>
                </div>
                <div v-if="paddingStyleModel.properties.unlinked" class="p-field p-col-12 p-md-6 p-lg-3">
                    <span class="p-float-label">
                        <InputText v-model="paddingStyleModel.properties['padding-bottom']" v-tooltip.top="$t('dashboard.widgetEditor.inputHintForPixels')" class="kn-material-input p-inputtext-sm" :disabled="paddingStyleDisabled" @change="paddingStyleChanged" />
                        <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.padding.paddingBottom') }}</label>
                    </span>
                </div>
            </form>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetPaddingStyle } from '@/modules/documentExecution/Dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'widget-padding-style',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<IWidgetPaddingStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            paddingStyleModel: null as IWidgetPaddingStyle | null,
            widgetType: '' as string
        }
    },
    computed: {
        paddingStyleDisabled() {
            return !this.paddingStyleModel || !this.paddingStyleModel.enabled
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadPaddingStyle()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadPaddingStyle)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadPaddingStyle)
        },
        loadPaddingStyle() {
            if (this.widgetModel?.settings?.style?.padding) this.paddingStyleModel = this.widgetModel.settings.style.padding
            else if (this.themeStyle) this.paddingStyleModel = this.themeStyle
        },
        paddingStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        },
        onLinkIconClicked() {
            if (!this.paddingStyleModel) return
            this.paddingStyleModel.properties.unlinked = !this.paddingStyleModel.properties.unlinked
            this.linkAllPaddingValues()
            this.paddingStyleChanged()
        },
        onPaddingLeftInputChange() {
            this.linkAllPaddingValues()
            this.paddingStyleChanged()
        },
        linkAllPaddingValues() {
            if (!this.paddingStyleModel) return
            if (!this.paddingStyleModel.properties.unlinked) {
                this.paddingStyleModel.properties['padding-top'] = this.paddingStyleModel.properties['padding-left']
                this.paddingStyleModel.properties['padding-right'] = this.paddingStyleModel.properties['padding-left']
                this.paddingStyleModel.properties['padding-bottom'] = this.paddingStyleModel.properties['padding-left']
            }
        }
    }
})
</script>

<style lang="scss" scoped>
#padding-left-container {
    max-width: 300px;
}
</style>
