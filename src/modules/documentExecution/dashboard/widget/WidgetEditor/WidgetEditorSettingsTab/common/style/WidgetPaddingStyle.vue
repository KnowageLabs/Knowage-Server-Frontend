<template>
    <div v-if="paddingStyleModel" class="q-px-md q-pb-md kn-width-full">
        <div class="row q-col-gutter-sm items-center">
            <div v-if="themeStyle" class="col-12">
                <q-toggle v-model="paddingStyleModel.enabled" :label="$t('common.enabled')" @update:model-value="paddingStyleChanged" />
            </div>

            <div class="col-auto">
                <q-btn flat round dense :icon="paddingStyleModel.properties.unlinked ? 'link_off' : 'link'" :title="paddingStyleModel.properties.unlinked ? $t('dashboard.widgetEditor.padding.linkAllHint') : $t('dashboard.widgetEditor.padding.unlinkAllHint')" :disable="paddingStyleDisabled" @click="onLinkIconClicked" />
            </div>
            <div :class="paddingStyleModel.properties.unlinked ? 'col' : 'col'">
                <q-input v-model="paddingStyleModel.properties['padding-left']" outlined dense :label="paddingStyleModel.properties.unlinked ? $t('dashboard.widgetEditor.padding.paddingLeft') : $t('dashboard.widgetEditor.padding.title')" :placeholder="$t('dashboard.widgetEditor.inputHintForPixels')" hide-bottom-space :disable="paddingStyleDisabled" @update:model-value="onPaddingLeftInputChange" />
            </div>
            <div v-if="paddingStyleModel.properties.unlinked" class="col">
                <q-input v-model="paddingStyleModel.properties['padding-top']" outlined dense :label="$t('dashboard.widgetEditor.padding.paddingTop')" :placeholder="$t('dashboard.widgetEditor.inputHintForPixels')" hide-bottom-space :disable="paddingStyleDisabled" @change="paddingStyleChanged" />
            </div>
            <div v-if="paddingStyleModel.properties.unlinked" class="col">
                <q-input v-model="paddingStyleModel.properties['padding-right']" outlined dense :label="$t('dashboard.widgetEditor.padding.paddingRight')" :placeholder="$t('dashboard.widgetEditor.inputHintForPixels')" hide-bottom-space :disable="paddingStyleDisabled" @change="paddingStyleChanged" />
            </div>
            <div v-if="paddingStyleModel.properties.unlinked" class="col">
                <q-input v-model="paddingStyleModel.properties['padding-bottom']" outlined dense :label="$t('dashboard.widgetEditor.padding.paddingBottom')" :placeholder="$t('dashboard.widgetEditor.inputHintForPixels')" hide-bottom-space :disable="paddingStyleDisabled" @change="paddingStyleChanged" />
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget, IWidgetPaddingStyle } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'

export default defineComponent({
    name: 'widget-padding-style',
    components: {},
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<IWidgetPaddingStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            paddingStyleModel: null as IWidgetPaddingStyle | null
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
