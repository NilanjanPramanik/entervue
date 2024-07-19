'use client'

import { createContext, useContext, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<null | Socket>(null);

export const useSocket = () => {
  const socket = useContext(SocketContext);
  return socket;
}

export const SocketProvider = ({
  children
}: { children: React.ReactNode }) => {

  const socket = useMemo(() => io(`${process.env.NEXT_PUBLIC_SOCKET_PORT}`), [])

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  )
}