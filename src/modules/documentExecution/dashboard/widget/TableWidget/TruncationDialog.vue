<template>
    <Dialog class="kn-dialog--toolbar--secondary selectionsDialog" :visible="visible" :header="$t('dashboard.truncateDialog')" :closable="false" modal :breakpoints="{ '960px': '75vw', '640px': '100vw' }">
        <div class="p-m-2 p-p-2 trunc-content">
            {{ cellContent }}
        </div>
        <template #footer>
            <Button class="kn-button kn-button--secondary p-mb-2" :label="$t('common.close')" @click="closeDialog" />
        </template>
    </Dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import Dialog from 'primevue/dialog'

export default defineComponent({
    name: 'datasets-catalog-datatable',
    components: { Dialog },
    props: {
        visible: { type: Boolean },
        cellContent: { type: String, required: true }
    },
    emits: ['close', 'save'],
    data() {
        return {}
    },
    computed: {},
    methods: {
        closeDialog() {
            this.$emit('close')
        }
    }
})
</script>

<style lang="scss">
.trunc-content {
    border: 1px solid #ccc;
    background-color: #efefef;
}
</style>
