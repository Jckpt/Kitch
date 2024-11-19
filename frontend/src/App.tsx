import { IconBrandChrome, IconBrandFirefox } from "@tabler/icons-react"
import { useEffect, useState } from "react"

import "./App.css"

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
    <div
      className="min-h-screen w-screen bg-gradient-to-bl from-[#00FF7F] via-purple-500 to-[#6441a5]"
      style={{ fontFamily: "Helvetica" }}>
      <div className="container mx-auto px-4 h-screen flex flex-col items-center justify-center">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-2xl p-8">
            {isAuthenticated ? (
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-4">
                  Successfully Authenticated!
                </h2>
                <p>You can now close this window</p>
              </div>
            ) : hasToken ? (
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-4">
                  Authentication Required
                </h2>
                <p className="mb-6">
                  Please wait while we complete the authentication process...
                </p>
                <div className="animate-spin h-8 w-8 border-4 border-white border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : (
              <div className="text-center text-white">
                <h2 className="text-2xl font-bold mb-4">Get Kitch</h2>
                <p className="mb-6">for your preferred browser:</p>
                <div className="space-y-4">
                  <a
                    href="https://chromewebstore.google.com/detail/kitch/afinpfknmmcbkmbgjcoljffonbmkccnl?hl=en"
                    className="flex items-center justify-center w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    target="_blank"
                    rel="noopener noreferrer">
                    <div className="flex items-center">
                      <IconBrandChrome className="mr-2 w-5 h-5" />
                      <span>Chrome Web Store</span>
                    </div>
                  </a>
                  <a
                    href="https://addons.mozilla.org/en-US/firefox/addon/kitch/"
                    className="flex items-center justify-center w-full py-2 px-4 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    target="_blank"
                    rel="noopener noreferrer">
                    <div className="flex items-center">
                      <IconBrandFirefox className="mr-2 w-5 h-5" />
                      <span>Firefox Add-ons</span>
                    </div>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
