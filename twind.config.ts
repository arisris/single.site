import { type Configuration } from "twind";
import { apply, css } from "twind/css";
// Twind Configuration. make sure sheet property is omited
export default {
  preflight: () =>
    css({
      ":global": {
        "html": {
          boxSizing: "border-box",
        },
        "body": apply``,
        "a": apply`text-blue-600 no-underline hover:(underline)`,
      },
    }),
} as Omit<Configuration, "sheet">;
