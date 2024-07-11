'use client';

import { useSocket } from '@/context/SocketProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react'

const InvitePage = () => {
  const [name, setName] = useState<string>("")
  const [room, setRoom] = useState<string>();
  const searchParams: any = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setRoom(searchParams.get('room'));
    setName(searchParams.get('host'));
  }, [])

  const handleCopyLink = useCallback(async () => {
    room && await navigator.clipboard.writeText(
      `http://localhost:3000/join?room=${room}&host=${name}`
    )
  }, [searchParams, room, name]);

  return (
    <div className='flex flex-col gap-12 justify-center items-center text-white h-screen w-screen'>
      <h3>Hey! we have generated invition link for you</h3>
      <div className='flex gap-4'>
        <button
          onClick={handleCopyLink}
          className='border h-fit text-sm px-6 py-1 rounded bg-lime-300 hover:bg-lime-400 text-slate-950 font-semibold'
        >
          Copy
        </button>
        <button
          onClick={() => router.push(`/room/${room}`)}
          className='border h-fit text-sm px-6 py-1 rounded bg-lime-300 hover:bg-lime-400 text-slate-950 font-semibold'
        >
          Go to Interview screen
        </button>
      </div>
    </div>
  )
}
export default InvitePage