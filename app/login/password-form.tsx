"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/* Username and password sign-in.

   Handled on the client so a wrong password can be reported in place, rather
   than bouncing through an error page and losing what was typed. */
export function PasswordForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const res = await signIn("password", {
          username,
          password,
          redirect: false,
        });
        setBusy(false);
        if (res?.error) setError("Wrong username or password.");
        else window.location.href = "/";
      }}
    >
      <label>
        Username
        <input
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="mllab"
          required
        />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />
      </label>
      {error && <p className="login-warn">{error}</p>}
      <button className="primary" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
