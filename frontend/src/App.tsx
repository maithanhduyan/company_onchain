import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import AboutUs from './AboutUs'

function App() {
  const [count, setCount] = useState(0)
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <div className="flex gap-4 justify-center mt-4">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setShowAbout(false)}>
          Home
        </button>
        <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700" onClick={() => setShowAbout(true)}>
          About Us
        </button>
      </div>
      {showAbout ? (
        <AboutUs />
      ) : (
        <div>
          <a href="https://vite.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
          <h1 className="text-3xl font-bold text-purple-700">Vite + React</h1>
          <div className="card">
            <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700" onClick={() => setCount((count) => count + 1)}>
              count is {count}
            </button>
            <p>
              Edit <code>src/App.tsx</code> and save to test HMR
            </p>
          </div>
          <p className="read-the-docs">
            Click on the Vite and React logos to learn more
          </p>
        </div>
      )}
    </>
  )
}

export default App
