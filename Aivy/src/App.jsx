import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Flashcard } from './Components/Flashcard'
import { Navigation } from './Components/Navigation'
import Pet from './Components/Pet'
import { Store } from './Components/Store'

function App() {
  return (
    <Router>
      <main>
        <h1>Hello World</h1>
        <Routes>
          <Route path="/" element={<Navigation />} />
          <Route path="/flashcard" element={<Flashcard />} />
          <Route path="/navigation" element={<Navigation />} />
          <Route path="/pet" element={<Pet />} />
          <Route path="/store" element={<Store />} />
          <Route path="*" element={<div>404 — Not found</div>} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
