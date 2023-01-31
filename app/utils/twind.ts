import { Configuration, getStyleTag, setup, virtualSheet, tw } from "twind/server";

export type Config = Omit<Configuration, "sheet" | "hash">;

export function initializeTwind(config: Config) {
  const sheet = virtualSheet();
  setup({ ...config, sheet });
  return sheet;
}

export { getStyleTag, tw };
