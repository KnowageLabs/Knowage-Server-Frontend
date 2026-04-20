<template>
    <div class="kn-page-content p-d-flex p-flex-column p-ai-center p-jc-center" style="height: 100%">
        <i class="fas fa-home" style="font-size: 5rem; color: var(--kn-color-secondary); margin-bottom: 1rem" />
        <p>{{ $t('managers.homeManagement.hint') }}</p>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'home-management-hint'
})
</script>
