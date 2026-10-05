import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { parse } from '@vue/compiler-sfc'
import { compileString } from 'sass'
import { isQbeGroup, prepareQbeEntities } from '@/helpers/commons/qbeHelpers'
import type { iQbeTreeNode, iQuery } from '../QBE'
import QBEExpandableEntity from '../qbeComponents/QBEExpandableEntity.vue'
import entitySource from '../qbeComponents/QBEExpandableEntity.vue?raw'

const node = (id: string, type = 'entity', children: iQbeTreeNode[] = []): iQbeTreeNode => ({
    id,
    text: id,
    iconCls: type === 'group' ? 'folder' : 'dimension',
    attributes: { type, iconCls: type === 'group' ? 'folder' : 'dimension' },
    children
})

const query: iQuery = { calendar: null, distinct: false, expression: null, fields: [], filters: [], graph: [], havings: [], id: 'query', isNestedExpression: false, name: 'Query', relationRoles: [], subqueries: [] }

const renderTree = (entities: iQbeTreeNode[]) =>
    mount(QBEExpandableEntity, {
        props: { availableEntities: entities, query },
        global: {
            mocks: { $t: (key: string) => key },
            directives: { tooltip: {} },
            stubs: { Button: { template: '<button><slot /></button>' } }
        }
    })

describe('QBE business domain tree', () => {
    it('recognizes the backend type contract and keeps group nodes out of query entities', () => {
        const field = node('field', 'field')
        const entity = node('entity', 'entity', [field])
        const unassigned = node('unassigned')
        const group = node('group', 'group', [node('nested', 'group', [entity])])

        const flattened = prepareQbeEntities([group, unassigned])

        expect(isQbeGroup(group)).toBe(true)
        expect(flattened).toEqual([entity, unassigned])
        expect(flattened[0]).toBe(entity)
        expect(flattened[0].children?.[0]).toBe(field)
        expect(group.expanded).toBe(false)
        expect(group.children?.[0].expanded).toBe(false)
        expect(entity.expanded).toBe(false)
    })

    it('preserves flat models, empty groups, and spatial fields inside groups', () => {
        const field = node('geometry', 'field')
        const spatial = node('spatial', 'entity', [field])
        spatial.iconCls = 'geographic_dimension'
        expect(prepareQbeEntities([node('empty', 'group'), node('domain', 'group', [spatial])])).toEqual([spatial])
        expect(field.isSpatial).toBe(true)
        const flat = node('flat')
        expect(prepareQbeEntities([flat])).toEqual([flat])
        expect(prepareQbeEntities([])).toEqual([])
    })

    it('expands real entities recursively and forwards field, filter, and relation events', async () => {
        const field = node('field', 'field')
        const entity = node('entity', 'entity', [field])
        const group = node('group', 'group', [entity])
        prepareQbeEntities([group])
        const wrapper = renderTree([group])

        expect(wrapper.find('[data-test="entity-container-entity"]').exists()).toBe(false)
        expect(wrapper.get('[data-test="entity-container-group"]').attributes('draggable')).toBe('false')
        await wrapper.get('[data-test="expand-group"]').trigger('click')
        expect(wrapper.get('[data-test="entity-container-entity"]').attributes('draggable')).toBe('true')
        await wrapper.get('[data-test="expand-entity"]').trigger('click')
        await wrapper.get('li').trigger('click')
        expect(wrapper.emitted('entityChildClicked')?.[0]).toEqual([field])
        await wrapper.get('[data-test="child-field"]').trigger('click')
        expect(wrapper.emitted('openFilterDialog')?.[0]).toEqual([field])
        await wrapper.get('[icon="fas fa-info"]').trigger('click')
        expect(wrapper.emitted('showRelationDialog')?.[0]).toEqual([entity])
        expect(wrapper.findAll('[icon="fas fa-info"]')).toHaveLength(1)
        wrapper.unmount()
    })

    it('does not recolor entities when opening or reopening a domain', async () => {
        const first = node('first', 'entity', [node('first-field', 'field')])
        const second = node('second', 'entity', [node('second-field', 'field')])
        const wrapper = renderTree([node('first-domain', 'group', [first]), node('second-domain', 'group', [second])])
        const originalColors = [first.color, second.color]
        expect(first.color).not.toBe(second.color)
        await wrapper.get('[data-test="expand-second-domain"]').trigger('click')
        expect([first.color, second.color]).toEqual(originalColors)
        expect(second.children?.[0].color).toBe(second.color)
        await wrapper.get('[data-test="expand-second-domain"]').trigger('click')
        await wrapper.get('[data-test="expand-second-domain"]').trigger('click')
        expect([first.color, second.color]).toEqual(originalColors)
        wrapper.unmount()
    })

    it('indents row contents at each level while keeping color bars at the left edge', async () => {
        const entity = node('entity', 'entity', [node('field', 'field')])
        const tree = [node('outer', 'group', [node('inner', 'group', [entity])]), node('unassigned')]
        prepareQbeEntities(tree)
        const wrapper = renderTree(tree)
        const style = document.createElement('style')
        const { descriptor } = parse(entitySource)
        style.textContent = compileString('@use "sass:color";\n' + descriptor.styles[0].content).css
        document.head.appendChild(style)
        try {
            await wrapper.get('[data-test="expand-outer"]').trigger('click')
            await wrapper.get('[data-test="expand-inner"]').trigger('click')
            await wrapper.get('[data-test="expand-entity"]').trigger('click')
            expect(wrapper.findAll('.entity-children')).toHaveLength(3)
            wrapper.findAll('.entity-children').forEach((children) => {
                expect(getComputedStyle(children.element).paddingLeft).toBe('0px')
            })
            const paddings = { outer: '8px', inner: '18px', entity: '28px', unassigned: '8px' }
            Object.entries(paddings).forEach(([id, padding]) => {
                const rowStyle = getComputedStyle(wrapper.get(`[data-test="entity-container-${id}"]`).element)
                expect(rowStyle.paddingLeft).toBe(padding)
                expect(rowStyle.borderLeftWidth).toBe('10px')
                expect(rowStyle.marginLeft).toBe('0px')
            })
            const fieldStyle = getComputedStyle(wrapper.get('li').element)
            expect(fieldStyle.paddingLeft).toBe('50px')
            expect(fieldStyle.borderLeftWidth).toBe('10px')
            expect(wrapper.get('[data-test="entity-container-unassigned"]').element.closest('.entity-children')).toBeNull()
            expect(wrapper.get('li').element.closest('ul.entity-children')).not.toBeNull()
        } finally {
            wrapper.unmount()
            style.remove()
        }
    })

    it('blocks group dragging but keeps the original entity payload', async () => {
        const entity = node('entity')
        const wrapper = renderTree([node('group', 'group', [entity])])
        const dataTransfer = { setData: vi.fn(), dropEffect: '', effectAllowed: '' }
        const groupEvent = new Event('dragstart', { cancelable: true })
        wrapper.get('[data-test="entity-container-group"]').element.dispatchEvent(groupEvent)
        expect(groupEvent.defaultPrevented).toBe(true)
        expect(dataTransfer.setData).not.toHaveBeenCalled()
        await wrapper.get('[data-test="expand-group"]').trigger('click')
        await wrapper.get('[data-test="entity-container-entity"]').trigger('dragstart', { dataTransfer })
        expect(dataTransfer.setData).toHaveBeenCalledWith('text', JSON.stringify(entity))
        expect(dataTransfer.effectAllowed).toBe('move')
        wrapper.unmount()
    })
})
