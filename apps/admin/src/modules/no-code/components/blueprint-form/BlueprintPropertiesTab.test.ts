/** @vitest-environment jsdom */
import { BlueprintPropertyType, EntityIdentifierMechanism, type IBlueprintPropertyDescriptor } from '@qelos/global-types';
import { createApp, defineComponent, h, nextTick, reactive, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import BlueprintPropertiesTab from './BlueprintPropertiesTab.vue';

function stubEl(name: string) {
  return defineComponent({
    name,
    setup(_, { slots }) {
      return () => h('div', { class: name }, slots.default?.());
    },
  });
}

vi.mock('element-plus', () => ({
  ElSkeleton: stubEl('ElSkeleton'),
  ElSkeletonItem: stubEl('ElSkeletonItem'),
  ElSelect: stubEl('ElSelect'),
  ElOption: stubEl('ElOption'),
  ElTag: stubEl('ElTag'),
  ElButton: stubEl('ElButton'),
  ElCard: stubEl('ElCard'),
  ElEmpty: stubEl('ElEmpty'),
  ElFormItem: stubEl('ElFormItem'),
  ElIcon: stubEl('ElIcon'),
}));

vi.mock('@element-plus/icons-vue', () => ({
  Plus: stubEl('Plus'),
  Delete: stubEl('Delete'),
}));

vi.mock('@/modules/pre-designed/components/InfoIcon.vue', () => ({ default: stubEl('InfoIcon') }));
vi.mock('@/modules/users/components/Monaco.vue', () => ({ default: stubEl('Monaco') }));
vi.mock('@/modules/core/components/forms/FormInput.vue', () => ({ default: stubEl('FormInput') }));
vi.mock('@/modules/core/components/forms/FormRowGroup.vue', () => ({ default: stubEl('FormRowGroup') }));

type PropertiesRecord = Record<string, IBlueprintPropertyDescriptor>;

function mountPropertiesTab(initialProperties?: PropertiesRecord, extraProps: Record<string, unknown> = {}) {
  const updates: PropertiesRecord[] = [];
  const propsState = reactive<Record<string, any>>({
    properties: initialProperties,
    entityIdentifierMechanism: EntityIdentifierMechanism.OBJECT_ID,
    loading: false,
    propertiesLoading: undefined,
    identifierLoading: undefined,
    ...extraProps,
    ['onUpdate:properties'](value: PropertiesRecord) {
      updates.push(value);
      propsState.properties = value;
    },
    ['onUpdate:entityIdentifierMechanism']: vi.fn(),
  });

  const componentRef = ref<any>(null);

  const Parent = defineComponent({
    setup() {
      return () => h(BlueprintPropertiesTab, { ref: componentRef, ...propsState });
    },
  });

  const app = createApp(Parent);
  app.config.globalProperties.$t = (key: string) => key;
  const stubTags = ['el-skeleton', 'el-skeleton-item', 'el-select', 'el-option', 'el-tag', 'el-button', 'el-card', 'el-empty', 'el-form-item', 'el-icon', 'el-input', 'el-input-number', 'el-switch', 'el-row', 'el-col', 'el-dropdown', 'el-dropdown-item', 'el-dropdown-menu'];
  stubTags.forEach((tag) => {
    app.component(tag, stubEl(tag));
  });
  const root = document.createElement('div');
  document.body.appendChild(root);
  app.mount(root);

  return {
    app,
    root,
    propsState,
    updates,
    instance: componentRef,
    unmount() {
      app.unmount();
      root.remove();
    },
  };
}

describe('BlueprintPropertiesTab', () => {
  it('keeps selection stable when parent updates and suppresses emits during sync', async () => {
    const { instance, propsState, updates, unmount } = mountPropertiesTab({
      title: { type: BlueprintPropertyType.STRING, required: true, description: 'Title' },
      status: { type: BlueprintPropertyType.STRING, enum: ['draft', 'live'] },
    });

    await nextTick();
    const state = instance.value.$.setupState;
    state.selectProperty(1);
    await nextTick();

    propsState.properties = {
      title: { type: BlueprintPropertyType.STRING, required: true, description: 'Updated title' },
      status: { type: BlueprintPropertyType.STRING, enum: ['draft', 'live'], multi: true },
      active: { type: BlueprintPropertyType.BOOLEAN },
    };

    await nextTick();
    expect(state.selectedPropertyIndex).toBe(1);
    expect(updates).toHaveLength(0);

    state.blueprintProperties[1].required = true;
    await nextTick();

    expect(updates).toHaveLength(1);
    expect(updates[0].status.required).toBe(true);
    unmount();
  });

  it('stringifies object schemas and parses them back when emitting updates', async () => {
    const initialSchema = { properties: { title: { type: 'string' } } };
    const { instance, updates, unmount } = mountPropertiesTab({
      config: { type: BlueprintPropertyType.OBJECT, schema: initialSchema },
    });

    await nextTick();
    const state = instance.value.$.setupState;
    const storedSchema = state.blueprintProperties[0].schema;
    expect(typeof storedSchema).toBe('string');
    expect(JSON.parse(storedSchema)).toEqual(initialSchema);

    const nextSchema = { fields: ['id'] };
    state.blueprintProperties[0].schema = JSON.stringify(nextSchema);
    await nextTick();

    expect(updates).toHaveLength(1);
    expect(updates[0].config.schema).toEqual(nextSchema);
    unmount();
  });
});
