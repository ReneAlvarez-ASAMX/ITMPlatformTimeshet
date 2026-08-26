import type { ItmBridge } from "../electron/preload";

declare global {
  interface Window {
    itm: ItmBridge;
  }
}

export {};
