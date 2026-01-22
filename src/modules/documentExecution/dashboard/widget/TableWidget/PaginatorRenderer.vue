<template>
    <div :style="containerStyle">
        <q-pagination
            v-model="currentPage"
            class="custom-pagination"
            :max="maxPages"
            :max-pages="paginationConfig.maxPages"
            :input="paginationConfig.input"
            :outline="paginationConfig.outline"
            :unelevated="paginationConfig.unelevated"
            :round="paginationConfig.round"
            :icon-first="paginationConfig.iconFirst"
            :icon-last="paginationConfig.iconLast"
            :icon-prev="paginationConfig.iconPrev"
            :icon-next="paginationConfig.iconNext"
            :boundary-links="paginationConfig.boundaryLinks"
            :boundary-numbers="paginationConfig.boundaryNumbers"
            :direction-links="paginationConfig.directionLinks"
            :ellipses="paginationConfig.ellipses"
            :gutter="paginationConfig.gutter"
            :padding="paginationConfig.padding"
            :size="paginationConfig.size"
            :ripple="paginationConfig.ripple"
            @update:model-value="onPageChange"
        />
        <span v-if="paginationText" class="q-mx-sm p-ac-center pagination-text">{{ paginationText }}</span>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import Paginator from 'primevue/paginator'
import { ITableWidgetPagination } from '../../Dashboard'

export default defineComponent({
    components: {
        Paginator
    },
    props: {
        propWidget: { type: Object as any, required: true },
        propWidgetPagination: { type: Object as PropType<ITableWidgetPagination>, required: true }
    },
    emits: ['pageChanged'],
    data() {
        return {
            pagination: {} as any
        }
    },
    computed: {
        containerStyle() {
            const style = this.propWidget?.settings?.style?.paginator
            return {
                backgroundColor: style?.['background-color'] || 'rgba(83, 83, 83, 1)',
                justifyContent: style?.['justify-content'] || 'center',
                display: 'flex',
                padding: style?.containerPadding
            }
        },
        paginationConfig() {
            const style = this.propWidget?.settings?.style?.paginator
            const variant = style?.variant || 'flat'

            return {
                // Essential
                maxPages: style?.maxPages ?? 7,

                // Mode Selection (input vs buttons)
                input: style?.input ?? false,

                // Design Variants - derived from variant property
                outline: variant === 'outline',
                unelevated: variant === 'unelevated',
                round: style?.round ?? false,

                // Custom Icons
                iconFirst: style?.iconFirst || 'first_page',
                iconLast: style?.iconLast || 'last_page',
                iconPrev: style?.iconPrev || 'chevron_left',
                iconNext: style?.iconNext || 'chevron_right',

                // Navigation Options
                boundaryLinks: style?.boundaryLinks ?? true,
                boundaryNumbers: style?.boundaryNumbers ?? true,
                directionLinks: style?.directionLinks ?? true,
                ellipses: style?.ellipses ?? true,

                // Spacing & Size
                gutter: style?.gutter || 'sm',
                padding: style?.padding || undefined,
                size: style?.size || 'md',

                // Advanced
                ripple: style?.ripple ?? true
            }
        },
        buttonColor() {
            return this.propWidget?.settings?.style?.paginator?.buttonColor
        },
        buttonTextColor() {
            return this.propWidget?.settings?.style?.paginator?.buttonTextColor
        },
        activeButtonColor() {
            return this.propWidget?.settings?.style?.paginator?.activeButtonColor
        },
        activeButtonTextColor() {
            return this.propWidget?.settings?.style?.paginator?.activeButtonTextColor
        },
        maxPages() {
            if (!this.pagination?.properties?.itemsNumber || !this.pagination?.properties?.totalItems) return 1
            return Math.ceil(this.pagination.properties.totalItems / this.pagination.properties.itemsNumber)
        },
        currentPage: {
            get() {
                if (!this.pagination?.properties?.offset || !this.pagination?.properties?.itemsNumber) return 1
                return Math.floor(this.pagination.properties.offset / this.pagination.properties.itemsNumber) + 1
            },
            set(page: number) {
                if (this.pagination?.properties) {
                    this.pagination.properties.offset = (page - 1) * this.pagination.properties.itemsNumber
                }
            }
        },
        paginationText() {
            const showText = this.propWidget?.settings?.style?.paginator?.showPaginationText
            if (!showText) return ''

            const template = this.propWidget?.settings?.style?.paginator?.paginationText
            if (!template || template.trim() === '') return ''

            const offset = this.pagination?.properties?.offset || 0
            const itemsPerPage = this.pagination?.properties?.itemsNumber || 0
            const totalItems = this.pagination?.properties?.totalItems || 0

            const startItem = totalItems > 0 ? offset + 1 : 0
            const endItem = Math.min(offset + itemsPerPage, totalItems)

            return template
                .replace(/#{currentPage}/g, this.currentPage.toString())
                .replace(/#{totalPages}/g, this.maxPages.toString())
                .replace(/#{startItem}/g, startItem.toString())
                .replace(/#{endItem}/g, endItem.toString())
                .replace(/#{totalItems}/g, totalItems.toString())
                .replace(/#{itemsPerPage}/g, itemsPerPage.toString())
        }
    },
    watch: {
        propWidgetPagination() {
            this.pagination = this.propWidgetPagination
        }
    },
    created() {
        this.pagination = this.propWidgetPagination
    },
    methods: {
        onPage(event: any) {
            this.$emit('pageChanged', { paginationStart: event.first, paginationLimit: event.rows, paginationEnd: event.first + event.rows })
        },
        onPageChange(page: number) {
            this.pagination.properties.offset = (page - 1) * this.pagination.properties.itemsNumber

            const offset = this.pagination.properties.offset
            const limit = this.pagination.properties.itemsNumber
            this.$emit('pageChanged', { paginationStart: offset, paginationLimit: limit, paginationEnd: offset + limit })
        }
    }
})
</script>

<style lang="scss" scoped>
.custom-pagination {
    :deep(.q-btn) {
        &.q-btn--flat {
            color: v-bind(buttonTextColor) !important;
            &.q-btn--standard.bg-primary[aria-current='true'] {
                background-color: v-bind(activeButtonColor) !important;
                color: v-bind(activeButtonTextColor) !important;
            }
        }
        &.q-btn--outline {
            color: v-bind(buttonTextColor) !important;
            border-color: v-bind(buttonColor) !important;
            &.q-btn--standard.bg-primary[aria-current='true'] {
                background-color: v-bind(activeButtonColor) !important;
                border-color: v-bind(activeButtonColor) !important;
                color: v-bind(activeButtonTextColor) !important;
            }
        }
        &.q-btn--unelevated {
            &.bg-primary {
                &[aria-current='false'] {
                    background-color: v-bind(buttonColor) !important;
                    color: v-bind(buttonTextColor) !important;
                }
                &[aria-current='true'] {
                    background-color: v-bind(activeButtonColor) !important;
                    color: v-bind(activeButtonTextColor) !important;
                }
            }
        }
        &.q-btn--round {
            &[aria-current='false'] {
                background-color: v-bind(buttonColor) !important;
                color: v-bind(buttonTextColor) !important;
            }
            &.q-btn--standard.bg-primary[aria-current='true'] {
                background-color: v-bind(activeButtonColor) !important;
                color: v-bind(activeButtonTextColor) !important;
            }
        }
        &.q-btn--standard {
            &.bg-primary[aria-current='true'] {
                background-color: v-bind(activeButtonColor) !important;
                color: v-bind(activeButtonTextColor) !important;
            }
        }
        &:hover:not([aria-current='true']):not(.disabled) {
            opacity: 0.8;
        }
    }
    :deep(.q-field) {
        .q-field__control {
            color: v-bind(buttonTextColor) !important;
        }

        .q-field__native {
            color: v-bind(buttonTextColor) !important;
        }
    }
}

.pagination-text {
    color: v-bind(buttonTextColor);
}
</style>
