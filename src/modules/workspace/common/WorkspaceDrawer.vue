<template>
    <q-dialog :model-value="modelValue" position="right" full-height class="kn-ws-drawer" @update:model-value="emit('update:modelValue', $event)">
        <q-card class="kn-ws-drawer__card column no-wrap" data-ws="drawer">
            <slot />
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
// The frame of the details drawer (spec 9): a modal right dialog over the whole page, main menu included.
// Quasar gives the backdrop, Esc, the outside click and the focus. The layering classes are in workspace.scss.
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>
