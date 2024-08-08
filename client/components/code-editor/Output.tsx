"use client";

import React, { useCallback, useEffect, useState } from 'react'
import axios from 'axios'
import { LANGUAGES } from '@/constant';
import { useSocket } from '@/context/SocketProvider';
import { usePathname } from 'next/navigation';

const Output = ({
  code, language,
}: {
  code: string,
  language: string,
}) => {
  const [output, setOutput] = useState('Run the code.')
  const [isErr, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const socket = useSocket();
  const url = usePathname();
  const [keysPressed, setKeysPressed] = useState<any>({});

  const handleOutput = useCallback(async () => {
    setErr(false);
    if (!code || !language) {
      return
    }
    try {
      setLoading(true);
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/execute`, {
        "language": language,
        //@ts-ignore
        "version": LANGUAGES[language],
        "files": [
          {
            "content": code
          }
        ],
      }).then((res) => {
        setOutput(res.data.run.output);
        if (res.data.run.code === 1) {
          setErr(true);
        }
      }).finally(() => {
        setLoading(false)
      })

    } catch (error) {
      console.log(error)
    }
  }, [code, language]);

  const handleSendOutput = useCallback(() => {
    const room = url.slice(6);
    socket?.emit("send:output", { room, output, error: isErr });
  }, [socket, output])

  const handleRecieveOutput = useCallback((data: any) => {
    const { output, error } = data;
    setOutput(output);
    setErr(error);
  }, []);

  // const handleKeyDownCapture = (event: any) => {
  //   setKeysPressed((prevKeys: any) => ({
  //     ...prevKeys,
  //     [event.key]: true,
  //   }));
  // };

  // const handleKeyUpCapture = (event: any) => {
  //   setKeysPressed((prevKeys: any) => ({
  //     ...prevKeys,
  //     [event.key]: false,
  //   }));
  // };

  // useEffect(() => {
  //   if (keysPressed['Control'] && keysPressed['Enter']) {
  //     // handleOutput();
  //     console.log("first")
  //   }
  // }, [keysPressed, handleOutput]);

  useEffect(() => {
    handleSendOutput();
    socket?.on("recieve:output", handleRecieveOutput);

    return () => {
      socket?.off("recieve:output", handleRecieveOutput);
    }
  }, [socket, handleRecieveOutput, handleSendOutput])


  return (
    <div className='max-w-[850px] h-full bg-[#22242e] py-3'>
      <button
        disabled={!code || loading}
        onClick={handleOutput}
        // onKeyDownCapture={handleKeyDownCapture}
        // onKeyUpCapture={handleKeyUpCapture}
        className={`absolute top-2 border w-fit border-slate-500 right-4 text-xs rounded p-2 disabled:cursor-not-allowe disabled:opacity-30 bg-slate-900 hover:bg-slate-950 ${loading && "cursor-wait"}`}
      >
        {loading ? "Running..." : "Run code"}
      </button>
      <div className='text-base font-medium px-4 flex gap-2 pb-8 h-[100%] overflow-y-scroll'>
        {/* <pre>&gt;&gt;</pre> */}
        <pre>👉</pre>
        <div className={`${loading && "hidden"}`}>
          {!isErr ? (
            <pre className='text-green-700'>{output}</pre>
          ) : (
            <pre className='text-red-600'>{output}</pre>
          )}
        </div>
      </div>
    </div>
  )
}

export default Output