export const loadForm = () =>
  import("duskmoon_phoenix/react-form").then((module) => module.DuskmoonReactForm);

export const loadChat = () =>
  import("duskmoon_phoenix/react-chat").then((module) => module.DuskmoonReactChat);

export const loadComposedChat = () =>
  import("./react_chat.js").then((module) => module.DuskmoonComposedChat);

export const loadVisualization = () =>
  import("duskmoon_phoenix/react-visualization").then((module) => module.DuskmoonReactVisualization);
