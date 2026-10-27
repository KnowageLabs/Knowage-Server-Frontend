<!-- eslint-disable vue/no-mutating-props -->
<template>
    <div class="row q-col-gutter-sm">
        <div class="col-6">
            <WidgetEditorColorPicker :initial-value="background.sheetsBackgroundColor" :label="'dashboard.generalSettings.background.sheetsColor'" @change="onColorChange" />
        </div>
        <div class="col-6">
            <slot name="beside-color"></slot>
        </div>
        <div class="col-6">
            <q-input v-model="background.imageBackgroundUrl" outlined dense :label="$t('dashboard.generalSettings.background.sheetsImage')" hide-bottom-space @update:model-value="emit('change')">
                <template #append>
                    <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                        <q-tooltip>{{ $t('dashboard.generalSettings.background.sheetsImageHint') }}</q-tooltip>
                    </q-icon>
                </template>
            </q-input>
        </div>
        <div class="col-6">
            <q-input v-model="background.imageBackgroundSize" outlined dense :label="$t('dashboard.generalSettings.background.sheetsSize')" hide-bottom-space @update:model-value="emit('change')">
                <template #append>
                    <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                        <q-tooltip>{{ $t('dashboard.generalSettings.background.sheetsSizeHint') }}</q-tooltip>
                    </q-icon>
                </template>
            </q-input>
        </div>
        <div class="col-12">
            <q-input v-model="background.sheetsBackgroundStyle" type="textarea" rows="2" outlined dense clearable :label="$t('dashboard.generalSettings.background.sheetsStyle')" hide-bottom-space @update:model-value="onStyleChange">
                <template #append>
                    <q-icon name="help_outline" size="xs" class="cursor-pointer text-grey-5">
                        <q-tooltip>{{ $t('dashboard.generalSettings.background.sheetsStyleHint') }}</q-tooltip>
                    </q-icon>
                </template>
            </q-input>
        </div>
    </div>
</template>

<script setup lang="ts">
import { IBackground } from '../../Dashboard'
import { IDashboardThemeBackground } from '@/modules/managers/dashboardThemeManagement/DashboardThememanagement'
import WidgetEditorColorPicker from '../../widget/WidgetEditor/WidgetEditorSettingsTab/common/WidgetEditorColorPicker.vue'

// The four sheet background fields. The dashboard background settings and the theme manager both use them.
// The form edits the object in place and emits `change` only for user input, never on mount.
const props = defineProps<{ background: IBackground | IDashboardThemeBackground }>()

const emit = defineEmits<{ (e: 'change'): void }>()

function onColorChange(color: string) {
    props.background.sheetsBackgroundColor = color
    emit('change')
}

// The clear button sets null; the renderer and the theme expect a string.
function onStyleChange(value: string | number | null) {
    props.background.sheetsBackgroundStyle = value == null ? '' : String(value)
    emit('change')
}
</script>
