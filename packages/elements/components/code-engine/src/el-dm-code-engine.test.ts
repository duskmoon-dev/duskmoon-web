import { describe, it, expect, beforeAll, afterEach, mock } from 'bun:test';

// Mock CodeMirror modules before importing the element — CodeMirror cannot
// mount in happy-dom because it requires real DOM layout APIs (style tags,
// getBoundingClientRect, etc.).  We only need to test bar rendering, properties,
// and DOM structure, so we stub out the editor internals.

class FakeCompartment {
  of(ext: unknown) {
    configuredExtensions.push(ext);
    return [];
  }
  reconfigure(ext: unknown) {
    return { extension: ext };
  }
}

const configuredExtensions: unknown[] = [];
const oneDarkExtension = { extension: 'one-dark' };

function stateFor(doc = '') {
  return {
    doc: {
      toString: () => doc,
      length: doc.length,
      lines: doc.split('\n').length,
      lineAt: () => ({ number: 1, from: 0 }),
    },
    selection: { main: { head: 0 } },
  };
}

const fakeEditorState = {
  readOnly: { of: (value: boolean) => ({ readOnly: value }) },
  create: (config: { doc?: string } = {}) => stateFor(config.doc),
};

class FakeEditorView {
  state: ReturnType<typeof stateFor>;
  effects: unknown[] = [];
  destroyed = false;
  static lineWrapping = { wrapping: true };
  static updateListener = { of: () => ({}) };
  static domEventHandlers = () => ({});
  constructor(config: { state: ReturnType<typeof stateFor> }) {
    this.state = config.state;
    editors.push(this);
  }
  dispatch(transaction: { changes?: { insert: string }; effects?: unknown }) {
    if (this.destroyed) throw new Error('Dispatch after destroy');
    if (transaction.changes) this.state = stateFor(transaction.changes.insert);
    if (transaction.effects) {
      this.effects.push(
        ...(Array.isArray(transaction.effects) ? transaction.effects : [transaction.effects]),
      );
    }
  }
  destroy() {
    this.destroyed = true;
  }
  focus() {}
}

const editors: FakeEditorView[] = [];
const javascriptExtension = { language: 'javascript' };
const elixirExtension = { language: 'elixir' };
let javascriptResult: unknown = javascriptExtension;
let elixirResult: unknown = elixirExtension;

mock.module('@duskmoon-dev/code-engine/view', () => ({ EditorView: FakeEditorView }));
mock.module('@duskmoon-dev/code-engine/lang/javascript', () => ({
  // A helper export must never be mistaken for the language factory.
  autoCloseTags: () => {
    throw new Error('Wrong language factory');
  },
  javascript: () => javascriptResult,
}));
mock.module('@duskmoon-dev/code-engine/lang/elixir', () => ({ elixir: () => elixirResult }));

mock.module('@duskmoon-dev/code-engine/state', () => ({
  EditorState: fakeEditorState,
  Compartment: FakeCompartment,
}));

mock.module('@duskmoon-dev/code-engine/setup', () => ({
  basicSetup: [],
}));

mock.module('@duskmoon-dev/code-engine/commands', () => ({
  undo: () => {},
  redo: () => {},
}));

mock.module('@duskmoon-dev/code-engine/theme/duskmoon', () => ({ duskMoon: () => [] }));
mock.module('@duskmoon-dev/code-engine/theme/sunshine', () => ({ sunshine: [] }));
mock.module('@duskmoon-dev/code-engine/theme/moonlight', () => ({ moonlight: [] }));
mock.module('@duskmoon-dev/code-engine/theme/one-dark', () => ({
  color: { background: '#282c34' },
  oneDark: oneDarkExtension,
}));

// Now import the element class (after mocks are in place)
const { ElDmCodeEngine } = await import('./el-dm-code-engine.js');

// Register the element once
beforeAll(() => {
  if (!customElements.get('el-dm-code-engine')) {
    customElements.define('el-dm-code-engine', ElDmCodeEngine);
  }
});

// Clean up DOM after each test
afterEach(() => {
  document.body.innerHTML = '';
  editors.length = 0;
  javascriptResult = javascriptExtension;
  elixirResult = elixirExtension;
});

function createElement(
  attrs: Record<string, string | boolean> = {},
): InstanceType<typeof ElDmCodeEngine> {
  const el = document.createElement('el-dm-code-engine') as InstanceType<typeof ElDmCodeEngine>;
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === 'boolean') {
      if (value) el.setAttribute(key, '');
    } else {
      el.setAttribute(key, value);
    }
  }
  document.body.appendChild(el);
  return el;
}

// Allow microtask queue to flush (BaseElement batches updates)
async function flush(): Promise<void> {
  for (let i = 0; i < 8; i++) await new Promise((r) => queueMicrotask(r));
}

describe('ElDmCodeEngine', () => {
  it('uses the one-dark extension instead of its exported color map', async () => {
    configuredExtensions.length = 0;
    createElement({ theme: 'one-dark' });
    await flush();

    expect(configuredExtensions).toContain(oneDarkExtension);
    expect(configuredExtensions).not.toContainEqual({ background: '#282c34' });
  });

  describe('configuration lifecycle', () => {
    it('selects the named language factory when helpers are also exported', async () => {
      configuredExtensions.length = 0;
      createElement({ language: 'javascript' });
      await flush();
      expect(configuredExtensions).toContain(javascriptExtension);
    });

    it('preserves document and editor while reconfiguring and refreshing language labels', async () => {
      const el = createElement({ value: 'initial', language: 'javascript' });
      await flush();
      const editor = editors.at(-1)!;
      el.value = 'edited content';
      el.language = 'elixir';
      el.readonly = true;
      el.wrap = true;
      el.theme = 'moonlight';
      await flush();
      expect(editors.at(-1)).toBe(editor);
      expect(el.value).toBe('edited content');
      expect(el.shadowRoot!.querySelector('.lang-badge')!.textContent).toBe('EX');
      expect(editor.effects).toContainEqual({ extension: elixirExtension });
    });

    it('ignores an older language result after a newer configuration', async () => {
      const el = createElement();
      await flush();
      const editor = editors.at(-1)!;
      let resolveLanguage!: (value: unknown) => void;
      elixirResult = new Promise((resolve) => {
        resolveLanguage = resolve;
      });
      el.language = 'elixir';
      await flush();
      el.language = '';
      await flush();
      expect(editor.effects.at(-1)).toEqual({ extension: [] });
      const count = editor.effects.length;
      resolveLanguage(elixirExtension);
      await flush();
      expect(editor.effects.length).toBe(count);
    });

    it('invalidates pending configuration on disconnect and preserves edits on reconnect', async () => {
      const el = createElement({ value: 'initial' });
      await flush();
      const first = editors.at(-1)!;
      el.value = 'survives reconnect';
      let resolveLanguage!: (value: unknown) => void;
      elixirResult = new Promise((resolve) => {
        resolveLanguage = resolve;
      });
      el.language = 'elixir';
      await flush();
      el.remove();
      expect(first.destroyed).toBe(true);
      const count = first.effects.length;
      document.body.append(el);
      el.language = '';
      await flush();
      const second = editors.at(-1)!;
      expect(second).not.toBe(first);
      expect(el.value).toBe('survives reconnect');
      resolveLanguage(elixirExtension);
      await flush();
      expect(first.effects.length).toBe(count);
      expect(editors.at(-1)).toBe(second);
      expect(second.effects).not.toContainEqual({ extension: elixirExtension });
    });

    it('invalidates an initial language load when removed and remounted with newer configuration', async () => {
      let resolveLanguage!: (value: unknown) => void;
      elixirResult = new Promise((resolve) => {
        resolveLanguage = resolve;
      });
      const el = createElement({ value: 'pending document', language: 'elixir' });
      await flush();
      expect(editors).toHaveLength(0);
      el.value = 'latest document';
      el.remove();
      el.language = '';
      document.body.append(el);
      await flush();
      const second = editors.at(-1)!;
      expect(el.value).toBe('latest document');
      resolveLanguage(elixirExtension);
      await flush();
      expect(editors).toHaveLength(1);
      expect(editors.at(-1)).toBe(second);
      expect(el.value).toBe('latest document');
    });
  });

  describe('properties', () => {
    it('should have showTopbar default to false', async () => {
      const el = createElement();
      await flush();
      expect(el.showTopbar).toBeFalsy();
    });

    it('should have showBottombar default to false', async () => {
      const el = createElement();
      await flush();
      expect(el.showBottombar).toBeFalsy();
    });

    it('should reflect show-topbar attribute', async () => {
      const el = createElement({ 'show-topbar': true });
      await flush();
      expect(el.showTopbar).toBe(true);
      expect(el.hasAttribute('show-topbar')).toBe(true);
    });

    it('should reflect show-bottombar attribute', async () => {
      const el = createElement({ 'show-bottombar': true });
      await flush();
      expect(el.showBottombar).toBe(true);
      expect(el.hasAttribute('show-bottombar')).toBe(true);
    });

    it('should reflect title attribute', async () => {
      const el = createElement({ title: 'main.js' });
      await flush();
      expect((el as unknown as { title: string }).title).toBe('main.js');
    });
  });

  describe('topbar rendering', () => {
    it('should render topbar div always in shadow DOM', async () => {
      const el = createElement();
      await flush();
      const topbar = el.shadowRoot?.querySelector('.topbar');
      expect(topbar).toBeTruthy();
    });

    it('should render language badge when language is set', async () => {
      const el = createElement({ 'show-topbar': true, language: 'javascript' });
      await flush();
      const badge = el.shadowRoot?.querySelector('.lang-badge');
      expect(badge?.textContent).toBe('JS');
    });

    it('should render title in topbar', async () => {
      const el = createElement({ 'show-topbar': true, title: 'app.ts' });
      await flush();
      const title = el.shadowRoot?.querySelector('.topbar-title');
      expect(title?.textContent).toBe('app.ts');
    });

    it('should render 5 action buttons', async () => {
      const el = createElement({ 'show-topbar': true });
      await flush();
      const buttons = el.shadowRoot?.querySelectorAll('.bar-btn');
      expect(buttons?.length).toBe(5);
    });

    it('should use fallback badge for unknown languages', async () => {
      const el = createElement({ 'show-topbar': true, language: 'cobol' });
      await flush();
      const badge = el.shadowRoot?.querySelector('.lang-badge');
      expect(badge?.textContent).toBe('COBOL');
    });

    it('should have correct data-action attributes on buttons', async () => {
      const el = createElement({ 'show-topbar': true });
      await flush();
      const actions = Array.from(el.shadowRoot?.querySelectorAll('.bar-btn') ?? []).map((btn) =>
        btn.getAttribute('data-action'),
      );
      expect(actions).toEqual(['undo', 'redo', 'wrap', 'copy', 'fullscreen']);
    });
  });

  describe('bottombar rendering', () => {
    it('should render bottombar div always in shadow DOM', async () => {
      const el = createElement();
      await flush();
      const bottombar = el.shadowRoot?.querySelector('.bottombar');
      expect(bottombar).toBeTruthy();
    });

    it('should render language name when language is set', async () => {
      const el = createElement({ 'show-bottombar': true, language: 'python' });
      await flush();
      const rightSide = el.shadowRoot?.querySelector('.bottombar-right');
      expect(rightSide?.textContent).toContain('Python');
    });

    it('should show UTF-8 encoding', async () => {
      const el = createElement({ 'show-bottombar': true });
      await flush();
      const rightSide = el.shadowRoot?.querySelector('.bottombar-right');
      expect(rightSide?.textContent).toContain('UTF-8');
    });

    it('should show cursor position', async () => {
      const el = createElement({ 'show-bottombar': true });
      await flush();
      const cursorPos = el.shadowRoot?.querySelector('.cursor-pos');
      expect(cursorPos?.textContent).toContain('Ln');
      expect(cursorPos?.textContent).toContain('Col');
    });

    it('should show line count', async () => {
      const el = createElement({ 'show-bottombar': true });
      await flush();
      const lineCount = el.shadowRoot?.querySelector('.line-count');
      expect(lineCount?.textContent).toContain('lines');
    });
  });

  describe('slots', () => {
    it('should have topbar slot', async () => {
      const el = createElement({ 'show-topbar': true });
      await flush();
      const slot = el.shadowRoot?.querySelector('slot[name="topbar"]');
      expect(slot).toBeTruthy();
    });

    it('should have bottombar slot', async () => {
      const el = createElement({ 'show-bottombar': true });
      await flush();
      const slot = el.shadowRoot?.querySelector('slot[name="bottombar"]');
      expect(slot).toBeTruthy();
    });
  });

  describe('CSS parts', () => {
    it('should expose topbar part', async () => {
      const el = createElement();
      await flush();
      const part = el.shadowRoot?.querySelector('[part="topbar"]');
      expect(part).toBeTruthy();
    });

    it('should expose bottombar part', async () => {
      const el = createElement();
      await flush();
      const part = el.shadowRoot?.querySelector('[part="bottombar"]');
      expect(part).toBeTruthy();
    });

    it('should expose editor part', async () => {
      const el = createElement();
      await flush();
      const part = el.shadowRoot?.querySelector('[part="editor"]');
      expect(part).toBeTruthy();
    });
  });

  describe('backwards compatibility', () => {
    it('should render cm-host when no bars enabled', async () => {
      const el = createElement({ language: 'javascript' });
      await flush();
      const editor = el.shadowRoot?.querySelector('.cm-host');
      expect(editor).toBeTruthy();
      expect(el.hasAttribute('show-topbar')).toBe(false);
      expect(el.hasAttribute('show-bottombar')).toBe(false);
    });
  });

  describe('fullscreen', () => {
    it('should toggle fullscreen class on click', async () => {
      const el = createElement({ 'show-topbar': true });
      await flush();
      const btn = el.shadowRoot?.querySelector('[data-action="fullscreen"]') as HTMLButtonElement;
      btn?.click();
      expect(el.classList.contains('fullscreen')).toBe(true);
      btn?.click();
      expect(el.classList.contains('fullscreen')).toBe(false);
    });

    it('should emit fullscreen event', async () => {
      const el = createElement({ 'show-topbar': true });
      await flush();
      let detail: { active: boolean } | null = null;
      el.addEventListener('fullscreen', ((e: CustomEvent) => {
        detail = e.detail;
      }) as EventListener);
      const btn = el.shadowRoot?.querySelector('[data-action="fullscreen"]') as HTMLButtonElement;
      btn?.click();
      expect(detail).toEqual({ active: true });
    });
  });

  describe('wrap toggle', () => {
    it('should toggle wrap property on click', async () => {
      const el = createElement({ 'show-topbar': true });
      await flush();
      expect(el.wrap).toBeFalsy();
      const btn = el.shadowRoot?.querySelector('[data-action="wrap"]') as HTMLButtonElement;
      btn?.click();
      expect(el.wrap).toBe(true);
    });
  });
});
