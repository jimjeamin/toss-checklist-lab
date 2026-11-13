import { Share } from "@apps-in-toss/web-framework";

export type ShareResult = { mode: "mock" | "toss"; message: string };
export type SharePort = { sendMessage(message: string): Promise<ShareResult> };

/** Local browser adapter. It displays the payload and never calls Toss. */
export const mockShare: SharePort = {
  async sendMessage(message) {
    return { mode: "mock", message };
  },
};

/** Real Apps in Toss adapter. The native share UI requires the Toss app bridge. */
export const tossShare: SharePort = {
  async sendMessage(message) {
    await Share.sendMessage({ message });
    return { mode: "toss", message };
  },
};

/** Mock is the safe default. Set VITE_AIT_USE_NATIVE_SDK=true for a Toss app build. */
export const sharePort: SharePort = import.meta.env.VITE_AIT_USE_NATIVE_SDK === "true"
  ? tossShare
  : mockShare;

export const shareMode = sharePort === tossShare ? "toss" : "mock";
