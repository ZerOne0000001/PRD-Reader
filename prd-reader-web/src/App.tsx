import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Reader from "@/pages/Reader"
import Admin from "@/pages/Admin"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Reader />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Router>
  )
}