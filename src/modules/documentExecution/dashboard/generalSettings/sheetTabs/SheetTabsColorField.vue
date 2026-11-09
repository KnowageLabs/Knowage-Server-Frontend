<template>
    <q-input :model-value="modelValue" :label="label" :placeholder="$t('dashboard.sheetTabs.fromLook')" outlined dense stack-label class="sheet-tabs-color" @update:model-value="onInput">
        <template #prepend>
            <!-- Empty: the color of the look (it may use the UI theme variables). -->
            <span class="sheet-tabs-color__swatch" :style="{ background: modelValue || lookColor }"></span>
        </template>
        <template #append>
            <span v-if="!modelValue" class="sheet-tabs-color__look">{{ $t('dashboard.sheetTabs.lookTag') }}</span>
            <q-btn v-else flat round dense size="sm" icon="restart_alt" class="sheet-tabs-color__reset" :aria-label="$t('dashboard.sheetTabs.backToLook')" @click.stop="emit('update:modelValue', '')">
                <q-tooltip :delay="400">{{ $t('dashboard.sheetTabs.backToLook') }}</q-tooltip>
            </q-btn>
            <q-icon name="colorize" size="18px" class="cursor-pointer sheet-tabs-color__picker">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-color :model-value="modelValue" format-model="hexa" @update:model-value="(value) => emit('update:modelValue', value ?? '')" />
                </q-popup-proxy>
            </q-icon>
        </template>
    </q-input>
</template>

<script setup lang="ts">
// A sheet tabs color. Empty = the color of the look, shown in the swatch with a "Look" tag.
defineProps<{ label: string; modelValue: string; lookColor: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

function onInput(value: string | number | null) {
    emit('update:modelValue', value == null ? '' : String(value).trim())
}
</script>

<style lang="scss" scoped>
.sheet-tabs-color {
    :deep(.q-field__native) {
        font-family: ui-monospace, 'SFMono-Regular', Consolas, monospace;
        font-size: 12.5px;
    }
    :deep(.q-field__native::placeholder) {
        font-family: Roboto, sans-serif;
        color: #8b949e;
        opacity: 1;
    }
}
.sheet-tabs-color__swatch {
    width: 18px;
    height: 18px;
    border: 1px solid rgba(0, 0, 0, 0.14);
    border-radius: 4px;
    background-clip: padding-box;
}
.sheet-tabs-color__look {
    margin-right: 6px;
    padding: 1px 6px;
    border-radius: 4px;
    background: #f1f2f4;
    color: #57606a;
    font-size: 10.5px;
    font-weight: 500;
}
.sheet-tabs-color__reset,
.sheet-tabs-color__picker {
    color: #8b949e;
}
</style>
