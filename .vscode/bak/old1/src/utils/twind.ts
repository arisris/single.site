import { Configuration, getStyleTag, setup, virtualSheet, tw } from "https://esm.sh/twind@0.16.17/server";

export type Config = Omit<Configuration, "sheet" | "hash">;

export function initializeTwind(config: Config) {
  const sheet = virtualSheet();
  setup({ ...config, sheet });
  return sheet;
}

export { getStyleTag, tw };

// "htmldom": "https://esm.sh/htmldom@4.0.11",