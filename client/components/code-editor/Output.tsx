"use client";

import React, { useCallback, useState } from 'react'
import axios from 'axios'
import { LANGUAGES } from '@/constant';

const Output = ({
  code, language
}: {
  code: string,
  language: string
}) => {
  const [output, setOutput] = useState('Run the code.')
  const [isErr, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOutput = useCallback(async () => {
    setErr(false);
    if (!code || !language) {
      return
    }
    try {
      setLoading(true);
      await axios.post(`${process.env.NEXT_PUBLIC_BASE_URL}/execute`, {
        "language": language,
        //@ts-ignore
        "version": LANGUAGES[language],
        "files": [
          {
            "content": code
          }
        ],
      }).then((res) => {
        setOutput(res.data.run.output)
        if (res.data.run.code === 1) {
          setErr(true);
        }
      }).finally(() => {
        setLoading(false)
      })

    } catch (error) {
      console.log(error)
    }
  }, [code, language])


  return (
    <div className=' max-w-[600px]'>
      <button
        disabled={!code || loading}
        onClick={handleOutput}
        className={`absolute top-2 right-4 text-xs rounded border-slate-500 border p-2 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-neutral-900`}
      >
        {loading ? "Running..." : "Run code"}
      </button>
      <div className='border-t border-neutral-500 text-xs font-medium p-2 flex gap-2 h-[120px] overflow-y-scroll'>
        <p>&gt;&gt;</p>
        <div className={`${loading && "hidden"}`}>
          {!isErr ? (
            <p className='text-green-700'>{output}</p>
          ) : (
            <p className='text-red-600'>{output}</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Output