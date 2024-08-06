"use client"

import Image from "next/image";
import generateUniqueId from "generate-unique-id";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/context/SocketProvider";
import { BallTriangle } from "react-loader-spinner"
import axios from "axios";
import { SignIn, SignInButton, SignOutButton } from "@clerk/nextjs";
import { CurrentUser } from "./types";

export default function Home() {
  const router = useRouter();
  const socket = useSocket()
  const [name, setName] = useState<string>("")
  const [isLoading, setLoading] = useState(false);
  const [currentuser, setCurrentuser] = useState<CurrentUser | null>(null);
  const [SigninPopup, setSigninPopup] = useState(false);

  const goToInterview = useCallback(() => {
    const uurl = generateUniqueId({
      length: 32,
      useLetters: true,
    })

    socket?.emit('room:join', { name, room: uurl, host: socket.id });
    localStorage.setItem("room_id", uurl); // Saving the room_id on the host's browser
    localStorage.setItem("host", String(socket?.id));
    console.log(socket?.id)
    setLoading(true);
    socket?.id && router.push(`/invite?room=${uurl}&host=${currentuser?.name}&id=${socket?.id}`)

  }, [router, currentuser?.name, socket, socket?.id]);

  const handleRedirectToSignInPage = useCallback(() => {
    router.push('/auth')
  }, [router])

  useEffect(() => {
    axios.get('/api/get-currentuser').then((res) => {
      setCurrentuser(res.data.currentUserObj)
    }).catch((err) => {
      console.log(err)
    })
  }, [])


  return (
    <section className="flex flex-col relative justify-evenly items-center min-h-screen text-white">
      <header className="fixed top-0 bg-white/10 backdrop-blur-md w-full justify-end flex px-6 py-4 text-sm z-50">
        <div className="border-slate-500 border rounded px-3 py-1 hover:bg-rose-600">
          {currentuser ? <SignOutButton /> : <SignInButton />}
        </div>
      </header>

      <div className="flex flex-col items-center">
        <Image src={'/img/logo.png'} alt="logo" height={300} width={300} className="realtive z-20" />
        <h1 className="text-xl font-semibold">
          👋 Welcome {currentuser?.name} to the All in One Interview plathform 🧑🏻‍💻🎯.
        </h1>
      </div>

      {!currentuser ? (
        // <SignInButton />
        <>
          <div className="bg-lime-300 px-5 py-2 rounded text-slate-950 font-medium cursor-pointer hover:bg-lime-400">
            <SignInButton />
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-6 justify-center z-20">
          {/* <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            type="text" placeholder="Enter your name"
            className="py-2 rounded bg-transparent border border-slate-700 px-4 outline-none"
          /> */}
          <button
            onClick={goToInterview}
            className="bg-lime-300 px-5 py-2 rounded text-slate-950 font-medium cursor-pointer hover:bg-lime-400"
          >
            {isLoading ? "Creating..." : "Create Instant Interview"}
          </button>
        </div>
      )}
      <Image src={'/img/gradient.png'} alt="gradient" height={900} width={900} className="absolute bottom-0 opacity-30 z-10" />
    </section>
  );
}
