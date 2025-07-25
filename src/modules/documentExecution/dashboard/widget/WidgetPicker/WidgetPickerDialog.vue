<template>
    <div class="newWidgetContainer">
        <q-toolbar class="kn-toolbar kn-toolbar--primary">
            <q-toolbar-title>{{ $t('dashboard.widgetEditor.addWidget') }}</q-toolbar-title>

            <q-btn flat round dense icon="cancel" data-test="close-button" @click="$emit('closeWidgetPicker')">
                <q-tooltip :delay="500" class="text-capitalize">{{ $t('common.close') }}</q-tooltip>
            </q-btn>
        </q-toolbar>

        <q-input filled v-model="searchText" :label="$t('common.search')" class="q-pa-sm" learable data-test="search-input">
            <template #prepend>
                <q-icon name="search" />
            </template>
        </q-input>
        <div id="widget-card-container" class="q-pt-md row justify-center items-center">
            <WidgetCard v-for="(widget, index) in filteredWidgetTypes" :key="index" :widget="widget" data-test="list-item" @click="openWidgetEditor(widget)" />
        </div>
    </div>
</template>

<script lang="ts">
/**
 * ! this component is in charge of opening the correct widget editor and containing all the cards
 */
import { defineComponent } from 'vue'
import { IWidgetPickerType } from '../../Dashboard'
import { mapState } from 'pinia'
import appStore from '@/App.store'
import WidgetCard from './WidgetPickerCard.vue'
import descriptor from './WidgetPickerDescriptor.json'

export default defineComponent({
    name: 'widget-picker-dialog',
    components: { WidgetCard },
    inject: [],
    props: { visible: { type: Boolean } },
    emits: ['closeWidgetPicker', 'openNewWidgetEditor'],
    data() {
        return {
            descriptor,
            widgetTypes: [] as IWidgetPickerType[],
            searchText: ''
        }
    },
    computed: {
        ...mapState(appStore, {
            isEnterprise: 'isEnterprise',
            user: 'user'
        }),
        filteredWidgetTypes(): IWidgetPickerType[] {
            if (this.searchText) return this.widgetTypes.filter((i) => i.name.includes(this.searchText))
            else return this.widgetTypes
        }
    },
    created() {
        this.widgetTypes = descriptor.widgets.filter((item: any) => {
            if (item.functionality) {
                return this.user.functionalities.includes(item.functionality)
            }
            return item
        })
    },
    methods: {
        openWidgetEditor(widget) {
            if (widget.enterpriseOnly && !this.isEnterprise) return
            if (widget.type === 'chart') widget.type = this.isEnterprise ? 'highcharts' : 'chartJS'
            this.$emit('openNewWidgetEditor', widget)
        }
    }
})
</script>
<style lang="scss">
.newWidgetContainer {
    display: flex;
    flex-direction: column;
    width: 25%;
    max-width: 380px;
    position: absolute;
    right: 0;
    top: -35px;
    height: 100%;
    background-color: white;
    box-shadow: 2px 0 10px #ccc;

    &.v-enter-active,
    &.v-leave-active {
        transition: right 0.2s ease-in;
    }

    &.v-enter-from,
    &.v-leave-to {
        right: -380px;
    }
    #widget-card-container {
        flex: 1 0 0;
        overflow: auto;
        width: 100%;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-auto-rows: 120px;
        justify-items: start;
        align-items: start;
    }
}
.dialog-no-padding.p-dialog .p-dialog-header,
.dialog-no-padding.p-dialog .p-dialog-content {
    padding: 0;
    margin: 0;
}

@media screen and (max-width: 1200px) {
    .newWidgetContainer {
        width: 30%;
        max-width: 480px;
    }
}
@media screen and (max-width: 1000px) {
    .newWidgetContainer {
        #widget-card-container {
            grid-template-columns: repeat(2, 1fr);
            grid-auto-rows: 110px;
        }
    }
}
@media screen and (max-width: 700px) {
    .newWidgetContainer {
        width: 40%;
        max-width: 480px;
    }
}
</style>
