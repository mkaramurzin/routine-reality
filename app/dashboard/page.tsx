import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import DashboardClient from "@/components/DashboardClient";
import Footer from "@/components/Footer";

export default async function Dashboard() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId) {
    redirect("/sign-in");
  }

  // Serialize the user data to avoid passing the Clerk User object directly
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

      <main className="flex-1 container mx-auto py-8 px-6">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-default-900 mb-2">
            Welcome back{serializedUser?.firstName ? `, ${serializedUser.firstName}` : ''}!
          </h1>
          <p className="text-default-600">
            Track your progress and advance through your routine stages.
          </p>
        </div>

        {/* Dashboard Content */}
        <DashboardClient userId={userId} />
      </main>

      <Footer />
    </div>
  );
}
