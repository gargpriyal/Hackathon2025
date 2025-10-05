import './App.css'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
// import { Flashcard } from './Components/Flashcard'
import Navigation from './Components/Navigation.jsx'
import { useEffect } from 'react';
// import { Pet } from './Components/Pet'
// import { Store } from './Components/Store'



const App = () => {
  useEffect(() => {
    localStorage.setItem('user_id', "68e21317867965c1f4ef9e40");
  }, []);
  return <Navigation />;
};

export default App
