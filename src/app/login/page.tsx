import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex h-dvh flex-col bg-canvas">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
