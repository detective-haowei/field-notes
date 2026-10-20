import { useState } from "react";
import type { SupabaseClient, Session } from "@supabase/supabase-js";
import { signIn, signUp } from "../api/supabase";

interface Props {
  client: SupabaseClient;
  onSignedIn: (session: Session) => void;
}

/** Shown over the app until there is a session. */
export function AuthScreen({ client, onSignedIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  const say = (text: string, isError = false) => {
    setMessage(text);
    setError(isError);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    say("Signing in…");
    const res = await signIn(client, email.trim(), password);
    if (res.error) say(res.error.message, true);
    else if (res.data.session) onSignedIn(res.data.session);
  };

  const onCreate = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!e.currentTarget.form?.reportValidity()) return;
    say("Creating account…");
    const res = await signUp(client, email.trim(), password);
    if (res.error) say(res.error.message, true);
    else if (res.data.session) onSignedIn(res.data.session);
    else say("Account created. Check your email to confirm it, then sign in.");
  };

  return (
    <div className="authb">
      <form className="authc" autoComplete="on" onSubmit={onSubmit}>
        <h2>Sign in to Field Notes</h2>
        <p className="sub">Your tasks and attachments sync across your devices.</p>

        <label htmlFor="au-email">Email</label>
        <input
          id="au-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="au-pass">Password</label>
        <input
          id="au-pass"
          type="password"
          autoComplete="current-password"
          minLength={6}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className={"aumsg" + (error ? " err" : "")} role="status">
          {message}
        </div>

        <div className="row">
          <button className="pri" type="submit">
            Sign in
          </button>
          <button type="button" onClick={onCreate}>
            Create account
          </button>
        </div>
      </form>
    </div>
  );
}
