import { EditorState as RootState, EditorView as RootView } from '@duskmoon-dev/code-engine';
import { EditorState, Compartment } from '@duskmoon-dev/code-engine/state';
import { EditorView } from '@duskmoon-dev/code-engine/view';
import { basicSetup } from '@duskmoon-dev/code-engine/setup';
import { undo, redo } from '@duskmoon-dev/code-engine/commands';
import { javascript } from '@duskmoon-dev/code-engine/lang/javascript';
import { language, syntaxTree } from '@duskmoon-dev/code-engine/language';

const readOnly = new Compartment();
const wrap = new Compartment();
const view = new EditorView({
  parent: document.querySelector('#editor'),
  state: EditorState.create({
    doc: 'const answer = 42;\n',
    extensions: [basicSetup, javascript(), readOnly.of([]), wrap.of([])],
  }),
});

window.fixture = {
  identity: RootState === EditorState && RootView === EditorView,
  view,
  snapshot() {
    return {
      value: view.state.doc.toString(),
      language: view.state.facet(language)?.name,
      tree: syntaxTree(view.state).toString(),
      readonly: view.state.readOnly,
    };
  },
  configure(readonly, wrapping) {
    view.dispatch({ effects: [
      readOnly.reconfigure(EditorState.readOnly.of(readonly)),
      wrap.reconfigure(wrapping ? EditorView.lineWrapping : []),
    ] });
  },
  undo: () => undo(view),
  redo: () => redo(view),
};
document.documentElement.dataset.ready = 'true';
