import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SettingsForm from "@/components/SettingsForm";
import { getCurrentUser } from "@/lib/queries/getCurrentUser";

export default async function SettingsPage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await getCurrentUser(userId);

  const serializedUser = user
    ? {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        username: user.username,
        emailAddress: user.emailAddresses?.[0]?.emailAddress,
      }
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-default-50">
      <Navbar user={serializedUser} />
      <main className="flex-1 flex justify-center items-center p-6">
        {dbUser && <SettingsForm user={dbUser} />}
      </main>
      <Footer />
    </div>
  );
}
