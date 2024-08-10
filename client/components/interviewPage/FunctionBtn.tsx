'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { FaMicrophone } from "react-icons/fa";
import { FaVideo } from "react-icons/fa";
import { MdCallEnd, MdOutlineScreenShare, MdOutlineStopScreenShare } from "react-icons/md";
import { VscVscodeInsiders } from "react-icons/vsc";
import date from 'date-and-time';
import ToggleBtn from './ToggleBtn';
import { useSocket } from '@/context/SocketProvider';
import { usePathname } from 'next/navigation';

const FunctionBtn = ({
  setToggleCode,
  toggleCode,
  toggleAudio,
  toggleVideo,
  toggleMicOn,
  toggleVideoOn,
  isHost,
  isScreenSharing,
  setScreenSharing,
  isScreenRecieving,
  isRemoteStream
}: {
  setToggleCode: any,
  toggleCode: boolean,
  toggleAudio: any,
  toggleVideo: any,
  toggleMicOn: any,
  toggleVideoOn: any,
  isHost: boolean,
  isScreenSharing: boolean,
  setScreenSharing: any,
  isScreenRecieving: boolean,
  isRemoteStream: boolean
}) => {
  const now = new Date();
  const [time, setTime] = useState<null | string>();
  const socket = useSocket();
  const url = usePathname();

  const handleOpenCode = () => {
    setToggleCode((prev: boolean) => !prev);
    if (!toggleCode) {
      socket?.emit("open:code", { room: url.slice(6) });
    } else {
      socket?.emit("close:code", { room: url.slice(6) })
    }
  };

  const handleScreenSharing = useCallback(() => {
    setScreenSharing((prev: any) => !prev);
  }, [])

  return (
    <div className={`w-screen bg-slate-950`}>
      <div className='relative grid grid-cols-3 items-center px-6 border-t-[1px] border-slate-800 pt-2 pb-2'>
        {!isRemoteStream && <div className='absolute w-full h-[50px] bg-slate-950/70 top-0 z-50' />}
        <div></div>
        <div className='flex justify-center gap-4'>
          <ToggleBtn
            key={1}
            Icon={FaMicrophone}
            onClick={toggleAudio}
            toggleMicOn={toggleMicOn}
          />
          <ToggleBtn
            key={2}
            Icon={FaVideo}
            onClick={toggleVideo}
            toggleVideoOn={toggleVideoOn}
          />
          <button className='bg-red-600 px-5 rounded-full items-center pt-[2px]'>
            <MdCallEnd size={28} />
          </button>
        </div>
        <div className='flex justify-end gap-10'>
          <button
            disabled={isScreenRecieving}
            className='cursor-pointer disabled:hover:cursor-not-allowed disabled:opacity-40'
            onClick={handleScreenSharing}
          >
            {isScreenSharing ? <MdOutlineStopScreenShare size={26} /> : <MdOutlineScreenShare size={26} />}
          </button>
          <button
            className=' disabled:hidden cursor-pointer disabled:hover:cursor-not-allowed'
            disabled={!isHost}
            onClick={handleOpenCode}
          >
            <VscVscodeInsiders size={26} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default FunctionBtn

