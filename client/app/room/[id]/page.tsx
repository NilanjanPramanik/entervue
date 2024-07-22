'use client';

import { useSocket } from '@/context/SocketProvider'
import React, { useCallback, useEffect, useState } from 'react'
import FunctionBtn from '@/components/interviewPage/FunctionBtn'
import ReactPlayer from 'react-player';
import peer from '@/service/peer';
import Popup from '@/components/room/Popup';
import CodePlayground from '@/components/interviewPage/CodePlayground';

const InterviewPage = () => {
  const [name, setName] = useState<null | string>(null)
  const [remoteSocketId, setRemoteSocketId] = useState<null | string>(null)
  const [myStream, setMyStream] = useState<any>();
  const [toggleCode, setToggleCode] = useState(false);
  const [remoteStream, setRemoteStream] = useState<any>();
  const [popup, setPopup] = useState(true);
  const socket = useSocket();
  const [toggleVideoOn, setToggleVideoOn] = useState(true);
  const [toggleMicOn, setToggleMicOn] = useState(true);

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
    stream && setPopup(false);
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
  }, [socket])

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

  // Here is the code to toggle mic and camera off/on
  const toggleAudio = useCallback(() => {
    myStream?.getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = !track.enabled;
    });
    setToggleMicOn(!toggleMicOn);
    socket?.emit('toggle:audio', { to: remoteSocketId, enabled: !toggleMicOn });
  }, [myStream, toggleMicOn, remoteSocketId]);

  const toggleVideo = useCallback(() => {
    myStream?.getVideoTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = !track.enabled;
    });
    setToggleVideoOn(!toggleVideoOn);
    socket?.emit('toggle:video', { to: remoteSocketId, enabled: !toggleVideoOn });
  }, [myStream, toggleVideoOn, remoteSocketId]);

  const handleVideoOff = useCallback((data: any) => {
    remoteStream?.getVideoTracks().forEach((track: MediaStreamTrack) => {
      console.log(data)
      track.enabled = data.enabled;
    });
  }, [remoteStream]);

  const handleAudioOff = useCallback((data:any) => {
    remoteStream?.getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = data.enabled;
    });
  }, [remoteStream]);



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
    socket?.on('video:off', handleVideoOff)
    socket?.on('audio:off', handleAudioOff)

    return () => {
      socket?.off("user:joined", handleUserJoined);
      socket?.off("incomming:call", handleIncomingCall)
      socket?.off("call:accepted", handleCallAccept)
      socket?.off("peer:nego:needed", handleNegoNeededIncomming)
      socket?.off('peer:nego:final', handleNegoNeedFinal)
      socket?.off('video:off', handleVideoOff)
      socket?.off('audio:off', handleAudioOff)
      socket?.off('toggle:audio');
      socket?.off('toggle:video');
    }
  }, [
    socket,
    handleUserJoined,
    handleIncomingCall,
    handleCallAccept,
    handleNegoNeededIncomming,
    handleNegoNeedFinal,
    remoteStream
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
      <section className='z-30'>
        <FunctionBtn 
          setToggleCode={setToggleCode} 
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          toggleMicOn={toggleMicOn}
          toggleVideoOn={toggleVideoOn}
        />
      </section>

      {toggleCode &&
        <div className='absolute right-0 top-0 pt-2 h-screen z-20 bg-[#2E3235]'>
          <CodePlayground />
        </div>
      }
    </div>
  )
}

export default InterviewPage