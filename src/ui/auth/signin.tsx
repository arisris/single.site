import AppLayout from "../layouts/app.tsx";
import Notify from "../components/notification.tsx";

export default () => {
  const error = false;
  const title = "SignIn";
  return (
    <AppLayout title={title}>
      <h3>{title}</h3>
      <form
        method="POST"
        class="max-w-[360px]"
      >
        {error && <Notify class="my-2" boxed message={error} type="danger" />}
        <div class="mb-2">
          <label for="email">Email:</label>
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Your email"
            autocomplete="current-email"
            required
          />
        </div>
        <div class="mb-2">
          <label for="password">Password:</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Your password"
            autocomplete="current-password"
            required
          />
        </div>
        <label for="remember" class="mb-2">
          <input
            type="checkbox"
            name="remember"
            id="remember"
            class="ml-0"
          />
          <span class="text-sm">Remember me</span>
        </label>
        <div class="my-2">
          <button type="submit">
            SignIn
          </button>
          <br />
          <br />
          <a href="/signup" class="text-sm">SignUp</a> |{" "}
          <a href="/reset-password" class="text-sm">Reset Password</a>
        </div>
      </form>
    </AppLayout>
  );
};
