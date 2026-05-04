<template>
    <div class="row q-col-gutter-sm">
        <div class="col-12">
            <q-input v-model="calc" outlined dense type="textarea" rows="4" maxlength="150" :label="$t('dashboard.widgetEditor.editorTags.calc')" @update:model-value="onColumnChanged" />
        </div>
        <div class="col-4">
            <q-input v-model="min" outlined dense :label="$t('common.min')" @update:model-value="onColumnChanged" />
        </div>
        <div class="col-4">
            <q-input v-model="max" outlined dense :label="$t('common.max')" @update:model-value="onColumnChanged" />
        </div>
        <div class="col-4">
            <q-input v-model="precision" outlined dense type="number" :label="$t('dashboard.widgetEditor.precision')" @update:model-value="onColumnChanged" />
        </div>
        <div class="col-12 row items-center">
            <q-toggle v-model="format" :label="$t('dashboard.widgetEditor.editorTags.toLocale')" dense @update:model-value="onColumnChanged" />
            <q-icon name="help_outline" class="q-ml-sm cursor-pointer text-grey-6">
                <q-tooltip>{{ $t('dashboard.widgetEditor.editorTags.hint.toLocale') }}</q-tooltip>
            </q-icon>
        </div>
    </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
    name: 'widget-editor-calculator',
    components: {},
    emits: ['insertChanged'],
    data() {
        return {
            calc: '',
            min: '',
            max: '',
            precision: null as any,
            format: false as boolean
        }
    },
    methods: {
        onColumnChanged() {
            let forInsert = `[kn-calc=(${this.calc}) min='${this.min}' max='${this.max}'`
            if (this.precision) forInsert += ` precision='${this.precision}`
            forInsert += `${this.format ? ' format' : ''}]`
            this.$emit('insertChanged', forInsert)
        }
    }
})
</script>
