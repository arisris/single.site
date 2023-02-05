import { Configuration } from "https://esm.sh/twind@0.16.17";
// Twind Configuration. sheet property is omited by default
export default {
  preflight: false,
} as Omit<Configuration, "sheet">;
