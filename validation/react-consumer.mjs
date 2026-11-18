import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { Button } from "@duskmoon-dev/components/button";
import { ArtMoon } from "@duskmoon-dev/art-components";

const html = renderToStaticMarkup(createElement("main", {}, [
  createElement(Button, { key: "button", type: "button" }, "Native React"),
  createElement(ArtMoon, { key: "moon" }),
]));
process.stdout.write(html);
