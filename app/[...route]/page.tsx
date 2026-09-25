import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Studio from "../studio";
import { LanguageProvider } from "../i18n";

/* Every studio address. Signed out, it sends you to the landing page rather
   than showing studio chrome that cannot load any of your work. */
export default async function Page() {
  const session = await auth();
  if (!session?.user) redirect("/");
  return (
    <LanguageProvider>
      <Studio />
    </LanguageProvider>
  );
}
