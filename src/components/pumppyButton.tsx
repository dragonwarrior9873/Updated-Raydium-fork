import React from 'react';

function PumppyButton() {
  return (
    <ul id="buttons01" className="buttons">
      <li style={{ opacity: 1, transform: 'none' }}>
        <a href="https://pump.fun" className="button n01">
          <svg aria-labelledby="icon-title">
            <title id="icon-title">Chevron Right</title>
            <use xlinkHref="#icon-6f1498c47b5f47672990badd5a8b1884"></use>
          </svg>
          <span className="label">BUY ME</span>
        </a>
      </li>
    </ul>
  );
};

export default PumppyButton;