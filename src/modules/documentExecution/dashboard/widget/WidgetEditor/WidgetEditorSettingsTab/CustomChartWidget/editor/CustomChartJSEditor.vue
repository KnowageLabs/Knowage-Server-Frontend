<template>
    <div class="cssMirrorContainer" style="height: 500px; width: 100%">
        <knMonaco ref="editor" v-model="model.settings.editor.js" style="height: 500px" language="javascript" @editor-setup="editorSetup"></knMonaco>
    </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { IWidget } from '@/modules/documentExecution/Dashboard/Dashboard'
import knMonaco from '@/components/UI/KnMonaco/knMonaco.vue'

let editor,
    monaco = null

export default defineComponent({
    name: 'custom-chart-js-editor',
    components: { knMonaco },
    props: { widgetModel: { type: Object as PropType<IWidget>, required: true }, activeIndex: { type: Number, required: true } },
    data() {
        return {
            model: {} as IWidget,
            code: ''
        }
    },
    watch: {
        widgetModel() {
            this.loadModel()
        }
    },
    created() {
        this.loadModel()
    },
    methods: {
        loadModel() {
            this.model = this.widgetModel
        },
        editorSetup(monacoInstance) {
            monaco = monacoInstance.monaco
            editor = monacoInstance.editor
            const fact = `/** 
                         * datastore is the main API keyword for the custom chart usage.
                         * press ctrl + spacebar to see all available methods
                        */
                        declare class datastore {
                            /** 
                             * @param columnName
                             * The param should be a string representing the column name of the column which values will be returned.
                            */
                            static getColumn(columnName:string):[string]
                            /** 
                             * @param record
                             * The record param should be a method, returning a string or an object that will be iterated for each row of the datastore.
                            */
                            static getDataArray(record:any):[record]
                            /**
                             * Returns an array of objects; each object is composed by key:value where the key is the name of the column in the dataset
                             */
                            static getRecords() : [object]
                            /**
                             * @param columnName The name of the column that will be used as aggregation serie
                             * @param record The record param should be a method, returning a string or an object that will be iterated for each row of the datastore.
                             * 
                             */
                            static getSeriesAndData(columnName:string, record:any):[record]
                            /**
                             * @param sortOptions the column name to be ordered, ascending by default. Alternatively an object that contains datasets columns names the direction of the sorting (asc/desc). 
                             * (ie: {column:'asc'})
                             * 
                             */
                            static sort(sortOptions:string|object):datastore
                            /**
                             * @param filterOptions object that contains datasets columns names for properties and the value to be filtered. (ie: {column:'value'})
                             * @param strict Optional, if set to true will return just the items exactly corresponding to the selected filters
                             * 
                             */
                            static filter(filterOptions:object,strict?:boolean):datastore
                        }
`
            const factFilename = 'datastore'
            monaco.languages.typescript.javascriptDefaults.addExtraLib(fact, factFilename)
        }
    }
})
</script>
