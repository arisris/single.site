import { Hono } from "hono/mod.ts";
import { AppEnv } from "$/env.ts";
import Home from "$/ui/home.tsx";
import SignIn from "$/ui/auth/signin.tsx";
import SignUp from "$/ui/auth/signup.tsx";
import ResetPassword from "$/ui/auth/reset-password.tsx";

const app = new Hono<AppEnv>();

app.get("/", (c) => {
  return c.html(<Home />);
});

app.get("/hello", (c) => c.html("Hello"));

app.get("/signin", (c) => {
  return c.html(<SignIn />);
});

app.get("/signup", (c) => {
  return c.html(<SignUp />);
});

app.get("/reset-password", (c) => {
  return c.html(<ResetPassword />);
});

export default app;
