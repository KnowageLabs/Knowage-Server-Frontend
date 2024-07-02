<template>
    <div class="kn-width-full">
        <knMonaco v-model="code" :options="{ readOnly: props.disabled }" style="height: 200px" language="javascript" @blur="$emit('blur')" @change="onKeyUp"></knMonaco>
    </div>
</template>

<script setup lang="ts">
import { toRef } from 'vue'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

const props = defineProps<{
    propCode?: string
    disabled: boolean
}>()

const emits = defineEmits<{
    (e: 'change', code: string | undefined): void
    (e: 'blur'): void
}>()

const code = toRef(props.propCode)

function onKeyUp() {
    emits('change', code.value)
}
</script>
