'use client';

import { useSocket } from '@/context/SocketProvider'
import React, { useCallback, useEffect, useState } from 'react'
import FunctionBtn from '@/components/interviewPage/FunctionBtn'
import ReactPlayer from 'react-player';
import peer from '@/service/peer';
import Popup from '@/components/room/Popup';
import CodePlayground from '@/components/interviewPage/CodePlayground';
import { FaVideoSlash } from "react-icons/fa";
import { FaMicrophoneSlash } from "react-icons/fa";
import axios from 'axios';
import { CurrentUser } from '@/app/types';

const InterviewPage = () => {
  const [name, setName] = useState<null | string>(null)
  const [isHost, setHost] = useState<boolean>(false);
  const [remoteName, setRemoteName] = useState<null | string>(null)
  const [remoteSocketId, setRemoteSocketId] = useState<null | string>(null)
  const [myStream, setMyStream] = useState<any>();
  const [toggleCode, setToggleCode] = useState(false);
  const [remoteStream, setRemoteStream] = useState<any>();
  const [popup, setPopup] = useState(true);
  const socket = useSocket();
  const [toggleVideoOn, setToggleVideoOn] = useState(true);
  const [toggleMicOn, setToggleMicOn] = useState(true);
  const [remoteMicStatus, setRemoteMicStatus] = useState(true)
  const [remoteVideStatus, setRemoteVideoStatus] = useState(true);
  const [currentuser, setCurrentuser] = useState<CurrentUser | null>(null);

  const handleUserJoined = useCallback((data: any) => {
    const { name, id } = data;
    setRemoteSocketId(id)
    setRemoteName(name);
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

  const handleOpenCode = useCallback((data: any) => {
    setToggleCode(true)
  }, [toggleCode])

  const handleCloseCode = useCallback((data: any) => {
    setToggleCode(false)
  }, [toggleCode])

  // Here is the code to toggle mic and camera off/on
  const toggleAudio = useCallback(() => {
    myStream?.getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = !track.enabled;
    });
    setToggleMicOn(!toggleMicOn);
    socket?.emit('toggle:audio', { to: remoteSocketId, enabled: !toggleMicOn });
  }, [myStream, toggleMicOn, remoteSocketId, socket]);

  const toggleVideo = useCallback(() => {
    myStream?.getVideoTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = !track.enabled;
    });
    setToggleVideoOn(!toggleVideoOn);
    socket?.emit('toggle:video', { to: remoteSocketId, enabled: !toggleVideoOn });
  }, [myStream, toggleVideoOn, remoteSocketId, socket]);

  const handleVideoOff = useCallback((data: any) => {
    remoteStream?.getVideoTracks().forEach((track: MediaStreamTrack) => {
      // console.log(data)
      setRemoteVideoStatus((prev) => !prev);
      track.enabled = data.enabled;
    });
  }, [remoteStream]);

  const handleAudioOff = useCallback((data: any) => {
    remoteStream?.getAudioTracks().forEach((track: MediaStreamTrack) => {
      // console.log(data)
      setRemoteMicStatus((prev) => !prev)
      track.enabled = data.enabled;
    });
  }, [remoteStream]);

  useEffect(() => {
    axios.get('/api/get-currentuser').then((res) => {
      setCurrentuser(res.data.currentUserObj)
      // console.log(res.data.currentUserObj)
    }).catch((err) => {
      console.log(err)
    })
  }, [])


  useEffect(() => {
    if (socket?.id === localStorage.getItem("host")) {
      setHost(true);
    }
  }, [socket?.id])

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
    socket?.on('opened:code', handleOpenCode)
    socket?.on('closed:code', handleCloseCode);
    socket?.on('video:off', handleVideoOff)
    socket?.on('audio:off', handleAudioOff)

    return () => {
      socket?.off("user:joined", handleUserJoined);
      socket?.off("incomming:call", handleIncomingCall)
      socket?.off("call:accepted", handleCallAccept)
      socket?.off("peer:nego:needed", handleNegoNeededIncomming)
      socket?.off('peer:nego:final', handleNegoNeedFinal)
      socket?.off('opened:code', handleOpenCode)
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
    handleOpenCode,
    remoteStream
  ]);


  return (
    <div className='flex relative flex-col justify-between h-screen items-center'>
      <section className='py-2 w-full text-center border-b border-slate-800'>
        🎉 Welcome - {currentuser?.name} 🎉
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
      <section className={`${!toggleCode ? "w-[90%]" : "w-[100%] pl-2"} h-full relative overflow-hidden pt-`}>
        <div className='absolute top-2 rounded overflow-hidden w-[180px] drop-shadow-lg z-30'>
          {!toggleVideoOn ? (
            <div className='bg-slate-700 flex flex-col items-center justify-center w-full h-[134px]'>
              <FaVideoSlash size={35} />
              {!toggleMicOn && <FaMicrophoneSlash size={35} />}
            </div>
          ) : myStream && (
            <div className='relative w-fit h-fit'>
              {!toggleMicOn && <div className='bg-black/20 w-full h-full absolute flex justify-center items-center'>
                <FaMicrophoneSlash size={35} />
              </div>}
              <ReactPlayer
                playing
                muted
                width='180px'
                height='auto'
                url={myStream}
              />
            </div>
          )}
        </div>
        <div className='flex justify-between h-full align-baseline items-end gap-4'>
          <div className={`flex  w-full justify-center items-center mx-auto relative z-20  ${toggleCode ? "rounded overflow-hidden mb-2 flex justify- items-end" : "h-full"}`}>
            {remoteStream &&
              <>
                {!remoteMicStatus &&
                  <FaMicrophoneSlash size={35} className={`absolute ${toggleCode ? "bottom-3 left-3" : "bottom-[7rem] left-6"} text-red-600 `} />
                }
                <ReactPlayer
                  playing
                  width="100%"
                  height="100%"
                  url={remoteStream}
                />
              </>
            }
          </div>
          {toggleCode &&
            <div className='max-w-[60%] h-full z-20 bg-[#282A36]'>
              <CodePlayground isHost={isHost} />
            </div>
          }
        </div>
      </section>

      <section className='z-30'>
        <FunctionBtn
          setToggleCode={setToggleCode}
          toggleCode={toggleCode}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
          toggleMicOn={toggleMicOn}
          toggleVideoOn={toggleVideoOn}
          isHost={isHost}
        />
      </section>
    </div>
  )
}

export default InterviewPage