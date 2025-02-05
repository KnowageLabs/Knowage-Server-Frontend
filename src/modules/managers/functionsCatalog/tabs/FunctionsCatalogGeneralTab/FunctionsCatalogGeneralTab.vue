<template>
    <form v-if="selectedFunction" class="p-fluid p-ai-end p-formgrid p-grid p-m-2">
        <div class="p-field p-col-6 p-mb-6">
            <span class="p-float-label">
                <InputText id="name" v-model.trim="selectedFunction.name" class="kn-material-input" :disabled="readonly" />
                <label for="name" class="kn-material-input-label"> {{ $t('managers.functionsCatalog.functionName') }} </label>
                <small class="hint">{{ $t('managers.functionsCatalog.functionNameHint') }}</small>
            </span>
        </div>
        <div class="p-field p-col-6 p-mb-6">
            <span class="p-float-label">
                <InputText id="label " v-model.trim="selectedFunction.label" class="kn-material-input" :disabled="readonly" />
                <label for="label " class="kn-material-input-label"> {{ $t('common.label') }} </label>
                <small class="hint">{{ $t('managers.functionsCatalog.functionLabelHint') }}</small>
            </span>
        </div>
        <div class="p-field p-col-6 p-mb-6">
            <span class="p-float-label">
                <InputText id="owner " v-model.trim="selectedFunction.owner" class="kn-material-input" :disabled="true" />
                <label for="owner " class="kn-material-input-label"> {{ $t('common.owner') }} </label>
            </span>
        </div>
        <div class="p-field p-col-6 p-mb-6">
            <span>
                <label for="type" class="kn-material-input-label">{{ $t('common.type') }}</label>
                <Dropdown id="type" v-model="selectedFunction.type" class="kn-material-input" :options="functionTypes" option-label="valueCd" option-value="valueCd" :disabled="readonly" />
            </span>
        </div>
        <div class="p-field p-col-12 p-mb-12">
            <span>
                <label for="keywords" class="kn-material-input-label"> {{ $t('managers.functionsCatalog.keywords') }}</label>
                <Chips id="keywords" v-model="selectedFunction.tags" class="p-inputtext-sm" :multiple="true" :disabled="readonly" :placeholder="$t('managers.functionsCatalog.keywords')" />
            </span>
        </div>
        <div class="p-field p-col-12 p-mb-12">
            <Accordion>
                <AccordionTab :header="$t('common.description') + ' *'">
                    <q-editor ref="editordesc" id="description" class="q-ma-sm" v-model="selectedFunction.description" min-height="260px" :readonly="readonly" @update:model-value="() => (descriptionDirty = true)" />
                </AccordionTab>
            </Accordion>
            <div v-if="selectedFunction.description.length === 0 && descriptionDirty" class="p-error p-grid p-m-2">
                {{ $t('common.validation.required', { fieldName: $t('common.description') }) }}
            </div>
        </div>
        <div class="p-field p-col-12 p-mb-12">
            <Accordion>
                <AccordionTab :header="$t('managers.functionsCatalog.benchmarks')">
                    <q-editor ref="editor" id="benchmark" class="q-ma-sm" v-model="selectedFunction.benchmark" min-height="260px" :readonly="readonly" />
                </AccordionTab>
            </Accordion>
        </div>
    </form>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iFunction } from '../../FunctionsCatalog'
import Accordion from 'primevue/accordion'
import AccordionTab from 'primevue/accordiontab'
import Chips from 'primevue/chips'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'

export default defineComponent({
    name: 'function-catalog-general-tab',
    components: { Accordion, AccordionTab, Chips, Dropdown, Textarea },
    props: { propFunction: { type: Object }, readonly: { type: Boolean }, functionTypes: { type: Array }, propKeywords: { type: Array } },
    data() {
        return {
            selectedFunction: {} as iFunction,
            descriptionDirty: false,
            showDescriptionSource: false,
            showBenchmarksSource: false
        }
    },
    created() {
        this.loadFunction()
    },
    methods: {
        loadFunction() {
            this.selectedFunction = this.propFunction as iFunction
            if (this.selectedFunction.tags && this.selectedFunction.tags[0] === '') {
                this.selectedFunction.tags = []
            }
        }
    }
})
</script>

<style lang="scss" scoped>
.hint {
    color: gray;
    font-size: 0.8rem;
}

.editor-switch-button {
    max-width: 100px;
    background-color: grey;
}
</style>
