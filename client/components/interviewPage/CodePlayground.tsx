'use client';

import React, { useCallback, useState } from 'react';
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

const CodePlayground = () => {
  const [language, setLanguage] = useState("javascript");
  const [value, setValue] = useState("//Start Coding");
  const [pop, setPop] = useState(false);

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

  return (
    <div className='text-white'>
      <div className='text-sm pl-2 relative ml-3 rounded cursor-pointer mb-2'>
        <h3
          className='border text-center w-[120px] py-2 rounded border-slate-500 bg-slate-950 text-xs'
          onClick={() => setPop((prev) => !prev)}
        >
          {language}
        </h3>
        <div className={`bg-slate-950 text-xs gap-4 rounded w-[120px] absolute z-30 left-2 top-[100%] mt-1 p-4 flex flex-col ${!pop && 'hidden'}`}>

          {Object.entries(LANGUAGES).map((lang: any, idx) => {
            return (
              <div
                key={idx}
                className={`cursor-pointer ${language != lang[0] && "text-slate-500"} hover:text-white`}
                onClick={() => { setLanguage(lang[0]), setPop((prev) => !prev) }}
              >
                {lang[0]}
              </div>
            )
          })}
        </div>
      </div>
      <div className='max-h-[400px] overflow-y-scroll '>
        <CodeMirror
          value={value}
          onChange={onChange}
          theme={material}
          extensions={[EXTENSIONS[language]]}
          basicSetup={{ autocompletion: true }}
          minWidth={'600px'}
          minHeight={'400px'}
        />
      </div>
      <Output code={value} language={language} />
    </div>
  )
}

export default CodePlayground