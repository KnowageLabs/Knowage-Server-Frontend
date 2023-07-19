<template>
    <div v-if="widgetStyle" class="p-ai-center kn-flex p-p-4">
        <div class="p-col-12 p-md-6 p-d-flex p-flex-column p-pb-3">
            <label class="kn-material-input-label p-mr-2">{{ $t('dashboard.widgetEditor.widgetTheme') }}</label>
            <Dropdown v-model="widgetStyle.themeName" class="kn-material-input" :options="themes" @change="onThemeSelected"> </Dropdown>
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
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true } },
    data() {
        return {
            widgetStyle: null as any,
            themes: [] as any[]
        }
    },
    computed: {},
    created() {
        this.loadThemes()
    },
    methods: {
        loadThemes() {
            // TODO
            this.themes = ['THEME 1', 'THEME 2']
        },
        onThemeSelected(themeName: string) {
            console.log('----------- THEME SELECTED: ', themeName)
        }
    }
})
</script>

<style lang="scss" scoped></style>
