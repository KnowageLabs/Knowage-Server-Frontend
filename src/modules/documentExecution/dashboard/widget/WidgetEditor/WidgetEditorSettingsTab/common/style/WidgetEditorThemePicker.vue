<template>
    <div v-if="widget?.settings?.style" class="p-grid p-p-4">
        <div class="p-col-12 p-d-flex p-flex-column p-pb-2">
            <label class="kn-material-input-label">{{ $t('dashboard.widgetEditor.widgetTheme') }}</label>
            <Dropdown v-model="widget.settings.style.selectedTheme" class="kn-material-input kn-full-width" :options="themes" @change="onThemeSelected"> </Dropdown>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/Dashboard/Dashboard'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'widget-editor-theme-picker',
    components: { Dropdown },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, styleChangedFlag: { type: Boolean, required: true } },
    data() {
        return {
            widget: null as IWidget | null,
            themes: [] as any[]
        }
    },
    computed: {},
    watch: {
        styleChangedFlag() {
            if (this.widget) this.widget.settings.style.selectedTheme = null
        }
    },
    created() {
        this.loadThemes()
        this.loadWidgetStyle()
    },
    methods: {
        loadThemes() {
            // TODO
            this.themes = ['THEME 1', 'THEME 2']
        },
        loadWidgetStyle() {
            this.widget = this.widgetModel
        },
        onThemeSelected(themeName: string) {
            console.log('----------- THEME SELECTED: ', themeName)
        }
    }
})
</script>

<style lang="scss" scoped></style>
