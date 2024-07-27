'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { LanguageSupport } from '@codemirror/language';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { cpp } from '@codemirror/lang-cpp';
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { go } from '@codemirror/lang-go';
import { rust } from '@codemirror/lang-rust';
import { material } from '@uiw/codemirror-theme-material';
import { dracula } from '@uiw/codemirror-theme-dracula';
import { LANGUAGES, STARTER_CODE } from '@/constant';
import Output from '@/components/code-editor/Output';
import { usePathname } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import { useDebouncedCallback } from 'use-debounce';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const CodePlayground = ({ isHost }: { isHost: boolean }) => {
  const [language, setLanguage] = useState("javascript");
  const [writeAccess, setWriteAccess] = useState(isHost);
  const [hostCode, setHostCode] = useState("");
  const [nonHostCode, setNonHostCode] = useState("");
  const [openCode, setOpenCode] = useState(false);
  const url = usePathname();
  const socket = useSocket();

  const EXTENSIONS: { [key: string]: LanguageSupport[] } = {
    python: [python()],
    javascript: [javascript()],
    typescript: [javascript()],
    'c++': [cpp()],
    java: [java()],
    go: [go()],
    rust: [rust()],
  };

  const onChange = useCallback((val: any) => {
    isHost ? setHostCode(val) : setNonHostCode(val);
  }, []);

  const toggleCodeAccess = useCallback(() => {
    const room = url.slice(6);
    setWriteAccess((prev) => !prev);
    socket?.emit("write:access", {room});
  }, [socket]);

  const toggleNonHostCodeAccess = useCallback(() => {
    !isHost && setWriteAccess((prev) => !prev);
  }, [])

  const sendHostCode = useDebouncedCallback(() => {
    const room = url.slice(6);
    writeAccess && socket?.emit('send:host-code', {room, code: hostCode});
  }, 1000)

  const sendNonHostCode = useDebouncedCallback(() => {
    const room = url.slice(6);
    writeAccess && socket?.emit('send:nonhost-code', {room, code: nonHostCode});
  }, 1000)

  const handleRecieveHostCode = useCallback((data: any) => {
    const {from, code} = data;
    setNonHostCode(code)
  }, [setNonHostCode]);

  const handleRecieveNonHostCode = useCallback((data: any) => {
    const {from, code} = data;
    setHostCode(code)
  }, [setHostCode])

  const handleLanguageChange = useCallback(() => {
    const room = url.slice(6);
    socket?.emit("change:language", {room, language})
  }, [socket, language]);

  const handleLanguageUpdate = useCallback((data: any) => {
    const {language} = data;
    setLanguage(language)
  }, [])

  useEffect(() => {
    handleLanguageChange();
  }, [language])

  useEffect(() => {
    sendHostCode();
    sendNonHostCode();
  }, [hostCode, nonHostCode]);

  useEffect(() => {
    socket?.on("change:language", handleLanguageUpdate);
    
    return () => {
      socket?.off("change:language", handleLanguageUpdate);
    }
  }, [socket, handleLanguageUpdate])

  useEffect(() => {
    !isHost && socket?.on('write:access', toggleNonHostCodeAccess);
    // console.log(writeAccess)
    return () => {
      socket?.on('write:access', toggleNonHostCodeAccess);
    }
  }, [socket, toggleNonHostCodeAccess, writeAccess])

  useEffect(() => {
    !writeAccess && socket?.on('recieve:host-code', handleRecieveHostCode);
    !writeAccess && socket?.on('recieve:nonhost-code', handleRecieveNonHostCode);
    return () => {
      socket?.off('recieve:host-code', handleRecieveHostCode);
      socket?.off('recieve:nonhost-code', handleRecieveNonHostCode)
    }
  }, [socket,handleRecieveHostCode, handleRecieveNonHostCode, writeAccess])


  return (
    <div className={`text-white flex flex-col h-full`}>
      <div className='text-sm relative bg-black/50 p-2'>
        <div className='flex gap-6 text-xs'>
          <h3
            className='border text-center cursor-pointer py-2 px-4 rounded border-slate-500 bg-slate-900 hover:bg-slate-950'
            onClick={() => setOpenCode((prev) => !prev)}
          >
            {language} ⬇️
          </h3>
          {isHost &&
            <button
              onClick={toggleCodeAccess}
              className='border border-slate-500 rounded px-4 bg-slate-900 hover:bg-slate-950'
            >
              {writeAccess ? "Give access 📝" : "Take access 📝"}
            </button>
          }
          {!isHost && 
            <pre className='text-lime-300 text-sm items-center align-middle flex justify-center'>
              {writeAccess ? "Write mode 📝" : "View mode 📄"}
            </pre>
          }
        </div>
        <div className={`bg-slate-950 text-xs gap-4 rounded w-[120px] absolute z-30 left-2 top-[100%] mt-1 p-4 flex flex-col ${!openCode && 'hidden'}`}>
          {Object.entries(LANGUAGES).map((lang: any, idx) => {
            return (
              <div
                key={idx}
                className={`cursor-pointer ${language != lang[0] && "text-slate-500"} hover:text-white`}
                onClick={() => { setLanguage(lang[0]), setOpenCode((prev) => !prev) }}
              >
                {lang[0]}
              </div>
            )
          })}
        </div>
      </div>
      <PanelGroup direction="vertical">
        <Panel maxSize={85}>
          <CodeMirror
            value={isHost ? hostCode : nonHostCode}
            onChange={onChange}
            autoFocus={writeAccess}
            editable={writeAccess}
            theme={dracula}
            extensions={[EXTENSIONS[language]]}
            basicSetup={{ autocompletion: false }}
            minWidth={'850px'}
            maxWidth={'650px'}
            minHeight={'500px'}
          />
        </Panel>
        <PanelResizeHandle className='h-[2px] bg-[#464a60] hover:bg-[#616686]' />
        <Panel maxSize={93} defaultSize={15} >
          <Output
            code={isHost ? hostCode : nonHostCode}
            language={language}
          />
        </Panel>
      </PanelGroup>
    </div>
  )
}

export default CodePlayground