"use client"

import Image from "next/image";
import generateUniqueId from "generate-unique-id";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/context/SocketProvider";

export default function Home() {
  const router = useRouter();
  const socket = useSocket()
  const [name, setName] = useState<string>("")

  const goToInterview = useCallback(() => {
    const uurl = generateUniqueId({
      length: 32,
      useLetters: true,
    })

    socket?.emit('room:join', { name, room: uurl, host: socket.id});
    localStorage.setItem("room_id", uurl); // Saving the room_id on the host's browser
    localStorage.setItem("host", String(socket?.id));
    console.log(socket?.id)
    socket?.id && router.push(`/invite?room=${uurl}&host=${name}&id=${socket?.id}`)

  }, [router, name, socket]);

  const handleJoinRoom = useCallback((data: any) => {
    const { name, room } = data;
    console.log(name, room)
  }, [])

  useEffect(() => {
    socket?.on('room:join', (data) => handleJoinRoom(data))

    return () => {
      socket?.off('room:join', (data) => handleJoinRoom(data))
    }
  }, [socket, handleJoinRoom]);

  return (
    <section className="flex flex-col justify-evenly items-center min-h-screen text-white">
      <h1 className="text-xl font-semibold">
        Welcome to the All in One Interview plathform.
      </h1>
      <div className="flex flex-col gap-6 justify-center">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text" placeholder="Enter your name"
          className="py-2 rounded bg-transparent border border-slate-700 px-4 outline-none"
        />
        <button
          onClick={goToInterview}
          className="bg-lime-300 px-5 py-2 rounded text-slate-950 font-medium cursor-pointer hover:bg-lime-400"
        >
          Create Interview
        </button>
      </div>
    </section>
  );
}
