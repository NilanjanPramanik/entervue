import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = auth();
  const user = await currentUser();

  const currentUserObj = {
    id: user?.id,
    username: user?.username,
    name: user?.firstName+" "+user?.lastName,
    email: user?.emailAddresses[0].emailAddress,
    // phone: user?.phoneNumbers[0].phoneNumber
  }

  if(!userId) {
    return NextResponse.json({
      error: 'No signed in user'
    }, {status: 401});
  }

  console.log(user?.id)

  return NextResponse.json(
    {currentUserObj},
    {status: 200}
  )
}