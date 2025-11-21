
"use client";

import React from "react";
import "./book-intro-animation.css";

const SvgPath = ({ d }: { d: string }) => (
  <path
    d={d}
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  />
);

const BookPageSegment = ({ n, maxSegments }: { n: number; maxSegments: number }) => {
  if (n > maxSegments) {
    return null;
  }
  return (
    <div className="segment" style={{ "--segment-number": n } as React.CSSProperties}>
      <div className="segment-side segment-side-front">
        <div className="segment-inner" />
      </div>
      <div className="segment-side segment-side-back" />
      <BookPageSegment n={n + 1} maxSegments={maxSegments} />
    </div>
  );
};

interface BookIntroAnimationProps {
  coverUrl?: string;
  backgroundUrl?: string;
}

const BookIntroAnimation = ({ coverUrl, backgroundUrl }: BookIntroAnimationProps) => {
  const pageSegments = 8;

  const wrapperStyle = {
      '--image-cover-front': coverUrl ? `url(${coverUrl})` : undefined,
      backgroundImage: backgroundUrl ? `url(${backgroundUrl})` : undefined,
  };
  
  // Filter out undefined values
  const finalStyle = Object.fromEntries(Object.entries(wrapperStyle).filter(([_, v]) => v != null));

  return (
    <main className="book-intro-container">
      <div className="book-intro-wrapper" style={finalStyle as React.CSSProperties}>
        <div className="book-intro" style={{ "--segments-count": pageSegments } as React.CSSProperties}>
          <div className="book-cover book-cover-wide book-cover-front">
            <div className="book-cover-inner book-cover-inner-front">
              <div className="book-page book-page-turned" />
            </div>
          </div>
          <div className="book-cover book-cover-wide book-cover-back">
            <div className="book-cover-inner" />
          </div>
          <div className="book-cover book-cover-middle" />
          <div className="book-side book-side-right" />
          <div className="book-side book-side-top" />
          <div className="book-side book-side-bottom" />
          <div className="book-page book-page-stacked">
            <div className="book-page-inner" />
            <BookPageSegment n={1} maxSegments={pageSegments} />
          </div>
        </div>

        <div className="book-intro-info">
          <p className="scroll">
            <svg className="scroll-icon" viewBox="0 0 24 24" fill="none">
              <SvgPath d="M5 15C5 16.8565 5.73754 18.6371 7.05029 19.9498C8.36305 21.2626 10.1435 21.9999 12 21.9999C13.8565 21.9999 15.637 21.2626 16.9498 19.9498C18.2625 18.6371 19 16.8565 19 15V9C19 7.14348 18.2625 5.36305 16.9498 4.05029C15.637 2.73754 13.8565 2 12 2C10.1435 2 8.36305 2.73754 7.05029 4.05029C5.73754 5.36305 5 7.14348 5 9V15Z" />
              <SvgPath d="M12 6V14" />
              <SvgPath d="M15 11L12 14L9 11" />
            </svg>
            <span>Scroll down</span>
          </p>
        </div>
      </div>
       <p className="unsupported"> ⚠️ Scroll-driven animations are
        {' '}
        <a
          target="_blank"
          rel="noopener noreferrer"
          href="https://caniuse.com/mdn-css_properties_animation-timeline_scroll"
        > not supported</a>
       </p>
    </main>
  );
};

export default BookIntroAnimation;
