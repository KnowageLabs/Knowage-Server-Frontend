<template>
    <Dialog :visible="true" :modal="true" header="Add Quick Widget" class="p-fluid kn-dialog--toolbar--primary" :closable="false">
        <div class="p-grid gap-1 p-m-0 p-pt-4" style="column-gap: 0.5em; row-gap: 0.5em">
            <div v-for="(widgetType, index) in descriptor.quickWidgets" :key="index" v-tooltip.bottom="$t(widgetType.tooltip)" class="widgetTypeCards" :class="{ selected: selectedWidget === widgetType.name }" @click="selectWidget(widgetType.name)">
                <img :src="getImageSource(widgetType.name)" />
            </div>
        </div>

        <template #footer>
            <Button class="kn-button kn-button--secondary" :label="$t('common.close')" @click="$emit('close')"></Button>
            <Button class="kn-button kn-button--primary" :label="$t('common.save')" @click="onChartTypeSelected"></Button>
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Dialog from 'primevue/dialog'
import descriptor from './CommonComponentsDescriptor.json'

export default defineComponent({
    name: 'quick-widget-dialog',
    components: { Dialog },
    emits: ['close', 'chartTypeSelected'],
    setup() {},
    data() {
        return {
            descriptor,
            selectedWidget: ''
        }
    },
    computed: {},
    watch: {},
    created() {},
    mounted() {},
    methods: {
        selectWidget(widgetName: string) {
            this.selectedWidget = widgetName
        },
        getImageSource(widgetType: string) {
            return `${import.meta.env.VITE_PUBLIC_PATH}images/dashboard/quickWidgetTypes/${widgetType}.svg`
        },
        onChartTypeSelected() {
            this.$emit('chartTypeSelected', this.selectedWidget)
        }
    }
})
</script>
<style lang="scss">
.widgetTypeCards {
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    border: 1px solid #cccccc;
    height: 80px;
    width: 80px;
    &.selected {
        background-color: #bbd6ed;
    }
    &:hover {
        background-color: darken(#bbd6ed, 15%);
    }
    &:hover,
    &.selected {
        .visTypeIcon {
            background-color: #deecf8;
        }
    }
    img {
        height: 80%;
        width: 80%;
    }
}
</style>
