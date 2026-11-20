function rebaseUrl(originalBase, base) {
  const prefix = base.replace(/\/$/, "");
  return (url) => url?.startsWith(`${originalBase}/`)
    ? prefix + url.slice(originalBase.length)
    : url;
}

export function rebaseMarkdownLinks(originalBase, base) {
  const rebase = rebaseUrl(originalBase, base);
  return function remarkRebaseLinks() {
    return function transform(tree) {
      function visit(node) {
        if (node.url) node.url = rebase(node.url);
        node.children?.forEach(visit);
      }

      visit(tree);
    };
  };
}

export function rebaseSatteriLinks(originalBase, base) {
  const rebase = rebaseUrl(originalBase, base);
  const visit = (node, ctx) => {
    const url = rebase(node.url);
    if (url !== node.url) ctx.setProperty(node, "url", url);
  };
  return { name: "rebase-pages-links", link: visit, definition: visit, image: visit };
}
