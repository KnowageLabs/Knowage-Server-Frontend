<template>
    <div class="kn-page">
        <Toolbar class="kn-toolbar kn-toolbar--secondary p-m-0">
            <template #start> Data preparation </template>
            <template #end>
                <KnFabButton icon="fas fa-plus" data-test="new-button" @click="showForm"></KnFabButton>
            </template>
        </Toolbar>
        <ProgressBar v-if="loading" mode="indeterminate" class="kn-progress-bar" />

        <div class="kn-page-content managerDetail p-grid p-m-0 p-fluid">
            <Card v-for="(item, index) in dataPreparation" :key="index" class="p-col-2 p-m-1 p-p-0">
                <template #content>
                    <div class="p-col-5 d-flex flex-row mb-3">
                        <img src="https://i.imgur.com/ccMhxvC.png" width="50" />
                    </div>
                    <div class="p-col-7">
                        <h3>{{ item.label }}</h3>
                    </div>

                    <div class="p-col-12 p-m-0 p-p-0 kn-flex">
                        <p>{{ item.description }}</p>
                    </div>
                    <div class="p-col-12 p-m-0 p-p-0 p-d-flex p-jc-end">
                        <Button v-tooltip.bottom="$t('common.search')" icon="pi pi-search" class="p-button-text p-button-rounded p-button-plain" @click="search($event, item)" />

                        <Button v-tooltip.bottom="$t('common.filter')" icon="pi pi-filter" class="p-button-text p-button-rounded p-button-plain" @click="filter($event)" />
                    </div>
                </template>
            </Card>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { AxiosResponse } from 'axios'
import KnFabButton from '@/components/UI/KnFabButton.vue'
import DataPreparationDescriptor from './DataPreparationDescriptor.json'

export default defineComponent({
    name: 'data-preparation',
    components: { KnFabButton },
    props: {
        visibility: Boolean
    },

    emits: ['update:visibility'],
    data() {
        return { descriptor: DataPreparationDescriptor, dataPreparation: Array<any>() }
    },
    created() {
        this.$http.get(import.meta.env.VITE_KNOWAGE_CONTEXT + '/restful-services/3.0/datasets/mydata/').then((response: AxiosResponse<any>) => (this.dataPreparation = response.data.root))
    },
    methods: {
        search(e, item): void {
            console.log(e)
            this.$router.push({ name: 'data-preparation-detail', params: { id: item.label } })
        },
        filter(e): void {
            console.log(e)
        }
    }
})
</script>

<style lang="scss" scoped>
.image {
    position: relative;
}
.imageH2 {
    position: absolute;
    top: 10px;
    left: 0;
    width: 100%;
}
</style>
