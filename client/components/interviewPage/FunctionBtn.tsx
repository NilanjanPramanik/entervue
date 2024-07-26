'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { FaMicrophone } from "react-icons/fa";
import { FaVideo } from "react-icons/fa";
import { MdCallEnd } from "react-icons/md";
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
  isHost
}: {
  setToggleCode: any,
  toggleCode: boolean,
  toggleAudio: any,
  toggleVideo: any,
  toggleMicOn: any,
  toggleVideoOn: any,
  isHost: boolean
}) => {
  const now = new Date();
  const [time, setTime] = useState<null | string>();
  const socket = useSocket();
  const url = usePathname();

  const handleOpenCode = () => {
    setToggleCode((prev: boolean) => !prev);
    if(!toggleCode) {
      socket?.emit("open:code", {room: url.slice(6)});
    } else {
      socket?.emit("close:code", {room: url.slice(6)})
    }
  };

  // const handleVideoOnOff = () => {
  //   setToggleVideoOn((prev: boolean)=>!prev);
  // }

  // const handleMicOnOff = () => {
  //   setToggleMicOn((prev: boolean)=>!prev);
  // }

  // useEffect(() => {
  //   const interval = setInterval(() => setTime(date.format(now, 'hh:mm:ss A')), 1000);

  //   return () => {
  //     clearInterval(interval);
  //   };
  // }, [time, now])


  return (
    <div className='w-screen bg-slate-950'>
      <div className='grid grid-cols-3 items-center px-6 border-t-[1px] border-slate-800 pt-2 pb-2'>
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
        <div className='flex justify-end'>
          <button className=' disabled:opacity-45 cursor-pointer disabled:hover:cursor-not-allowed' disabled={!isHost} onClick={handleOpenCode}>
            <VscVscodeInsiders size={26} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default FunctionBtn