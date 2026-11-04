<template>
    <!-- One shell for the workspace dialogs: header and footer of the same height, each split from the body by a line.
         The dialog centers in the page area beside the main menu (workspace.scss, .kn-ws-dialog). -->
    <q-dialog :model-value="modelValue" :persistent="persistent" :class="['kn-ws-dialog', dialogClass]" @update:model-value="emit('update:modelValue', $event)" @show="emit('show')" @hide="emit('hide')">
        <q-card class="kn-ws-dialog__card column no-wrap" :class="'kn-ws-dialog__card--' + size" :data-ws-dialog="name">
            <div class="kn-ws-dialog__header row items-center no-wrap">
                <span class="kn-ws-dialog__title ellipsis">{{ title }}</span>
                <q-space />
                <slot name="header" />
            </div>
            <q-separator />
            <div class="kn-ws-dialog__body col">
                <slot />
            </div>
            <q-separator />
            <div class="kn-ws-dialog__footer row items-center no-wrap">
                <slot name="actions" />
            </div>
        </q-card>
    </q-dialog>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ modelValue: boolean; title: string; name?: string; size?: 'sm' | 'md' | 'lg'; persistent?: boolean; dialogClass?: string }>(), { name: undefined, size: 'sm', persistent: false, dialogClass: undefined })
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; show: []; hide: [] }>()
</script>
