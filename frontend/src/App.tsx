import { IconBrandChrome, IconBrandFirefox } from "@tabler/icons-react"
import { useEffect, useState } from "react"

import "./App.css"

const Authentication = ({ hasToken }: { hasToken: boolean }) => (
  <div className="bg-[#1f1f1f] backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] border border-[#242424] p-10 transition-all duration-300 hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.4)]">
    {hasToken ? (
      <div className="text-center text-zinc-100 space-y-4">
        <h2 className="text-3xl font-semibold tracking-tight">
          Successfully Authenticated
        </h2>
        <p className="text-zinc-400">You can now close this window</p>
      </div>
    ) : (
      <div className="text-center text-zinc-100 space-y-6">
        <h2 className="text-3xl font-semibold tracking-tight">
          Authentication Required
        </h2>
        <p className="text-zinc-400">
          Please wait while we complete the authentication process...
        </p>
        <div className="animate-spin h-10 w-10 border-3 border-zinc-600 border-t-white rounded-full mx-auto"></div>
      </div>
    )}
  </div>
)

const Boarding = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
    <div className="space-y-8">
      <div className="max-w-[300px]">
        <h1 className="text-4xl font-bold text-white mb-2">Kitch</h1>
        <p className="text-[#a1a1a1] text-lg">
          Follow your favorite streamers
          <br />
          on <span className="text-[#53fc19]">Kick</span> and{" "}
          <span className="text-[#a970ff]">Twitch</span>
        </p>
      </div>
      <div className="space-y-4 max-w-[300px]">
        <a
          href="https://chromewebstore.google.com/detail/kitch-kick-twitch-notific/afinpfknmmcbkmbgjcoljffonbmkccnl?hl=en"
          className="flex items-center space-x-3 text-white bg-[#242424] hover:bg-[#2f2f2f] transition-all rounded-lg px-6 py-3 w-full border border-[#333333] hover:border-[#404040] shadow-lg hover:shadow-xl">
          <IconBrandChrome size={24} />
          <span>Add to Chrome</span>
        </a>
        <a
          href="https://addons.mozilla.org/en-US/firefox/addon/kitch/"
          className="flex items-center space-x-3 text-white bg-[#242424] hover:bg-[#2f2f2f] transition-all rounded-lg px-6 py-3 w-full border border-[#333333] hover:border-[#404040] shadow-lg hover:shadow-xl">
          <IconBrandFirefox size={24} />
          <span>Add to Firefox</span>
        </a>
      </div>
    </div>
    <div className="hidden md:flex rounded-2xl aspect-square w-full max-w-md mx-auto justify-center items-center">
      <img
        src="https://i.imgur.com/UMqt5u8.png"
        alt="Kitch"
        draggable="false"
        className="w-3/4 h-3/4 mb-14 float-animation"
      />
    </div>
  </div>
)

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [hasToken, setHasToken] = useState(false)

  useEffect(() => {
    const url = window.location.href
    if (url.includes("#access_token=")) {
      setIsAuthenticated(true)
      setHasToken(true)
    }
  }, [])

  return (
    <div className="overscroll-none min-h-screen w-screen bg-gradient-to-br from-[#181818] via-[#1f1f1f] to-[#242424]">
      <div className="container mx-auto px-4 h-screen flex flex-col items-center justify-center relative">
        <div
          className={`w-full max-w-5xl ${isAuthenticated || hasToken ? "max-w-md" : ""}`}>
          {isAuthenticated || hasToken ? (
            <div className="space-y-8 flex flex-col items-center">
              <Authentication hasToken={isAuthenticated} />
            </div>
          ) : (
            <Boarding />
          )}
        </div>
        <a
          href="https://github.com/jckpt"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-4 text-[#a1a1a1] hover:text-white transition-colors text-sm">
          made by me
        </a>
      </div>
    </div>
  )
}

export default App
