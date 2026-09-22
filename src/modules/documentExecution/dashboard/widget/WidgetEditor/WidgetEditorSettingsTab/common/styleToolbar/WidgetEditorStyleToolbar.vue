<template>
    <div class="widget-editor-toolbar row items-center no-wrap justify-around">
        <div v-for="(option, index) in options" :key="index" class="widget-editor-toolbar-slot">
            <WidgetEditorStyleIcon :option="option" :prop-model="model" :disabled="disabled" @change="onChange" @openIconPicker="iconPickerDialogVisible = true"></WidgetEditorStyleIcon>
        </div>

        <WidgetEditorStyleIconPickerDialog v-if="iconPickerDialogVisible" :prop-model="model" @close="iconPickerDialogVisible = false" @save="onIconSelected"></WidgetEditorStyleIconPickerDialog>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidgetStyleToolbarModel, IIcon } from '@/modules/documentExecution/dashboard/Dashboard'
import WidgetEditorStyleIcon from './WidgetEditorStyleIcon.vue'
import WidgetEditorStyleIconPickerDialog from './WidgetEditorStyleIconPickerDialog.vue'

export default defineComponent({
    name: 'widget-editor-style-toolbar',
    components: { WidgetEditorStyleIcon, WidgetEditorStyleIconPickerDialog },
    props: { options: { type: Array as PropType<any[]>, required: true }, propModel: { type: Object as PropType<IWidgetStyleToolbarModel>, required: true }, disabled: { type: Boolean } },
    emits: ['change'],
    data() {
        return {
            model: null as IWidgetStyleToolbarModel | null,
            iconPickerDialogVisible: false
        }
    },
    watch: {
        propModel() {
            this.loadModel()
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = { ...this.propModel }
        },
        onChange() {
            this.$emit('change', this.model)
        },
        onIconSelected(icon: IIcon) {
            if (this.model) this.model.icon = icon.className
            this.iconPickerDialogVisible = false
            this.$emit('change', this.model)
        }
    }
})
</script>

<style lang="scss" scoped>
.widget-editor-toolbar {
    box-sizing: border-box;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    width: 100%;
    min-height: 44px;
    padding: 2px 6px;
    gap: 2px;
}

.widget-editor-toolbar-slot {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
