<template>
    <div class="p-fluid p-m-4">
        <div>
            <span>
                <label for="dataSource" class="kn-material-input-label" aria-label="dropdown">{{ $t('managers.lovsManagement.dataSource') }} * </label>
                <Dropdown
                    id="dataSource"
                    v-model="query.datasource"
                    class="kn-material-input"
                    :class="{
                        'p-invalid': !query.datasource && dirty
                    }"
                    :options="datasources"
                    option-label="label"
                    option-value="label"
                    :placeholder="$t('managers.lovsManagement.placeholderDatasource')"
                    aria-label="dropdown"
                    @before-show="dirty = true"
                    @change="$emit('touched')"
                />
            </span>
            <div v-if="!query.datasource && dirty" class="p-error p-grid">
                <small class="p-col-12">
                    {{
                        $t('common.validation.required', {
                            fieldName: $t('managers.lovsManagement.dataSource')
                        })
                    }}
                </small>
            </div>
        </div>
        <div v-if="query.datasource" class="p-mt-4">
            <label class="kn-material-input-label">{{ $t('managers.lovsManagement.queryDefinition') }}</label>
            <knMonaco v-model="code" class="p-mt-2" style="height: 200px" language="sql" @keyup="onKeyUp"></knMonaco>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { iLov } from '../../../LovsManagement'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'
import Dropdown from 'primevue/dropdown'

export default defineComponent({
    name: 'lovs-management-query',
    components: { Dropdown, knMonaco },
    props: {
        selectedLov: { type: Object, required: true },
        selectedQuery: { type: Object },
        datasources: { type: Array },
        codeInput: { type: Object }
    },
    emits: ['touched'],
    data() {
        return {
            lov: {} as iLov,
            query: {} as any,
            code: '',
            dirty: false,
            cursorPosition: null
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
            this.loadSelectedQuery()
        },
        code(newCode) {
            this.query.query = newCode
        }
    },
    async created() {
        this.loadLov()
        this.loadSelectedQuery()
    },
    methods: {
        loadLov() {
            this.lov = this.selectedLov as iLov
        },
        loadSelectedQuery() {
            this.query = this.selectedQuery as any
            if (this.query) {
                this.code = this.query.query ?? ''
            }
        },
        onKeyUp() {
            this.$emit('touched')
        }
    }
})
</script>
