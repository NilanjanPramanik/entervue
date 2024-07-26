'use client';

import { Switch } from '@headlessui/react'
import { IconProps } from '@radix-ui/react-icons/dist/types';
import React, { useState } from 'react'

interface ToggleBtnProps {
  Icon : React.ComponentType<IconProps>,
  onClick: ()=>void,
  toggleMicOn?: boolean,
  toggleVideoOn?: boolean
}

const ToggleBtn: React.FC<ToggleBtnProps> = ({ 
  Icon, 
  onClick, 
  toggleMicOn,
  toggleVideoOn
}) => {
  const [enabled, setEnabled] = useState(toggleMicOn || toggleVideoOn);

  return (
    <Switch
      onClick={onClick}
      checked={enabled}
      onChange={setEnabled}
      className="group relative flex w-[69px] cursor-pointer rounded-full bg-white/10 p-1 transition-colors duration-200 ease-in-out focus:outline-none data-[focus]:outline-1 data-[focus]:outline-white data-[checked]:bg-white/10"
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none inline-block size- p-2 translate-x-0 rounded-full ring-0 shadow-lg transition duration-200 ease-in-out group-data-[checked]:translate-x-7 ${enabled ? "bg-lime-300" : "bg-gray-600"}`}
      >
        <Icon className='text-black '/>
      </span>
    </Switch>
  )
}

export default ToggleBtn