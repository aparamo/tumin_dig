import { redirect } from "next/navigation";
import { auth } from "@/auth";

/** Alias de registro: /signup → /register (y al home si ya hay sesión). */
export default async function SignupPage() {
  const session = await auth();
  if (session?.user?.id) {
    redirect("/");
  }
  redirect("/register");
}
