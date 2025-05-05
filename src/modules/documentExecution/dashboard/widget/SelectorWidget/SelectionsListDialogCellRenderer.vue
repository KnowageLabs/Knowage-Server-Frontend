<template>
    <div>
        <Button v-if="!params.isFinalUser" v-tooltip.left="$t('common.lock')" class="p-button-text p-button-rounded p-button-plain" :icon="isLocked ? 'fas fa-lock' : 'fas fa-lock-open'" :style="{ color: isLocked ? '#d32f2f' : '' }" @click.stop="toggleSelectionLock()" />
        <Button v-tooltip.left="$t('common.delete')" class="p-button-text p-button-rounded p-button-plain p-ml-auto" icon="fas fa-trash-alt" :style="{ 'pointer-events': isLocked ? 'none' : '' }" @click.stop="deleteSelection()" />
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import helpersDecriptor from '../WidgetEditor/helpers/tableWidget/TableWidgetHelpersDescriptor.json'

export default defineComponent({
    props: {
        params: {
            required: true,
            type: Object
        }
    },
    computed: {
        isLocked() {
            return this.params.node.data?.locked
        }
    },
    data() {
        return { helpersDecriptor }
    },
    created() {},
    methods: {
        deleteSelection() {
            this.params.context.componentParent.deleteSelection(this.params.node.data)
        },
        toggleSelectionLock() {
            this.params.context.componentParent.toggleSelectionLock(this.params.node.data)
        }
    }
})
</script>
