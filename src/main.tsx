import { createRoot } from "react-dom/client";
import initGame from "./initGame";
import ReactUI from './ReactUI';
import { Provider } from "jotai";
import { store } from "./store";

const ui = document.getElementById("ui") as HTMLDivElement;
const root = createRoot(ui);
root.render(
  <Provider store={store}>
    <ReactUI />
  </Provider>
);

initGame();