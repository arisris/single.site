/** @jsx jsx */
import { jsx } from "hono/middleware.ts";
import AppLayout from "../layouts/app.tsx";
import Notify from "../components/notification.tsx";

export default () => {
  const title = "Reset Password";
  return (
    <AppLayout title={title}>
      <h3>Reset Password</h3>
      <form method="POST" class="max-w-[360px]">
        <Notify
          class="mb-6"
          message="We can reset your password by send token to your email. Please follow instruction"
          type="info"
          boxed
        />
        <div class="mb-2">
          <label for="email">Email:</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Your email"
            autocomplete="new-email"
            required
          />
        </div>
        <div class="my-2">
          <button type="submit">Reset Password</button>
          <br />
          <br />
          <a href="/signin" class="text-sm">SignIn</a>
        </div>
      </form>
    </AppLayout>
  );
};
