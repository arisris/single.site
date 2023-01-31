/** @jsx jsx */
import { jsx } from "hono/middleware.ts";
import { tw } from "../../utils/twind.ts";

export default function Notification(props: {
  type: "danger" | "success" | "warning" | "info";
  message: string;
  class?: string;
  boxed?: boolean;
}) {
  return (
    <div
      class={tw(
        props.boxed && `p-2 ring ring-1`,
        props.boxed && ({
          [`bg-red-50 ring-red-300`]: props.type === "danger",
          [`bg-green-50 ring-green-300`]: props.type === "success",
          [`bg-yellow-50 ring-yellow-300`]: props.type === "warning",
          [`bg-blue-50 ring-blue-300`]: props.type === "info",
        }),
        props.class,
      )}
    >
      <span
        class={tw(
          `text-xs font-mono`,
          {
            [`text-red-500`]: props.type === "danger",
            [`text-green-500`]: props.type === "success",
            [`text-yellow-500`]: props.type === "warning",
            [`text-blue-500`]: props.type === "info",
          },
        )}
      >
        {props.message}
      </span>
    </div>
  );
}
