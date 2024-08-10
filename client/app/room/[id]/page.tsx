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
import { CurrentUser } from '@/app/types';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import toast from 'react-hot-toast';

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
  const [isScreenSharing, setScreenSharing] = useState(false);
  const [isScreenRecieving, setScreenRecieving] = useState(false);

  const handleUserJoined = useCallback((data: any) => {
    const { name, id } = data;
    setRemoteSocketId(id)
    setRemoteName(name);
    console.log(name, id)
  }, [])

  const handleVideoStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      })

      const offer = await peer.getOffer();
      socket?.emit("user:call", { to: remoteSocketId, offer });

      setMyStream([stream]);
      stream && setPopup(false);
    } catch (error) {
      console.log(error);
      toast.error("Camera and Mic permission denied. Please turn it on to continue.")
    }
  }, [socket, remoteSocketId]);
  // console.log(myStream)


  const handleIncomingCall = useCallback(async (data: any) => {
    const { from, offer } = data;
    setRemoteSocketId(from)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      })
      setMyStream([stream]);

      const ans = await peer.getAnswer(offer)

      socket?.emit("call:accepted", { to: from, ans });
    } catch (error) {
      console.log(error)
      toast.error("Camera and Mic permission denied. Please turn it on to continue.")
    }
  }, [socket])

  const sendStreams = useCallback(() => {
    for (const track of myStream[0]?.getTracks()) {
      myStream && peer.peer?.addTrack(track, myStream[0]);
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

  const sendScreenStream = useCallback((updatedStreams: any[]) => {
    // console.log(updatedStreams);
    if (updatedStreams[1]) {
      for (const stream of updatedStreams[1]?.getTracks()) {
        peer.peer?.addTrack(stream, updatedStreams[1]);
      }
      console.log("Screen share starting...")
    }
    else {
      console.error("No screen stream available.");
    }
  }, [])

  const stopScreenStream = useCallback((updatedStreams: any[]) => {
    if (myStream && myStream[1]) {
      const tracks = updatedStreams[1].getTracks();
      tracks.forEach((track: any) => {
        const sender = peer.peer?.getSenders().find(s => s.track === track);
        if (sender) {
          peer.peer?.removeTrack(sender);
        }
      });
      // Optionally, stop the tracks
      updatedStreams[1].getTracks().forEach((track: any) => track.stop());
      setMyStream([updatedStreams[0]])
      console.log("Stopped adding screen stream")
      console.log("MY Stream", myStream)
    }
  }, [myStream, peer.peer])

  const startScreenSharing = useCallback(async () => {
    if (isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        })
        // console.log("screenStream: ", screenStream)
        const updatedStreams = [...myStream, screenStream];
        // console.log("UpdatedStream: ", updatedStreams)
        setMyStream(updatedStreams);
        // console.log(myStream)
        sendScreenStream(updatedStreams)

        socket?.emit('share:screen', { to: remoteSocketId })

        screenStream.getTracks()[0].onended = () => {
          const videoStream = myStream[0];
          // setMyStream(null)
          setMyStream([videoStream]);
          setScreenSharing(false);
          console.log("ENDED", isScreenSharing)
          socket?.emit("screen:stop", { to: remoteSocketId });
        }
      } catch (error) {
        console.log("ERROR: ", error);
      }
    }
    else {
      socket?.emit("screen:stop", { to: remoteSocketId });
      stopScreenStream(myStream)
    }
  }, [remoteSocketId, socket, myStream, isScreenSharing, stopScreenStream, sendScreenStream]);


  const handleRecieveScreenSharing = useCallback(() => {
    console.log("Screen Sharing on");
    peer.peer?.addEventListener('track', async (ev) => {
      const remoteScreenStream = ev.streams;
      console.log("SCREEN STREAM!!");
      setScreenRecieving(true);
      // console.log(remoteScreenStream);
      setRemoteStream([...remoteStream, remoteScreenStream[0]]);
    })
  }, [remoteStream]);

  const handleStopScreenSharing = useCallback(() => {
    console.log('Screen sharing stopped.');
    if (remoteStream && remoteStream.length > 1) {
      const remainingStream = remoteStream[0];
      setRemoteStream([remainingStream]);
      setScreenRecieving(false);
      // console.log("Updated remote stream: ", remainingStream)
    }
    else {
      console.error("No remote stream available.");
    }
  }, [remoteStream])


  const handleOpenCode = useCallback((data: any) => {
    setToggleCode(true)
  }, [toggleCode])

  const handleCloseCode = useCallback((data: any) => {
    setToggleCode(false)
  }, [toggleCode])

  // Here is the code to toggle mic and camera off/on
  const toggleAudio = useCallback(() => {
    myStream[0]?.getAudioTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = !track.enabled;
    });
    setToggleMicOn(!toggleMicOn);
    socket?.emit('toggle:audio', { to: remoteSocketId, enabled: !toggleMicOn });
  }, [myStream, toggleMicOn, remoteSocketId, socket]);

  const toggleVideo = useCallback(() => {
    myStream[0]?.getVideoTracks().forEach((track: MediaStreamTrack) => {
      track.enabled = !track.enabled;
    });
    setToggleVideoOn(!toggleVideoOn);
    socket?.emit('toggle:video', { to: remoteSocketId, enabled: !toggleVideoOn });
  }, [myStream, toggleVideoOn, remoteSocketId, socket]);

  const handleVideoOff = useCallback((data: any) => {
    remoteStream[0]?.getVideoTracks().forEach((track: MediaStreamTrack) => {
      // console.log(data)
      setRemoteVideoStatus((prev) => !prev);
      track.enabled = data.enabled;
    });
  }, [remoteStream]);

  const handleAudioOff = useCallback((data: any) => {
    remoteStream[0]?.getAudioTracks().forEach((track: MediaStreamTrack) => {
      // console.log(data)
      setRemoteMicStatus((prev) => !prev)
      track.enabled = data.enabled;
    });
  }, [remoteStream]);

  useEffect(() => {
    localStorage.removeItem("code")
    if (sessionStorage.getItem("name")) {
      setCurrentuser({
        ...currentuser,
        //@ts-ignore
        name: sessionStorage.getItem("name")
      })
    }
  }, [])


  useEffect(() => {
    if (socket?.id === sessionStorage.getItem("host")) {
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
    const handleTrackEv = async (ev: any) => {
      const remoteStream = ev.streams;
      console.log("GOT TRACKS!!");
      setRemoteStream([remoteStream[0]]);
    }
    peer.peer?.addEventListener('track', handleTrackEv)

    return () => {
      peer.peer?.removeEventListener('track', handleTrackEv)
    }
  }, [])

  useEffect(() => {
    startScreenSharing()
  }, [isScreenSharing])

  useEffect(() => {
    socket?.on("share:screen", handleRecieveScreenSharing);
    socket?.on("screen:stop", handleStopScreenSharing);

    return () => {
      socket?.off("share:screen", handleRecieveScreenSharing);
      socket?.off("screen:stop", handleStopScreenSharing);
    };
  }, [socket, handleRecieveScreenSharing, handleStopScreenSharing]);

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
    remoteStream,
  ]);

  // console.log(isScreenRecieving)
  console.log(remoteStream)
  console.log(myStream)


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
          myStream={myStream}
          sendStreams={sendStreams}
          setPopup={setPopup}
          remoteName={remoteName}
          isHost={isHost}
        />
      }
      <section className={`${!toggleCode ? "w-[90%]" : "w-[100%] pl-2"} h-full relative overflow-hidden pt-`}>
        <div className='absolute top-2 rounded overflow-hidden w-[180px] drop-shadow-lg z-30'>
          {!toggleVideoOn ? (
            <div className='bg-slate-700 flex flex-col items-center justify-center w-full h-[134px]'>
              <FaVideoSlash size={35} />
              {!toggleMicOn && <FaMicrophoneSlash size={35} />}
            </div>
          ) : (myStream && !isScreenRecieving) && (
            <div className='relative w-fit h-fit'>
              {!toggleMicOn && <div className='bg-black/20 w-full h-full absolute flex justify-center items-center'>
                <FaMicrophoneSlash size={35} />
              </div>}
              <ReactPlayer
                playing
                muted
                width='180px'
                height='auto'
                url={myStream[0]}
              />
            </div>
          )}
        </div>

        {isScreenRecieving && (
          <div className='absolute top-2 rounded overflow-hidden w-[180px] drop-shadow-lg z-30'>
            {remoteStream && (
              <div className='relative w-fit h-fit flex justify-center items-center'>
                {!remoteMicStatus &&
                  <FaMicrophoneSlash size={35} className={`absolute text-red-600`} />
                }
                <ReactPlayer
                  playing
                  muted
                  width='180px'
                  height='auto'
                  url={remoteStream[0]}
                />
              </div>
            )}

          </div>
        )}

        <div className='flex justify-between h-full w-full align-baseline items-end'>
          <PanelGroup direction='horizontal' className=''>
            <Panel maxSize={100} className={`flex w-full justify-center items-center mx-auto relative z-20 ${toggleCode ? "rounded overflow-hidden flex pr-2 items-end" : "h-full"}`}>
              {/* <div className={`flex w-full justify-center items-center mx-auto relative z-20 ${isScreenRecieving && "hidden"} ${toggleCode ? "rounded overflow-hidden mb-2 flex justify- items-end" : "h-full"}`}> */}
              <div className={`h-full ${isScreenRecieving && "hidden"}`}>
                {(remoteStream && !isScreenRecieving) &&
                  <>
                    {!remoteMicStatus &&
                      <div className='flex absolute justify-center items-end pl-4 pb-4 h-full'>
                        <FaMicrophoneSlash size={45} className={`text-red-600`} />
                      </div>
                    }
                    <ReactPlayer
                      playing
                      width='100%'
                      height='100%'
                      url={remoteStream[0]}
                    />
                  </>
                }
              </div>
              {/* </div> */}

              {isScreenRecieving && (
                <div className={`flex w-full justify-center items-center mx-auto relative z-20  ${toggleCode ? "rounded overflow-hidden mb-2 flex justify- items-end" : "h-full"}`}>
                  {remoteStream?.[1] &&
                    <>
                      {/* {!remoteMicStatus &&
                    <FaMicrophoneSlash size={45} className={`absolute text-red-600`} />
                    } */}
                      <ReactPlayer
                        playing
                        width='100%'
                        height='100%'
                        url={remoteStream[1]}
                      />
                    </>
                  }
                </div>
              )}
            </Panel>
            <PanelResizeHandle className={`w-[2px] bg-[#464a60] hover:bg-[#616686] ${!toggleCode && "hidden"}`} />
            <Panel minSize={25} maxSize={70} className={`${!toggleCode && "hidden"}`}>
              {toggleCode &&
                <div className='max-w-[60% h-full z-20 bg-[#282A36]'>
                  <CodePlayground isHost={isHost} />
                </div>
              }
            </Panel>
          </PanelGroup>
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
          isScreenSharing={isScreenSharing}
          setScreenSharing={setScreenSharing}
          isScreenRecieving={isScreenRecieving}
          isRemoteStream={remoteStream ? true : false}
        />
      </section>
    </div>
  )
}

export default InterviewPage
