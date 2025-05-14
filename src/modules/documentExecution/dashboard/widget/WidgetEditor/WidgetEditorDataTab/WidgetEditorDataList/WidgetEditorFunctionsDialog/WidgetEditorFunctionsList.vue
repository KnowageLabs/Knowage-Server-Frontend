<template>
    <div>
        <q-toolbar class="bg-primary text-white shadow-2">
            <q-toolbar-title>{{ $t('components.knCalculatedField.functions') }}</q-toolbar-title>
        </q-toolbar>

        <q-list id="widget-editor-functions-list" dense bordered separator>
            <q-item v-for="(functionItem, index) in propFunctions" :key="index" clickable v-close-popup :active="selectedId === functionItem.id" v-ripple class="cursor-pointer" active-class="bg-primary text-white" @click="selectFunction(functionItem)">
                <q-item-section>
                    <label>{{ functionItem.name }}</label>
                </q-item-section>
            </q-item>
        </q-list>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { iFunction } from '../../../../../../../managers/functionsCatalog/FunctionsCatalog'

export default defineComponent({
    name: 'widget-editor-functions-list',
    components: {},
    props: { propFunctions: { type: Array as PropType<iFunction[]>, required: true }, propSelectedFunction: { type: Object as PropType<iFunction | null> } },
    emits: ['selectedFunction'],
    data() {
        return {
            selectedId: null as string | null
        }
    },
    computed: {},
    watch: {
        propSelectedFunction() {
            this.loadPreselectedFunctionId()
        }
    },
    mounted() {
        this.loadPreselectedFunctionId()
    },
    methods: {
        loadPreselectedFunctionId() {
            this.selectedId = this.propSelectedFunction?.id ?? null
        },
        selectFunction(functionItem: iFunction) {
            this.selectedId = functionItem.id ?? null
            this.$emit('selectedFunction', functionItem)
        }
    }
})
</script>

<style lang="scss" scoped>
#widget-editor-functions-list {
    min-width: 100px;
}
</style>
