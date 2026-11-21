import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Analyze from './pages/Analyze'
import Pricing from './pages/Pricing'
import JobFinder from './pages/JobFinder'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/analyze" element={<Analyze />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/jobs" element={<JobFinder />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App