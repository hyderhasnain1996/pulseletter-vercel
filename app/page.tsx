import LoginPage from "./login/page";

/* The front door.

   The address always opens the landing page — signed in or not — and the
   studio lives at /dashboard. Nobody arrives inside the app without having
   passed through here first. */

export const metadata = {
  title: "PulseLetter — Newsletter Studio",
  description:
    "Turn a theme into a polished newsletter, then share it with your audience.",
};

export default LoginPage;
