<template>
    <router-view v-show="item" v-slot="{ Component }" :functionality-id="functionalityId" :item="loadedItem" :tab-key="key" @close="$emit('close', item)" @parametersChanged="onParametersChange" @iframeCreated="onIframeCreated" @closeIframe="$emit('closeIframe')" @closeDetails="$emit('close', item)" @documentSaved="$emit('documentSaved', $event)">
        <keep-alive>
            <component :is="Component" :key="key" :functionality-id="functionalityId" :item="loadedItem" :tab-key="key"></component>
        </keep-alive>
    </router-view>
</template>

<script lang="ts">
import { mapActions } from 'pinia'
import { defineComponent } from 'vue'
import mainStore from '@/App.store.js'

export default defineComponent({
    name: 'document-browser-tab',
    components: {},
    props: { item: { type: Object }, functionalityId: { type: String } },
    emits: ['close', 'iframeCreated', 'closeIframe', 'documentSaved'],
    data() {
        return {
            loadedItem: null as any
        }
    },
    computed: {
        key(): string {
            return this.item?.routerId
        }
    },
    watch: {
        item() {
            this.loadItem()
        }
    },
    created() {
        this.loadItem()
    },
    methods: {
        ...mapActions(mainStore, ['setDocumentExecutionParametersMap']),
        onIframeCreated(payload: any) {
            this.$emit('iframeCreated', payload)
        },
        onParametersChange(payload: any) {
            this.setDocumentExecutionParametersMap(payload.document.label + '-' + this.key, payload.parameters)
        },
        loadItem() {
            this.loadedItem = this.item
        }
    }
})
</script>
