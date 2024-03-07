<template>
    <div class="p-fluid p-m-4">
        <div>
            <span>
                <label for="language" class="kn-material-input-label" aria-label="dropdown">{{ $t('managers.lovsManagement.language') }} * </label>
                <Dropdown
                    id="language"
                    v-model="script.language"
                    class="kn-material-input"
                    :class="{
                        'p-invalid': !script.language && dirty
                    }"
                    :options="listOfScriptTypes"
                    option-label="VALUE_NM"
                    option-value="VALUE_CD"
                    :placeholder="$t('managers.lovsManagement.placeholderScript')"
                    aria-label="dropdown"
                    @before-show="dirty = true"
                    @change="onLanguageChanged($event.value)"
                />
            </span>
            <div v-if="!script.language && dirty" class="p-error p-grid">
                <small class="p-col-12">
                    {{
                        $t('common.validation.required', {
                            fieldName: $t('managers.lovsManagement.language')
                        })
                    }}
                </small>
            </div>
        </div>
        <div v-if="script.language" class="p-mt-4">
            <label class="kn-material-input-label">{{ $t('managers.lovsManagement.script') }}</label>
            <knMonaco v-if="script.language === 'ECMAScript'" v-model="code" class="p-mt-2" style="height: 200px" language="javascript" @keyup="onKeyUp"></knMonaco>
            <knMonaco v-else v-model="code" class="p-mt-2" style="height: 200px" language="groovy" @keyup="onKeyUp"></knMonaco>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iLov } from '../../../LovsManagement'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'lovs-management-script',
    components: { Dropdown, knMonaco },
    props: {
        selectedLov: { type: Object, required: true },
        selectedScript: { type: Object, required: true },
        listOfScriptTypes: { type: Array }
    },
    emits: ['touched'],
    data() {
        return {
            lov: {} as iLov,
            script: {} as any,
            code: '',
            dirty: false
        }
    },
    computed: {
        lovType(): string {
            return this.selectedLov.itypeCd
        }
    },
    watch: {
        selectedLov() {
            this.loadLov()
            this.loadSelectedScript()
        },
        code(newCode) {
            this.script.text = newCode
        }
    },
    created() {
        this.loadLov()
        this.loadSelectedScript()
    },
    methods: {
        loadLov() {
            this.lov = this.selectedLov as iLov
        },
        loadSelectedScript() {
            this.script = this.selectedScript as any

            if (this.script) {
                this.code = this.script.text ?? ''
            }
        },
        onKeyUp() {
            this.$emit('touched')
        }
    }
})
</script>
