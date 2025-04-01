import { useState } from 'react'; 
import Journal from './Journal';
import CurrencyConverter from "./Currency";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  const [msg, setMsg] = useState('');

  return (
    <>
      <Router>
        <Routes>
          <Route path='/' element={<Journal setMsg={setMsg} msg={msg}/>}/>
          <Route path='/forex' element={<CurrencyConverter/>}/>
        </Routes>
      </Router>
    </>
  );
}

export default App;
