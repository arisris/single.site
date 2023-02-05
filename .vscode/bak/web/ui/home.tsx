/** @jsx jsx */
import { jsx } from "./types.ts";
import AppLayout from "./layouts/app.tsx";

export default function HomeUI() {
  return (
    <AppLayout title="Simple deno blog platform">
      <h3>Hi. User</h3>
      <div class="inline-flex gap-2">
        <a href="/dashboard">Dashboard</a>
        <a href="/settings">Settings</a>
        <a href="/signout">Signout</a>
      </div>
      <p class="my-6">
        Welcome to `kodok`. Create accounts then you can enjoy by write &amp;
        publish your stories arround the world for free
      </p>
      <h3>Features:</h3>
      <ul class="list-disc px-6 children:py-1">
        <li>No ads</li>
        <li>Super fast</li>
        <li>Runing on edge server</li>
        <li>Globally distributed content</li>
        <li>Custom domain</li>
      </ul>
      <h3>Get started:</h3>
      <div class="inline-flex gap-2">
        <a href="/signin">Login</a>
        <a href="/signup">Register</a>
        <a href="/explore">Explore..</a>
      </div>
    </AppLayout>
  );
}
