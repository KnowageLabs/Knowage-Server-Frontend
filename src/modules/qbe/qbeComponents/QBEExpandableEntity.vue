<template>
    <div v-for="(entity, index) in entities" :key="index" class="expandable-entities">
        <h4 class="entity-item-container" :style="{ 'border-left': `10px solid ${entity.color}` }" draggable="true" :data-test="'entity-container-' + entity.id" @dragstart="onDragStart($event, entity)">
            <i :class="getIconCls(entity.attributes.iconCls)" class="p-mx-2">
                <q-tooltip>{{ $t(`qbe.entities.types.${entity.attributes.iconCls}`) }}</q-tooltip>
            </i>
            <span class="kn-flex" :data-test="'expand-' + entity.id" @click="expandEntity(entity)">{{ entity.text }}</span>
            <span class="qbe-tooltip-wrapper">
                <Button icon="fas fa-info" class="p-button-text p-button-rounded p-button-plain" @click="$emit('showRelationDialog', entity)" />
                <q-tooltip>{{ $t('qbe.entities.relations') }}</q-tooltip>
            </span>
            <Button v-if="entity.expanded" icon="pi pi-chevron-up" class="p-button-text p-button-rounded p-button-plain" @click="entity.expanded = false" />
            <Button v-else icon="pi pi-chevron-down" class="p-button-text p-button-rounded p-button-plain" @click="entity.expanded = true" />
            <q-tooltip v-if="getTooltipText(entity)">
                <span v-html="getTooltipHtml(entity)"></span>
            </q-tooltip>
        </h4>
        <ul v-show="entity.expanded">
            <li v-for="(child, index) in entity.children" :key="index" :style="{ 'border-left': `5px solid ${child.color}` }" draggable="true" @click="$emit('entityChildClicked', child)" @dragstart="onDragStart($event, child)">
                <i :class="getIconCls(child.attributes.iconCls)" class="p-mx-2">
                    <q-tooltip>{{ $t(`qbe.entities.types.${child.attributes.iconCls}`) }}</q-tooltip>
                </i>
                <span :data-test="'entity-' + entity.id">{{ child.text }}</span>
                <Button icon="fas fa-filter" :class="{ 'qbe-active-filter-icon': fieldHasFilters(child) }" class="p-button-text p-button-rounded p-button-plain p-ml-auto" :data-test="'child-' + child.id" @click.stop="openFiltersDialog(child)" />
                <q-tooltip v-if="getTooltipText(child)">
                    <span v-html="getTooltipHtml(child)"></span>
                </q-tooltip>
            </li>
        </ul>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import sanitizeHtml from 'sanitize-html'
import { iQuery } from '../QBE'

export default defineComponent({
    name: 'expandable-entity',
    components: {},
    props: { availableEntities: { type: Array }, query: { type: Object as PropType<iQuery>, required: true } },
    emits: ['close', 'showRelationDialog', 'openFilterDialog', 'entityChildClicked'],
    data() {
        return {
            entities: [] as any,
            colors: ['#D7263D', '#F46036', '#2E294E', '#1B998B', '#C5D86D', '#3F51B5', '#8BC34A', '#009688', '#F44336']
        }
    },
    watch: {
        availableEntities() {
            this.entities = this.availableEntities
            this.setupEntities()
        }
    },
    created() {
        this.entities = this.availableEntities
        this.setupEntities()
    },
    methods: {
        expandEntity(entity) {
            entity.expanded = !entity.expanded
        },
        setupEntities() {
            let usedColorIndex = 0
            this.entities?.forEach((entity) => {
                if (!this.colors[usedColorIndex]) usedColorIndex = 0
                const color = this.colors[usedColorIndex]
                usedColorIndex++
                entity.color = color
                if (entity.children) {
                    entity.children.forEach((child) => {
                        child.color = color
                    })
                }
            })
        },

        getIconCls(iconCls) {
            switch (iconCls) {
                case 'measure':
                    return 'fas fa-ruler'
                case 'cube':
                    return 'fas fa-cube'
                case 'calculation':
                    return 'fas fa-calculator'
                case 'dimension':
                    return 'fas fa-ruler-horizontal'
                case 'geographic dimension':
                    return 'fas fa-map-marked-alt'
                case 'attribute':
                    return 'fas fa-font'
                case 'generic':
                    return 'fas fa-layer-group'
                case 'geographic_dimension':
                    return 'fas fa-globe'
                default:
                    return 'fas fa-cube'
            }
        },
        getTooltipText(item: any) {
            return item?.qtip || item?.attributes?.longDescription || item?.description || item?.text || ''
        },
        getTooltipHtml(item: any) {
            const tooltipText = this.getTooltipText(item)
            return sanitizeHtml(tooltipText, {
                allowedTags: ['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'ul', 'ol', 'li', 'span'],
                allowedAttributes: {
                    span: ['class']
                }
            })
        },
        onDragStart(event, entity) {
            event.dataTransfer.setData('text', JSON.stringify(entity))
            event.dataTransfer.dropEffect = 'move'
            event.dataTransfer.effectAllowed = 'move'
        },
        openFiltersDialog(field: any) {
            this.$emit('openFilterDialog', field)
        },
        fieldHasFilters(field: any) {
            for (let i = 0; i < this.query.filters?.length; i++) {
                const tempFilter = this.query.filters[i]
                if (tempFilter.leftOperandValue === field.id) {
                    return true
                }
            }
            return false
        }
    }
})
</script>
<style lang="scss">
.expandable-entities {
    ul {
        background-color: #eceff1;
        margin: 0;
        list-style: none;
        padding-left: 0;
        cursor: pointer;
        li {
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: flex-start;
            padding: 4px 0px 4px 20px;
            font-size: 0.8rem;
            border-bottom: 1px solid #cccccc;
            height: 24px;
            cursor: grab;
            button {
                margin: 0;
                padding: 0;
                width: 32px;
            }
            &:hover {
                background-color: color.adjust(#eceff1, $lightness: -10%);
            }
            i {
                cursor: help;
            }
            span {
                padding-left: 5px;
                flex: 1;
            }
        }
    }
    h4 {
        display: flex;
        background-color: #fff;
        flex-direction: row;
        align-items: center;
        justify-content: flex-start;
        height: 24px;
        line-height: 24px;
        margin: 0;
        padding: 4px 8px 4px 8px;
        font-size: 0.8rem;
        border-bottom: 1px solid #ccc;
        outline: none;
        cursor: grab;
        &:hover {
            background-color: color.adjust(#ffffff, $lightness: -15%);
        }
        button {
            cursor: pointer;
        }
        i {
            cursor: help;
        }
    }
}

.qbe-active-filter-icon {
    color: red !important;
}
</style>
