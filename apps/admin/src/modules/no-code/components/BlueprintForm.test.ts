/** @vitest-environment jsdom */
import { type IBlueprint } from '@qelos/global-types';
import { createApp, defineComponent, h, nextTick, reactive, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import BlueprintForm from './BlueprintForm.vue';

let propertiesTabProps: any = null;
const routerReplaceMock = vi.fn();

function stubComponent(name: string) {
  return defineComponent({
    name,
    setup: () => () => h('div', { class: name }),
  });
}

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ replace: routerReplaceMock }),
}));

vi.mock('@/modules/core/components/forms/FormInput.vue', () => ({ default: stubComponent('FormInput') }));
vi.mock('@/modules/core/components/forms/FormRowGroup.vue', () => ({ default: stubComponent('FormRowGroup') }));
vi.mock('@/modules/core/components/forms/RemoveButton.vue', () => ({ default: stubComponent('RemoveButton') }));
vi.mock('@/modules/core/components/forms/AddMore.vue', () => ({ default: stubComponent('AddMore') }));
vi.mock('@/modules/no-code/components/BlueprintSelector.vue', () => ({ default: stubComponent('BlueprintSelector') }));
vi.mock('@/modules/no-code/components/blueprint-form/BlueprintLimitationsInput.vue', () => ({ default: stubComponent('BlueprintLimitationsInput') }));
vi.mock('@/modules/no-code/components/blueprint-form/BlueprintPermissionsTab.vue', () => ({ default: stubComponent('BlueprintPermissionsTab') }));
vi.mock('@/modules/no-code/components/blueprint-form/BlueprintGeneralTab.vue', () => ({ default: stubComponent('BlueprintGeneralTab') }));
vi.mock('@/modules/no-code/components/blueprint-form/BlueprintPropertiesTab.vue', () => ({
  default: defineComponent({
    name: 'BlueprintPropertiesTab',
    props: ['properties', 'entityIdentifierMechanism', 'loading', 'propertiesLoading', 'identifierLoading'],
    setup(props) {
      propertiesTabProps = props;
      return () => h('div', { class: 'BlueprintPropertiesTab' });
    },
  }),
}));

function mountBlueprintForm(blueprint: Partial<IBlueprint>, extraProps: Record<string, unknown> = {}) {
  routerReplaceMock.mockClear();
  propertiesTabProps = null;

  const propsState = reactive({
    blueprint,
    submitting: false,
    loading: false,
    propertiesLoading: undefined,
    identifierLoading: undefined,
    ...extraProps,
  });

  const formRef = ref<any>(null);

  const Parent = defineComponent({
    setup() {
      return () => h(BlueprintForm, { ref: formRef, ...propsState });
    },
  });

  const app = createApp(Parent);
  app.config.globalProperties.$t = (key: string) => key;
  const stubTags = ['el-icon', 'el-button', 'el-card', 'el-tabs', 'el-tab-pane', 'el-form', 'font-awesome-icon', 'el-row', 'el-col', 'Monaco'];
  stubTags.forEach((tag) => {
    app.component(tag, stubComponent(tag));
  });

  const root = document.createElement('div');
  document.body.appendChild(root);
  app.mount(root);

  return {
    app,
    root,
    propsState,
    formRef,
    unmount() {
      app.unmount();
      root.remove();
    },
  };
}

describe('BlueprintForm', () => {
  it('reapplies blueprint state on prop change and clears stale data', async () => {
    const initialBlueprint: Partial<IBlueprint> = {
      name: 'Initial',
      dispatchers: { create: true, delete: false, update: false },
      updateMapping: { title: 'name' },
      extraField: 'to-be-removed',
    };
    const { formRef, propsState, unmount } = mountBlueprintForm(initialBlueprint);

    await nextTick();

    const state = formRef.value.$.setupState;
    expect(state.edit.name).toBe('Initial');
    expect(state.edit.dispatchers?.create).toBe(true);
    expect(state.blueprintMapping).toEqual([{ key: 'title', value: 'name' }]);

    state.edit.custom = 'temp-value';

    propsState.blueprint = {
      name: 'Updated',
      dispatchers: { update: true },
      updateMapping: { slug: 2 },
    };

    await nextTick();

    expect(state.edit.name).toBe('Updated');
    expect(state.edit.dispatchers?.create ?? false).toBe(false);
    expect(state.edit.dispatchers?.update ?? false).toBe(true);
    expect(state.blueprintMapping).toEqual([{ key: 'slug', value: '2' }]);
    expect((state.edit as any).custom).toBeUndefined();
    expect((state.edit as any).extraField).toBeUndefined();
    unmount();
  });

  it('passes loading props to properties tab with expected fallbacks', async () => {
    const { propsState, formRef, unmount } = mountBlueprintForm({}, { loading: true, identifierLoading: false });

    await nextTick();
    const state = formRef.value.$.setupState;
    expect(state.propertiesLoadingState).toBe(true);
    expect(state.identifierLoadingState).toBe(false);

    propsState.propertiesLoading = false;
    await nextTick();
    expect(state.propertiesLoadingState).toBe(false);

    propsState.loading = false;
    propsState.propertiesLoading = undefined;
    await nextTick();
    expect(state.propertiesLoadingState).toBe(false);
    unmount();
  });
});
