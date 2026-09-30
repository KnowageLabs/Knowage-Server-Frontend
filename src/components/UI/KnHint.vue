<template>
    <div ref="root" class="kn-hint hint">
        <div class="kn-hintContent">
            <div class="kn-hintIcon"><q-icon :name="resolvedIcon" /></div>
            <div class="kn-hintText">
                <h3>{{ $t(title) }}</h3>
                <p v-html="$t(hint)"></p>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCssVariable } from '@/composables/useCssVariable'

const DEFAULT_ICON = 'sym_o_lightbulb'

// The icon comes from the theme (Theme Management), unless a page passes its own.
const props = defineProps<{ title?: string; hint?: string; icon?: string }>()

const root = ref<HTMLElement | null>(null)
const themeIcon = useCssVariable(root, '--kn-hintcard-icon')
const resolvedIcon = computed(() => props.icon || themeIcon.value || DEFAULT_ICON)
</script>
