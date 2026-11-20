import '@duskmoon-dev/el-code-engine/register';
import { EditorView } from '@duskmoon-dev/code-engine/view';
import { language, syntaxTree } from '@duskmoon-dev/code-engine/language';

const events = [];
for (const type of ['input', 'change']) {
  document.addEventListener(type, (event) => {
    if (event instanceof CustomEvent && event.target.localName === 'el-dm-code-engine') {
      events.push({ type, id: event.target.id, value: event.detail.value, composed: event.composed });
    }
  });
}

function viewFor(id) {
  const host = document.getElementById(id);
  const editor = host?.shadowRoot.querySelector('.cm-editor');
  return editor ? EditorView.findFromDOM(editor) : null;
}

window.fixture = {
  events,
  viewFor,
  snapshot(id = 'primary') {
    const host = document.getElementById(id);
    const view = viewFor(id);
    const editor = view?.dom;
    const scroller = view?.scrollDOM;
    return {
      value: host?.value,
      mounted: Boolean(view),
      language: view?.state.facet(language)?.name,
      tree: view ? syntaxTree(view.state).toString() : '',
      readonly: view?.state.readOnly,
      editorCount: host?.shadowRoot.querySelectorAll('.cm-editor').length,
      background: editor ? getComputedStyle(editor).backgroundColor : '',
      position: editor ? getComputedStyle(editor).position : '',
      whiteSpace: view ? getComputedStyle(view.contentDOM).whiteSpace : '',
      hostHeight: host?.getBoundingClientRect().height,
      editorHeight: editor?.getBoundingClientRect().height,
      scrollHeight: scroller?.scrollHeight,
      clientHeight: scroller?.clientHeight,
      scrollTop: scroller?.scrollTop,
    };
  },
  add(id, value, selectedLanguage = 'javascript') {
    const host = document.createElement('el-dm-code-engine');
    host.id = id;
    host.setAttribute('language', selectedLanguage);
    host.setAttribute('theme', 'duskmoon');
    host.value = value;
    document.querySelector('#editors').append(host);
    return host;
  },
};
document.documentElement.dataset.ready = 'true';
