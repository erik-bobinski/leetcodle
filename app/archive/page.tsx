import { auth } from "@clerk/nextjs/server";
import Calendar18 from "@/components/calendar-18";

export default async function Archive() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Login to see your history</div>;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-4">
      <div className="flex w-full items-center justify-center">
        <Calendar18 />
      </div>
    </div>
  );
}
