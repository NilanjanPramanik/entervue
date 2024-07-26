'use client';

import { useSocket } from '@/context/SocketProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react'

const JoinPage = () => {
  const [name, setName] = useState<string>("")
  const [host, setHost] = useState('');
  const [hostId, setHostId] = useState('');
  const searchParams: any = useSearchParams();
  const router = useRouter();
  const socket = useSocket()

  const joinToInterview = useCallback(() => {
    const roomId = searchParams.get('room');
    socket?.emit('room:join', { name, room: roomId });
    router.push(`/room/${roomId}`)

  }, [router, name, searchParams, socket]);


  const handleJoinRoom = useCallback((data: any) => {
    const { name, room } = data;
    localStorage.setItem("room_id", room);
    if (hostId) {
      localStorage.setItem("host", hostId);
    }
    console.log(name, room)
  }, [])

  useEffect(() => {
    setHost(searchParams.get('host'));
    setHostId(searchParams.get('id'));
    // console.log(host)
  }, [searchParams])


  useEffect(() => {
    socket?.on('room:join', (data) => handleJoinRoom(data))

    return () => {
      socket?.off('room:join', (data) => handleJoinRoom(data))
    }
  }, [socket, handleJoinRoom]);


  return (
    <div className='flex gap-14 text-white h-screen w-screen flex-col justify-center items-center'>
      <div>
        <h2 className='text-lg font-bold'>Congratulation!</h2>
        <p className='text-balance font-light'>You have a Interview with Mr. {host}</p>
      </div>
      <div className='flex  gap-6'>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          type="text"
          placeholder='Your Name'
          className='py-2 rounded text-sm bg-transparent border border-slate-700 px-4 outline-none'
        />
        <button
          onClick={joinToInterview}
          className='border h-fit text-sm px-6 py-2 rounded bg-lime-300 hover:bg-lime-400 text-slate-950 font-semibold'
        >
          Go to Interview screen
        </button>
      </div>
    </div>
  )
}

export default JoinPage