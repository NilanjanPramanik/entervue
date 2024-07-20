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
import { LANGUAGES, STARTER_CODE } from '@/constant';
import Output from '@/components/code-editor/Output';
import { usePathname, useSearchParams } from 'next/navigation';
import { useSocket } from '@/context/SocketProvider';
// import { debounce } from '@/lib/debounce';
import {useDebouncedCallback} from 'use-debounce';

const CodePlayground = () => {
  const [language, setLanguage] = useState("javascript");
  const [value, setValue] = useState("//Start Coding");
  const [recieveValue, setRecieveValue] = useState<null|string>(null);
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
    setValue(val);
  }, []);

  const sendCodeToSocket = useCallback(() => {
    const room:string = url.slice(6, url.length);
    socket?.emit("code-share", {room, code:value, language, output:outputValue});
  }, [url,socket,value,language,outputValue]);

  const recieveCodeFromSocket = useCallback((data:any) => {
    const {code, language} = data;
    console.log("recieve funcion run")
    // console.log(data);
  }, [])

  const handleRecievedData = useCallback((data:any) => {
    const {from, code, language, output} = data;
    // console.log(code)
    // setValue(code);
    setRecieveValue(code);
    setLanguage(language);
    setOutputValue(output);
  }, [])

  // const debouncedCodeSend = debounce(sendCodeToSocket, 1000);
  // const debouncedRecieveCode = debounce(handleRecievedData, 1000);
  const debouncedCodeSend = useDebouncedCallback(() => {
    const room:string = url.slice(6, url.length);
    socket?.emit("code-share", {room, code:value, language, output:outputValue});
  })

  const debouncedRecieveCode = useDebouncedCallback((data:any) => {
    const {from, code, language, output} = data;
    setRecieveValue(code);
    setLanguage(language);
    setOutputValue(output);
  }, 1000);
  
  useEffect(() => {
    debouncedCodeSend();
    // sendCodeToSocket();
    socket?.on("code-share", (data) => recieveCodeFromSocket(data));
    // socket?.on("code-recieve", (data) => handleRecievedData(data));
    socket?.on("code-recieve", (data) => debouncedRecieveCode(data));

    return () => {
      socket?.off("code-share", (data) => recieveCodeFromSocket(data));
      socket?.off("code-recieve", (data) => handleRecievedData(data));
    }
  }, [sendCodeToSocket,recieveCodeFromSocket,handleRecievedData, socket]);

  return (
    <div className={`text-white flex flex-col h-full`}>
      <div className='text-sm pl-2 relative ml-3 rounded cursor-pointer mb-2'>
        <h3
          className='border text-center w-[120px] py-2 rounded border-slate-500 bg-slate-950 text-xs'
          onClick={() => setOpenCode((prev) => !prev)}
        >
          {language}
        </h3>
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
      <div className='max-h-[500px] overflow-y-scroll '>
        <CodeMirror
          value={recieveValue||value}
          onChange={onChange}
          theme={material}
          extensions={[EXTENSIONS[language]]}
          basicSetup={{ autocompletion: true }}
          minWidth={'650px'}
          maxWidth={'650px'}
          minHeight={'500px'}
        />
      </div>
      <div className='w-full h-[1px] bg-slate-500'/>
      <Output 
        code={value} 
        language={language} 
        setOutputValue={setOutputValue} 
        outputValue={outputValue}
      />
    </div>
  )
}

export default CodePlayground