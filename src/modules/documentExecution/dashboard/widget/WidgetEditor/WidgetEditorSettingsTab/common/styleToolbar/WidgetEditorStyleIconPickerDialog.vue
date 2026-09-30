<template>
    <KnIconPicker :current-icon="currentIcon" :sets="['fontawesome']" @close="$emit('close')" @save="$emit('save', $event)"></KnIconPicker>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidgetStyleToolbarModel } from '@/modules/documentExecution/dashboard/Dashboard'
import KnIconPicker from '@/components/UI/KnIconPicker/KnIconPicker.vue'

// The dashboard stores Font Awesome class names, so only that set is offered. Markers store the whole icon, the others a class name.
export default defineComponent({
    name: 'widget-editor-icon-picker-dialog',
    components: { KnIconPicker },
    props: { propModel: { type: Object as PropType<IWidgetStyleToolbarModel | any | null>, required: true }, usedFrom: { type: String, required: false, default: 'toolbar' } },
    emits: ['close', 'save'],
    computed: {
        currentIcon(): any {
            if (this.usedFrom === 'markers') return this.propModel
            return this.propModel?.icon
        }
    }
})
</script>
