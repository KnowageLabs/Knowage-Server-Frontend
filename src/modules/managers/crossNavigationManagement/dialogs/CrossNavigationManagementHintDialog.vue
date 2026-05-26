<template>
    <q-dialog :model-value="dialogVisible" persistent>
        <q-card style="min-width: 400px; max-width: 600px">
            <q-toolbar class="kn-toolbar kn-toolbar--primary">
                <q-toolbar-title>{{ title }}</q-toolbar-title>
            </q-toolbar>
            <q-card-section>
                {{ message }}
            </q-card-section>
            <q-card-actions align="right">
                <q-btn unelevated color="primary" :label="$t('common.close')" @click="$emit('close')" />
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'hint-dialog',
    props: {
        dialogVisible: { type: Boolean, default: false },
        title: { type: String, required: true },
        message: { type: String, required: true }
    },
    emits: ['close']
})
</script>
