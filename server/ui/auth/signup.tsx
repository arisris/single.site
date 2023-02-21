import AppLayout from "../layouts/app.tsx";
import Notify from "../components/notification.tsx";

export default function AuthSignUpPage() {
  const title = "SignUp";
  return (
    <AppLayout title={title}>
      <h3>{title}</h3>
      <form method="POST" class="max-w-[360px]">
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
        <Notify
          boxed
          class="my-2 px-2 py-1"
          type="warning"
          message="Password is required with combined with special character eg. $^*#@!~"
        />
        <div class="mb-2">
          <label for="password">Password:</label>
          <input
            type="password"
            name="password"
            id="password"
            placeholder="Your password"
            autocomplete="new-password"
            required
          />
        </div>
        <div class="mb-2">
          <label for="password_confirm">Confirm:</label>
          <input
            type="password"
            name="password_confirm"
            id="password_confirm"
            placeholder="Confirm your password"
            autocomplete="new-password"
            required
          />
        </div>
        <div class="my-4">
          <label for="blog_name">Domains</label>
          <br />
          <i class="text-xs text-gray-500">
            Find your web identity availablility. We have free subdomain or you
            can chose top-level domain
          </i>
          <hr />
          <input type="text" name="blog_name" id="blog_name" required />
          <select name="blog_subid" required>
            <option value="0" selected="true">.kodok.site</option>
          </select>
        </div>
        <label for="accept" class="mb-2">
          <input type="checkbox" name="accept" id="accept" class="ml-0" />
          <span class="text-sm">
            By continue we thing you have read our{" "}
            <a href="/privacy-policy" class="italic">
              Privacy Policy
            </a>{" "}
            &{" "}
            <a href="/terms-of-service" class="italic">
              Terms of Service
            </a>
          </span>
        </label>
        <div class="my-2">
          <button type="submit">SignUp</button>
          <br />
          <br />
          <a href="/signin" class="text-sm">SignIn</a>
        </div>
      </form>
    </AppLayout>
  );
}
