interface PopupProps {
  setPopup: React.Dispatch<React.SetStateAction<boolean>>,
  handleVideoStream: () => void,
  remoteSocketId: null | string,
  sendStreams: () => void,
  remoteStream: any[],
  myStream: any[],
  remoteName: string | null,
  isHost: boolean,
}

const Popup: React.FC<PopupProps> = ({
  setPopup,
  handleVideoStream,
  remoteSocketId,
  sendStreams,
  remoteStream,
  myStream,
  remoteName,
  isHost
}) => {
  return (
    <div
      className='fixed h-screen w-screen bg-black/60 flex justify-center items-center z-50'
    >
      <div className='border h-[200px] w-[340px] bg-slate-900 flex flex-col justify-evenly items-center rounded border-slate-800 gap-4'>
        <div>
          <h2 className='text-lg font-bold'>
            Please Wait!
          </h2>
          <h3 className='text-sm font-light opacity-70'>
            {isHost ? (remoteName? `${remoteName} is waiting for access.` : "Waiting for the paritcipent to join.") : "Let us set everything up for you!"}
          </h3>
        </div>
        <div className='flex gap-4 text-sm font-semibold'>
          <button
            onClick={handleVideoStream}
            disabled={!remoteSocketId}
            className={`border h-fit px-6 py-1 rounded bg-lime-300 hover:bg-lime-400 text-slate-950 ${(!remoteSocketId) && "cursor-not-allowed opacity-30"}`}
          >
            Accept to Join
          </button>
        </div>
      </div>
    </div>
  )
}

export default Popup;