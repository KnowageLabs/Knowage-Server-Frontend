<template>
    <div class="row items-center doc-breadcrumb">
        <q-btn flat dense round icon="home" size="xs" color="grey-3" @click="selectAt(0)" />
        <template v-for="(item, i) in items" :key="item.label">
            <q-icon name="chevron_right" size="xs" color="grey-5" />
            <span class="cursor-pointer q-px-xs text-subtitle2" :class="i === items.length - 1 ? 'text-white text-weight-medium' : 'text-grey-4'" :data-test="'breadcrumb-' + item.label" @click="selectAt(i)">{{ item.label }}</span>
        </template>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'document-browser-breadcrumb',
    props: { breadcrumbs: { type: Array } },
    emits: ['breadcrumbClicked'],
    data() {
        return { items: [] as any[] }
    },
    watch: {
        breadcrumbs() {
            this.items = this.breadcrumbs as any[]
        }
    },
    created() {
        this.items = this.breadcrumbs as any[]
    },
    methods: {
        selectAt(index: number) {
            if (index < this.items.length) {
                this.$emit('breadcrumbClicked', this.items[index])
                this.items.splice(index + 1)
            }
        }
    }
})
</script>
