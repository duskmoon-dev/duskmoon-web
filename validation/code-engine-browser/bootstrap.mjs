// Registration follows demand so an editor-free page has no engine requests.
if (document.querySelector('el-dm-code-engine')) await import('./adapter.mjs');
else document.documentElement.dataset.ready = 'true';
