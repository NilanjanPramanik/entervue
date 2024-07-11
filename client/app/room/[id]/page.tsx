'use client';

import { useSocket } from '@/context/SocketProvider'
import { useParams, usePathname } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react'
import FunctionBtn from '@/components/interviewPage/FunctionBtn'
import ReactPlayer from 'react-player';
import peer from '@/service/peer';

interface PopupProps {
  setPopup: React.Dispatch<React.SetStateAction<boolean>>,
  handleVideoStream: () => void,
  remoteSocketId: null | string,
  sendStreams: () => void,
  remoteStream: any
}

const Popup: React.FC<PopupProps> = ({
  setPopup,
  handleVideoStream,
  remoteSocketId,
  sendStreams,
  remoteStream
}) => {
  return (
    <div
      onClick={() => setPopup(false)}
      className='fixed h-screen w-screen bg-black/60 flex justify-center items-center z-20'
    >
      <div className='border h-[200px] w-[340px] bg-slate-900 flex flex-col justify-evenly items-center rounded border-slate-800 gap-4'>
        <div>
          <h2 className='text-lg font-bold'>
            Please Wait!
          </h2>
          <h3 className='text-sm font-light opacity-70'>
            Let us set everything up for you!
          </h3>
        </div>
        <div className='flex gap-4 text-sm font-semibold'>
          <button
            onClick={handleVideoStream}
            className={`border h-fit px-6 py-1 rounded bg-lime-300 hover:bg-lime-400 text-slate-950 ${!remoteSocketId && "cursor-not-allowed opacity-30"}`}
          >
            Accept to Join
          </button>
          <button
            onClick={sendStreams}
            className={`border h-fit px-6 py-1 rounded bg-lime-300 hover:bg-lime-400 text-slate-950 ${!remoteStream && "cursor-not-allowed opacity-30"}`}
          >
            Send Stream
          </button>
        </div>
      </div>
    </div>
  )
}

const InterviewPage = () => {
  const [name, setName] = useState<null | string>(null)
  const [remoteSocketId, setRemoteSocketId] = useState<null | string>(null)
  const [myStream, setMyStream] = useState<any>();
  const [remoteStream, setRemoteStream] = useState<any>();
  const [popup, setPopup] = useState(true);
  const socket = useSocket();

  const handleUserJoined = useCallback((data: any) => {
    const { name, id } = data;
    setRemoteSocketId(id)
    setName(name);
    console.log(name, id)
  }, [])

  const handleVideoStream = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })

    const offer = await peer.getOffer();
    socket?.emit("user:call", { to: remoteSocketId, offer });

    setMyStream(stream);
  }, [socket, remoteSocketId]);


  const handleIncomingCall = useCallback(async (data: any) => {
    const { from, offer } = data;
    setRemoteSocketId(from)
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    })

    setMyStream(stream);

    const ans = await peer.getAnswer(offer)

    socket?.emit("call:accepted", { to: from, ans });
  }, [])

  const sendStreams = useCallback(() => {
    for (const track of myStream?.getTracks()) {
      myStream && peer.peer?.addTrack(track, myStream);
    }
  }, [myStream])


  const handleCallAccept = useCallback((data: any) => {
    const { from, ans } = data;
    peer.setLocalDescription(ans);
    console.log("Call Accepted");
    sendStreams();

  }, [sendStreams]);

  const handleNegoNeeded = useCallback(async () => {
    const offer = await peer.getOffer();
    socket?.emit('peer:nego:needed', { to: remoteSocketId, offer });
  }, [socket, remoteSocketId]);

  const handleNegoNeededIncomming = useCallback(async (data: any) => {
    const { from, offer } = data;
    const ans = await peer.getAnswer(offer);
    socket?.emit("peer:nego:done", { to: from, ans });
  }, [socket])

  const handleNegoNeedFinal = useCallback(async (data: any) => {
    const { from, ans } = data;
    await peer.setLocalDescription(ans);
  }, []);


  useEffect(() => {
    peer.peer?.addEventListener('negotiationneeded', handleNegoNeeded);

    return () => {
      peer.peer?.removeEventListener('negotiationneeded', handleNegoNeeded);
    }
  }, [handleNegoNeeded])

  useEffect(() => {
    peer.peer?.addEventListener('track', async (ev) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream(remoteStream[0]);
    })
  }, [])

  useEffect(() => {
    socket?.on("user:joined", handleUserJoined);
    socket?.on("incomming:call", handleIncomingCall)
    socket?.on("call:accepted", handleCallAccept)
    socket?.on("peer:nego:needed", handleNegoNeededIncomming)
    socket?.on('peer:nego:final', handleNegoNeedFinal)

    return () => {
      socket?.off("user:joined", handleUserJoined);
      socket?.off("incomming:call", handleIncomingCall)
      socket?.off("call:accepted", handleCallAccept)
      socket?.off("peer:nego:needed", handleNegoNeededIncomming)
      socket?.off('peer:nego:final', handleNegoNeedFinal)
    }
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccept,
    handleNegoNeededIncomming,
    handleNegoNeedFinal
  ]);


  return (
    <div className='flex relative flex-col justify-between h-screen items-center'>
      <section className='py-1 w-full text-center border-b border-slate-800'>
        Welcome
      </section>
      {popup &&
        <Popup
          handleVideoStream={handleVideoStream}
          remoteSocketId={remoteSocketId}
          remoteStream={remoteStream}
          sendStreams={sendStreams}
          setPopup={setPopup}
        />
      }
      <section className='w-[80%] overflow-hidden flex justify-between items-center pt-1'>
        <div className='absolute -top-12 left-6'>
          {myStream &&
            <ReactPlayer
              playing
              muted
              width='200px'
              url={myStream}
            />
          }
        </div>
        <div className='rounded w-full h-full overflow-hidden flex justify-end'>
          {remoteStream &&
            <ReactPlayer
              playing
              width="100%"
              height="100%"
              url={remoteStream}
            />
          }
        </div>
      </section>
      <section>
        <FunctionBtn />
      </section>
    </div>
  )
}

export default InterviewPage