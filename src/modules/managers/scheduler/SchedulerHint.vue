<template>
    <div class="col column no-wrap kn-background">
        <KnHint class="col" :title="'managers.scheduler.title'" :hint="'managers.scheduler.hint'" />
    </div>
</template>

<script setup lang="ts">
import KnHint from '@/components/UI/KnHint.vue'

defineOptions({ inheritAttrs: false })
</script>
