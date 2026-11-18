import { Socket } from "phoenix";
import { LiveSocket } from "phoenix_live_view";
import * as hooks from "duskmoon_phoenix/hooks";

const csrfToken = document.querySelector('meta[name="csrf-token"]').content;
const liveSocket = new LiveSocket("/live", Socket, { hooks, params: { _csrf_token: csrfToken } });
liveSocket.connect();
