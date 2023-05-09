<template>
    <div class="p-field kn-flex p-m-2">
        <span>
            <label class="kn-material-input-label">{{ $t('common.language') }}</label>
            <Dropdown v-model="selectedFunction.language" class="kn-material-input" :options="functionsCatalogScriptTabDescriptor.languages" option-label="value" option-value="value" :disabled="readonly" />
        </span>
    </div>
    <div v-if="selectedFunction.language" class="p-mt-4">
        <div>
            <label class="kn-material-input-label">{{ $t('common.script') }}</label>
            <KnMonaco v-model="selectedFunction.onlineScript" class="p-mt-2 scriptEditor" :language="'python'" :options="functionsCatalogScriptTabDescriptor.options"></KnMonaco>
        </div>
    </div>
    <div v-if="selectedFunction.language && selectedFunction.family === 'offline'">
        <div class="p-mt-4">
            <label class="kn-material-input-label">{{ $t('managers.functionsCatalog.trainModel') }}</label>
            <KnMonaco v-model="selectedFunction.trainModelCode" class="p-mt-2 scriptEditor" :language="'python'" :options="functionsCatalogScriptTabDescriptor.options"></KnMonaco>
        </div>
        <div class="p-mt-4">
            <label class="kn-material-input-label">{{ $t('managers.functionsCatalog.useModel') }}</label>
            <KnMonaco v-model="selectedFunction.useModelCode" class="p-mt-2 scriptEditor" :language="'python'" :options="functionsCatalogScriptTabDescriptor.options"></KnMonaco>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iFunction } from '../../FunctionsCatalog'
import Dropdown from 'primevue/dropdown'
import functionsCatalogScriptTabDescriptor from './FunctionsCatalogScriptTabDescriptor.json'
import KnMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

export default defineComponent({
    name: 'function-catalog-script-tab',
    components: { Dropdown, KnMonaco },
    props: { propFunction: { type: Object }, readonly: { type: Boolean }, activeTab: { type: Number } },
    data() {
        return {
            functionsCatalogScriptTabDescriptor,
            selectedFunction: {} as iFunction,
            code: '',
            trainModelCode: '',
            useModelCode: '',
            codeMirror: {} as any,
            options: {
                mode: '',
                lineWrapping: true,
                theme: 'eclipse',
                lineNumbers: true,
                autoRefresh: true
            }
        }
    },
    watch: {
        activeTab(value: number) {
            if (value === 2 && this.codeMirror) setTimeout(() => this.codeMirror.refresh(), 100)
        }
    },
    created() {
        this.loadFunction()
    },
    methods: {
        loadFunction() {
            this.selectedFunction = this.propFunction as iFunction

            if (this.selectedFunction) {
                this.code = this.selectedFunction.onlineScript ?? ''
                this.trainModelCode = this.selectedFunction.trainModelCode ?? ''
                this.useModelCode = this.selectedFunction.useModelCode ?? ''
                this.options.mode = this.selectedFunction.language.toLowerCase()
            }
        }
    }
})
</script>

<style lang="scss">
.scriptEditor {
    min-height: 400px;
}
</style>
