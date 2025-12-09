<template>
    <q-dialog :model-value="visibility" persistent @hide="closeDialog">
        <q-card class="exportDialog">
            <q-card-section class="row items-center q-pb-none kn-toolbar">
                <div class="text-h6">{{ $t('common.export') }}</div>
            </q-card-section>
            <q-card-section>
                <q-input v-model="fileName" filled type="text" :label="$t('importExport.filenamePlaceholder')" maxlength="50" />
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat :label="$t('common.cancel')" @click="closeDialog" />
                <q-btn color="primary" unelevated :label="$t('common.export')" :disable="!fileName" @click="emitExport" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'export-menu-dialog',
    props: {
        visibility: Boolean
    },
    emits: ['update:visibility', 'export'],
    data() {
        return { fileName: '' }
    },
    methods: {
        closeDialog(): void {
            this.$emit('update:visibility', false)
        },
        emitExport(): void {
            this.$emit('export', this.fileName)
        }
    }
})
</script>
<style lang="scss">
.exportDialog {
    min-width: 320px;
    width: 90vw;
    max-width: 640px;
}
</style>
