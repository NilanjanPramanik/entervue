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
import { usePathname, useSearchParams } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
import { useDebouncedCallback } from 'use-debounce';
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

const CodePlayground = ({ isHost }: { isHost: boolean }) => {
  const [language, setLanguage] = useState("javascript");
  const [value, setValue] = useState("//Start Coding");
  const [hostCode, setHostCode] = useState("");
  const [nonHostCode, setNonHostCode] = useState("");
  const [recieveValue, setRecieveValue] = useState<null | string>(null);
  const [outputValue, setOutputValue] = useState("Run the code.")
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

  const sendHostCode = useCallback(() => {
    const room = url.slice(6);
    socket?.emit('send:host-code', {room, code: hostCode});
  }, [socket, hostCode]);

  const sendNonHostCode = useCallback(() => {
    const room = url.slice(6);
    socket?.emit('send:nonhost-code', {room, code: nonHostCode});
  }, [socket, nonHostCode]);

  const handleRecieveHostCode = useCallback((data: any) => {
    const {from, code} = data;
    !isHost && setNonHostCode(code)
  }, [setNonHostCode]);

  const handleRecieveNonHostCode = useCallback((data: any) => {
    const {from, code} = data;
    isHost && setHostCode(code)
  }, [setHostCode])

  useEffect(() => {
    isHost && sendHostCode();
    !isHost && sendNonHostCode();
  }, [hostCode, nonHostCode]);

  useEffect(() => {
    !isHost && socket?.on('recieve:host-code', handleRecieveHostCode);
    isHost && socket?.on('recieve:nonhost-code', handleRecieveNonHostCode);
    return () => {
      socket?.off('recieve:host-code', handleRecieveHostCode);
      socket?.off('recieve:nonhost-code', handleRecieveNonHostCode)
    }
  }, [socket,handleRecieveHostCode, handleRecieveNonHostCode])


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
              // onClick={}
              className='border border-slate-500 rounded px-4 bg-slate-900 hover:bg-slate-950'
            >
              Give access 📝
            </button>
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
            theme={dracula}
            extensions={[EXTENSIONS[language]]}
            basicSetup={{ autocompletion: false }}
            minWidth={'850px'}
            maxWidth={'650px'}
            minHeight={'500px'}
          />
        </Panel>
        <PanelResizeHandle className='h-[2px] bg-[#464a60] hover:bg-[#616686]' />
        <Panel maxSize={93} defaultSize={15}>
          <Output
            code={value}
            language={language}
            setOutputValue={setOutputValue}
            outputValue={outputValue}
          />
        </Panel>
      </PanelGroup>
    </div>
  )
}

export default CodePlayground