import { Routes, Route} from 'react-router-dom';
import LandingPage from './LandingPage';
import CvGenerator from './CvGenerator';

function App() {

  return (
    <>
    <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/generate" element={<CvGenerator />} />
    </Routes>
    </>
  )
}

export default App
