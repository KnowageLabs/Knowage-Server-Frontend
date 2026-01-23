<template>
    <div v-if="paginatorStyleModel" class="q-pa-md">
        <div class="row q-col-gutter-sm">
            <!-- Pagination Mode -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.tableWidget.paginationMode') }}</label>

            <div class="col-12">
                <q-btn-toggle v-model="paginatorStyleModel.input" :options="descriptor.paginatorModeOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="onPaginatorChange" />
            </div>

            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.tableWidget.generalConfig') }}</label>

            <div class="col-12">
                <q-btn-toggle v-model="paginatorStyleModel['justify-content']" :options="descriptor.justifyContentOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-12">
                <q-input v-model.number="paginatorStyleModel.maxPages" type="number" :label="$t('dashboard.tableWidget.maxPages')" :min="1" dense outlined @update:model-value="onPaginatorChange" />
            </div>

            <!-- Container Style -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.tableWidget.containerStyle') }}</label>

            <div class="col-6">
                <q-input v-model="paginatorStyleModel['background-color']" :label="$t('common.color')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="paginatorStyleModel['background-color']" format-model="hexa" @update:model-value="onPaginatorChange" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="paginatorStyleModel.containerPadding" :label="$t('dashboard.tableWidget.containerPadding')" placeholder="6px" dense outlined @update:model-value="onPaginatorChange" />
            </div>

            <!-- Design Variants -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.tableWidget.designVariants') }}</label>

            <div class="col-12">
                <q-btn-toggle v-model="paginatorStyleModel.variant" :options="descriptor.variantOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-4">
                <q-checkbox v-model="paginatorStyleModel.round" :label="$t('dashboard.tableWidget.round')" @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-4">
                <q-checkbox v-model="paginatorStyleModel.ripple" :label="$t('dashboard.tableWidget.rippleEffect')" @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-4">
                <q-checkbox v-model="paginatorStyleModel.boundaryLinks" :label="$t('dashboard.tableWidget.boundaryLinks')" @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-4">
                <q-checkbox v-model="paginatorStyleModel.directionLinks" :label="$t('dashboard.tableWidget.directionLinks')" @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-4">
                <q-checkbox v-model="paginatorStyleModel.boundaryNumbers" :label="$t('dashboard.tableWidget.boundaryNumbers')" @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-4">
                <q-checkbox v-model="paginatorStyleModel.ellipses" :label="$t('dashboard.tableWidget.ellipses')" @update:model-value="onPaginatorChange" />
            </div>

            <!-- Button Colors -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.tableWidget.buttonColors') }}</label>

            <div class="col-6">
                <q-input v-model="paginatorStyleModel.buttonColor" :label="$t('dashboard.tableWidget.buttonBackground')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="paginatorStyleModel.buttonColor" format-model="hexa" @update:model-value="onPaginatorChange" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="paginatorStyleModel.buttonTextColor" :label="$t('dashboard.tableWidget.buttonText')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="paginatorStyleModel.buttonTextColor" format-model="hexa" @update:model-value="onPaginatorChange" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="paginatorStyleModel.activeButtonColor" :label="$t('dashboard.tableWidget.activeBackground')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="paginatorStyleModel.activeButtonColor" format-model="hexa" @update:model-value="onPaginatorChange" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="paginatorStyleModel.activeButtonTextColor" :label="$t('dashboard.tableWidget.activeText')" dense outlined>
                    <template #append>
                        <q-icon name="colorize" class="cursor-pointer">
                            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-color v-model="paginatorStyleModel.activeButtonTextColor" format-model="hexa" @update:model-value="onPaginatorChange" />
                            </q-popup-proxy>
                        </q-icon>
                    </template>
                </q-input>
            </div>

            <!-- Pagination Text -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.tableWidget.paginationText') }}</label>
            <div class="col-auto">
                <q-btn-toggle v-model="paginatorStyleModel.paginationTextPosition" :options="descriptor.paginationTextPositionOptions" color="secondary" toggle-color="primary" unelevated @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-auto">
                <q-checkbox v-model="paginatorStyleModel.paginationTextSpaced" :label="$t('dashboard.tableWidget.paginationTextSpaced')" @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-12">
                <q-input v-model="paginatorStyleModel.paginationText" :label="$t('dashboard.tableWidget.paginationText')" :hint="`${$t('dashboard.tableWidget.paginationTextHint')}#{currentPage}, #{totalPages}, #{startItem}, #{endItem}, #{totalItems}, #{itemsPerPage}`" placeholder="#{startItem}-#{endItem}/#{totalItems}" dense outlined @update:model-value="onPaginatorChange" />
            </div>

            <!-- Spacing & Size -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.tableWidget.spacingAndSize') }}</label>

            <div class="col-4">
                <q-input v-model="paginatorStyleModel.gutter" :label="$t('dashboard.tableWidget.gutter')" placeholder="xs, sm, md, lg, xl" dense outlined @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-4">
                <q-input v-model="paginatorStyleModel.padding" :label="$t('common.padding')" placeholder="xs, sm, md, lg, xl" dense outlined @update:model-value="onPaginatorChange" />
            </div>
            <div class="col-4">
                <q-input v-model="paginatorStyleModel.size" :label="$t('dashboard.tableWidget.size')" placeholder="xs, sm, md, lg, xl" dense outlined @update:model-value="onPaginatorChange" />
            </div>

            <!-- Custom Icons -->
            <label class="kn-material-input-label section-label col-12">{{ $t('dashboard.tableWidget.customIcons') }}</label>

            <div class="col-6">
                <q-input v-model="paginatorStyleModel.iconFirst" :label="$t('dashboard.tableWidget.firstPageIcon')" placeholder="first_page" dense outlined @update:model-value="onPaginatorChange">
                    <template #prepend>
                        <q-icon v-if="paginatorStyleModel.iconFirst" :name="paginatorStyleModel.iconFirst" />
                    </template>
                    <template #append>
                        <q-icon name="search" class="cursor-pointer" @click.stop="openIconPicker('iconFirst')" />
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="paginatorStyleModel.iconPrev" :label="$t('dashboard.tableWidget.previousIcon')" placeholder="chevron_left" dense outlined @update:model-value="onPaginatorChange">
                    <template #prepend>
                        <q-icon v-if="paginatorStyleModel.iconPrev" :name="paginatorStyleModel.iconPrev" />
                    </template>
                    <template #append>
                        <q-icon name="search" class="cursor-pointer" @click.stop="openIconPicker('iconPrev')" />
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="paginatorStyleModel.iconNext" :label="$t('dashboard.tableWidget.nextIcon')" placeholder="chevron_right" dense outlined @update:model-value="onPaginatorChange">
                    <template #prepend>
                        <q-icon v-if="paginatorStyleModel.iconNext" :name="paginatorStyleModel.iconNext" />
                    </template>
                    <template #append>
                        <q-icon name="search" class="cursor-pointer" @click.stop="openIconPicker('iconNext')" />
                    </template>
                </q-input>
            </div>
            <div class="col-6">
                <q-input v-model="paginatorStyleModel.iconLast" :label="$t('dashboard.tableWidget.lastPageIcon')" placeholder="last_page" dense outlined @update:model-value="onPaginatorChange">
                    <template #prepend>
                        <q-icon v-if="paginatorStyleModel.iconLast" :name="paginatorStyleModel.iconLast" />
                    </template>
                    <template #append>
                        <q-icon name="search" class="cursor-pointer" @click.stop="openIconPicker('iconLast')" />
                    </template>
                </q-input>
            </div>
        </div>

        <!-- Icon Picker Dialog -->
        <WidgetEditorStyleIconPickerDialog v-if="iconPickerVisible" :prop-model="currentIconModel" used-from="pagination" @close="iconPickerVisible = false" @save="onIconSelected" />
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { ITableWidgetPaginatorStyle, IWidget, IIcon } from '@/modules/documentExecution/dashboard/Dashboard'
import { emitter } from '@/modules/documentExecution/dashboard/DashboardHelpers'
import WidgetEditorStyleIconPickerDialog from '../../common/styleToolbar/WidgetEditorStyleIconPickerDialog.vue'
import descriptor from './TableWidgetStyleDescriptor.json'

export default defineComponent({
    name: 'table-widget-paginator',
    components: { WidgetEditorStyleIconPickerDialog },
    props: { widgetModel: { type: Object as PropType<IWidget | null>, required: true }, themeStyle: { type: Object as PropType<ITableWidgetPaginatorStyle | null>, required: true } },
    emits: ['styleChanged'],
    data() {
        return {
            descriptor,
            paginatorStyleModel: null as ITableWidgetPaginatorStyle | null,
            iconPickerVisible: false,
            currentIconKey: '' as string,
            currentIconModel: { className: '' } as any
        }
    },
    watch: {
        'paginatorStyleModel.variant': {
            handler() {
                this.paginatorStyleChanged()
            }
        }
    },
    mounted() {
        this.setEventListeners()
        this.loadPaginatorStyleModel()
        this.initializeVariant()
    },
    unmounted() {
        this.removeEventListeners()
    },
    methods: {
        setEventListeners() {
            emitter.on('themeSelected', this.loadPaginatorStyleModel)
        },
        removeEventListeners() {
            emitter.off('themeSelected', this.loadPaginatorStyleModel)
        },
        loadPaginatorStyleModel() {
            if (this.widgetModel?.settings?.style?.paginator) this.paginatorStyleModel = this.widgetModel.settings.style.paginator
            else if (this.themeStyle) this.paginatorStyleModel = this.themeStyle
            this.initializeVariant()
        },
        initializeVariant() {
            if (!this.paginatorStyleModel) return

            if (!this.paginatorStyleModel.variant) {
                if (this.paginatorStyleModel['outline']) {
                    this.paginatorStyleModel.variant = 'outline'
                } else if (this.paginatorStyleModel['unelevated']) {
                    this.paginatorStyleModel.variant = 'unelevated'
                } else {
                    this.paginatorStyleModel.variant = 'flat'
                }
            }
        },
        openIconPicker(iconKey: string) {
            this.currentIconKey = iconKey
            this.currentIconModel = { className: this.paginatorStyleModel?.[iconKey] || '' }
            this.iconPickerVisible = true
        },
        onIconSelected(icon: IIcon) {
            if (!this.paginatorStyleModel) return
            this.paginatorStyleModel[this.currentIconKey] = icon.className
            this.iconPickerVisible = false
            this.paginatorStyleChanged()
        },
        onPaginatorChange() {
            this.paginatorStyleChanged()
        },
        paginatorStyleChanged() {
            if (this.widgetModel) this.$emit('styleChanged')
        }
    }
})
</script>

<style lang="scss" scoped>
.section-label {
    font-weight: bold;
    margin-top: 12px;
}
</style>
