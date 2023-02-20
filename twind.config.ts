import { type Configuration } from "twind";
// Twind Configuration. make sure sheet property is omited
export default {
  preflight: false
} as Omit<Configuration, "sheet">;
