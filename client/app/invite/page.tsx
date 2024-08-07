'use client';

import Loading from '@/components/Loading';
import { useSocket } from '@/context/SocketProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { Suspense, useCallback, useEffect, useState } from 'react'
import qs from 'query-string'

const InvitePage = () => {
  const [host, setHost] = useState<string>("");
  const [hostId, setHostId] = useState<string>();
  const [room, setRoom] = useState<string>();
  const [isCopied, setCopied] = useState(false);
  const [isLoding, setLoading] = useState(false);
  const searchParams: any = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setRoom(searchParams.get('room'));
    setHost(searchParams.get('host'));
    setHostId(searchParams.get('id'));
  }, [searchParams])

  const handleCopyLink = useCallback(async () => {
    const query = {room, host, id: hostId};
    const url = qs.stringifyUrl({
      url: `${process.env.NEXT_PUBLIC_CLIENT_BASE_URL}/join`,
      query
    })

    room && await navigator.clipboard.writeText(url);
    setCopied(true);
  }, [room, host, hostId]);

  const handleGoToInterviewPage = useCallback(() => {
    setLoading(true);
    router.push(`/room/${room}`);
  }, [router, room])

  return (

    <div className='flex flex-col gap-12 justify-center items-center text-white h-screen w-screen'>
      <h3>Hey! we have generated invition link for you</h3>
      <div className='flex gap-4'>
        <button
          onClick={handleCopyLink}
          disabled={isCopied}
          className={'border h-fit text-sm px-6 py-1 rounded bg-lime-300 hover:bg-lime-400 text-slate-950 font-semibold'}
        >
          {isCopied ? "Coppied" : "Copy"}
        </button>
        <button
          onClick={handleGoToInterviewPage} 
          className='border h-fit text-sm px-6 py-1 rounded bg-lime-300 hover:bg-lime-400 text-slate-950 font-semibold'
        >
          {isLoding ? "Going..." : "Go to Interview screen"}
        </button>
      </div>
    </div>
  )
}
export default InvitePage