import React, { useState, useEffect } from 'react';
import './BookLoader.css';
import Logo from './Logo';

const BookLoader = () => {
  const loadingTexts = [
      "Summoning ancient spirits...",
      "Polishing the crystal ball...",
      "Waking the AI Dungeon Master...",
      "Unfurling the world map...",
      "Consulting the elder scrolls...",
      "Charging ley lines...",
  ];
  const [currentText, setCurrentText] = useState(loadingTexts[0]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentText(prevText => {
        const currentIndex = loadingTexts.indexOf(prevText);
        const nextIndex = (currentIndex + 1) % loadingTexts.length;
        return loadingTexts[nextIndex];
      });
    }, 2000); // Change text every 2 seconds

    return () => clearInterval(intervalId);
  }, [loadingTexts]);
  
  const backgroundUrl = 'https://firebasestorage.googleapis.com/v0/b/choicescraft-2af32.firebasestorage.app/o/dev-uploads%2F3f9d50a2-2f3b-4c0a-9d95-257a05904940.webp?alt=media&token=e937d57e-1282-4161-9c3f-4277b5879a83';

  return (
    <div className='loader-container'>
       <div className="loader-bg-image" style={{ backgroundImage: `url(${backgroundUrl})` }}/>
       <div className="loader-overlay" />
       <div className="loader-content-wrapper">
         <div className="flex flex-col items-center text-center text-white">
            <Logo />
            <h1 className="text-4xl font-headline mt-4 tracking-wider">Scriptura</h1>
            <p className="mt-2 text-lg text-primary">{currentText}</p>
            <div className="pulsing-dots mt-8">
              <div></div>
              <div></div>
              <div></div>
            </div>
         </div>
       </div>
    </div>
  );
};

export default BookLoader;
