<template>
    <q-card class="q-ma-sm">
        <q-toolbar class="kn-toolbar kn-toolbar--secondary">
            <q-toolbar-title>{{ title }}</q-toolbar-title>
        </q-toolbar>
        <q-card-section>
            <q-table flat dense hide-pagination :rows="categoryList" :columns="[{ name: 'categoryName', label: $t('common.name'), field: 'categoryName', align: 'left' }]" row-key="categoryId" selection="multiple" v-model:selected="selectedCategories" @update:selected="setDirty" />
        </q-card-section>
    </q-card>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iCategory } from './../../RolesManagement'

export default defineComponent({
    name: 'domain-category-tab',
    props: {
        title: String,
        categoryList: Array,
        selected: Array
    },
    emits: ['changed'],
    data() {
        return {
            selectedCategories: [] as iCategory[]
        }
    },
    watch: {
        selected() {
            this.selectedCategories = this.selected as iCategory[]
        }
    },
    created() {
        this.selectedCategories = this.selected as iCategory[]
    },
    methods: {
        setDirty() {
            this.$emit('changed', this.selectedCategories)
        },
        onSelectAll(event: any) {
            this.selectedCategories = event.data
            this.$emit('changed', this.selectedCategories)
        },
        onUnselectAll() {
            this.selectedCategories = []
            this.$emit('changed', this.selectedCategories)
        }
    }
})
</script>
<style lang="scss" scoped>
.domainCard {
    &:deep(.p-card-body) {
        height: calc(100% - 35px);
        .p-card-content {
            height: 100%;
            padding-bottom: 0;
            .p-paginator-bottom {
                border: none;
            }
        }
    }
}
</style>
