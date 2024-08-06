import { SignIn } from '@clerk/nextjs'
import React from 'react'

const page = () => {
  return (
    <div className='h-screen w-screen bg-stone-200'>
      <SignIn />
    </div>
  )
}

export default page