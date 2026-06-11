// SVG calendar with animated looking glass
export function getCalendarButton() {
  return `<svg
    id='change-date-btn' class='banner-btn' title="Selecteer datum"
    width="780px"
    height="700px"
    viewBox="0 0 78 70"
    xmlns="http://www.w3.org/2000/svg"><title>Selecteer datum</title>
    <style>
      svg { 
        transform-origin: 50% 50%; cursor: pointer;
      }
	    #looking-glass {
	      opacity: 0%;
	    }
	    .calendar-item {
        fill:#FEF;
	      fill-opacity:1;
	      stroke:#000;
	      stroke-width:1;
	      stroke-linecap:round;
	      stroke-linejoin:round;
      }
	    @keyframes fadeIn {
        from { opacity: 0; }
        to   { opacity: 0.95; transform: scale(0.25) translateX(-70px) translateY(-30px); }
      }
      @keyframes moveLR {
        0%   { transform: scale(0.25) translateX(-70px) translateY(-30px); }
	      33%  { transform: scale(0.25) translateX(60px) translateY(-30px); }
	      66%  { transform: scale(0.25) translateX(-85px) translateY(45px);; }
        100% { transform: scale(0.25) translateX(60px) translateY(45px);}
      }
	    svg:hover #looking-glass {
	    transform-origin: 50% 45%;
	    animation:
        fadeIn 0.6s ease-out forwards,
        moveLR 3s linear 0.65s infinite alternate;
	    }
    </style>
    <g id="search-calendar">
      <g id="calendar">
        <rect
         style="fill:#FFF;fill-opacity:1;stroke:#151;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"
         id="outer-rect"
         width="55"
         height="45"
         x="10"
         y="15"
         rx="5"
         ry="5" />
      <rect
         style="fill:#31E;fill-opacity:0.3;stroke:#151;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;"
         id="top-rect"
         width="55"
         height="10"
         x="10"
         y="15"
         rx="3"
         ry="3" />
      <rect
         style="fill:#BEF;fill-opacity:1;stroke:#151;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;"
         id="left-ring"
         width="4"
         height="10"
         x="23"
         y="10"
         rx="2"
         ry="3" />
      <rect
         style="fill:#BEF;fill-opacity:1;stroke:#151;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;"
         id="right-ring"
         width="4"
         height="10"
         x="50"
         y="10"
         rx="2"
         ry="3" />
      <rect
         id="date-1"
		     class="calendar-item"
         width="7"
         height="6"
         x="18"
         y="30" />
      <rect
         id="date-2"
		     class="calendar-item"
         width="7"
         height="6"
         x="34"
         y="30" />
	  <rect
         id="date-3"
		     class="calendar-item"
         style="fill:orange"
         width="7"
         height="6"
         x="50"
         y="30" />
      <rect
         id="date-4"
		     class="calendar-item"
         width="7"
         height="6"
         x="18"
         y="40" />
      <rect
         id="date-5"
		     class="calendar-item"
         width="7"
         height="6"
         x="34"
         y="40" />
	  <rect
         id="date-6"
		     class="calendar-item"
         width="7"
         height="6"
         x="50"
         y="40" />
      <rect
         id="date-7"
		     class="calendar-item"
         width="7"
         height="6"
         x="18"
         y="50" />
      <rect        
         id="date-8"
		     class="calendar-item"
         width="7"
         height="6"
         x="34"
         y="50" />
	  <rect
         id="date-9"
		     class="calendar-item"
         width="7"
         height="6"
         x="50"
         y="50" />
    </g>
    <g
       id="looking-glass">
      <circle
         style="fill:#5af6;stroke:#151;stroke-width:20;stroke-linecap:round;stroke-linejoin:round;"
         id="glass"
         cx="40"
         cy="40"
         r="65" />
      <path
         style="fill:none;stroke:#151;stroke-width:26;stroke-linecap:round;stroke-linejoin:miter;;stroke-opacity:1"
         d="M 79,101 120,156"
         id="handle" />
    </g>
  </g>
</svg>`;
}