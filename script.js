const IMAGES = [
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRz6VQLZhZiHQYbpY0JzCGxa2iuCBhv9UQIKbvwalO2tg&s=10',
  'https://play-lh.googleusercontent.com/DsyWoouXk7psjF7DCG6MJj_rX9RR9-liQskZXoKvcqQIu_ybUm4F5RntxWh1IZAVSLI',
  'https://static.wikia.nocookie.net/duolingo/images/3/3a/Duo.png/revision/latest/thumbnail/width/360/height/450?cb=20231215075937&path-prefix=ru'
];

let digits = [0, 0, 0];
let submitted = false;
let audioCtx = null;

window.updateDigit = (index, delta) => {
  if (submitted) return;
  digits[index] += delta;
  if (digits[index] > 9) digits[index] = 0;
  if (digits[index] < 0) digits[index] = 9;
  document.getElementById(`digit-${index}`).innerText = digits[index];
};

document.addEventListener("DOMContentLoaded", () => {
    const date = new Date();
    date.setUTCHours(17, 0, 0, 0);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById("local-time-display").innerText = `(в вашем часовом поясе это ~${timeStr})`;
});

const playBunkerSound = (actx) => {
    const osc1 = actx.createOscillator();
    const gain1 = actx.createGain();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(60, actx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(10, actx.currentTime + 2.5);
    gain1.gain.setValueAtTime(0.5, actx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 2.5);
    osc1.connect(gain1);
    gain1.connect(actx.destination);
    osc1.start(actx.currentTime);
    osc1.stop(actx.currentTime + 2.5);

    const noise = actx.createBufferSource();
    const MathBuffer = actx.createBuffer(1, actx.sampleRate * 0.5, actx.sampleRate);
    const data = MathBuffer.getChannelData(0);
    for (let i = 0; i < MathBuffer.length; i++) data[i] = Math.random() * 2 - 1;
    noise.buffer = MathBuffer;
    
    const noiseFilter = actx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(2000, actx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(100, actx.currentTime + 0.5);

    const noiseGain = actx.createGain();
    noiseGain.gain.setValueAtTime(0.8, actx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.5);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(actx.destination);
    noise.start(actx.currentTime);

    setTimeout(() => {
      if (actx.state === 'closed') return;
      const lockNoise = actx.createBufferSource();
      lockNoise.buffer = MathBuffer;
      
      const lockFilter = actx.createBiquadFilter();
      lockFilter.type = 'lowpass';
      lockFilter.frequency.setValueAtTime(800, actx.currentTime);
      lockFilter.frequency.exponentialRampToValueAtTime(50, actx.currentTime + 0.6);

      const lockGain = actx.createGain();
      lockGain.gain.setValueAtTime(1, actx.currentTime);
      lockGain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.6);

      lockNoise.connect(lockFilter);
      lockFilter.connect(lockGain);
      lockGain.connect(actx.destination);
      lockNoise.start(actx.currentTime);
    }, 1200);
};

const playGlitchSound = (actx) => {
    if (!actx || actx.state === 'suspended') return;
    
    const osc = actx.createOscillator();
    const gain = actx.createGain();
    
    const types = ['square', 'sawtooth'];
    osc.type = types[Math.floor(Math.random() * types.length)];
    
    osc.frequency.setValueAtTime(800 + Math.random() * 2000, actx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, actx.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.15, actx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, actx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(actx.destination);
    
    osc.start();
    osc.stop(actx.currentTime + 0.1);
};

let activeGlitch = false;
const triggerGlitchLoop = () => {
    if (!activeGlitch) return;
    const show = Math.random() > 0.4;
    const container = document.getElementById("glitch-overlay-container");
    const img = document.getElementById("glitch-img");
    
    if (show) {
        container.classList.remove("hidden");
        img.src = IMAGES[Math.floor(Math.random() * IMAGES.length)];
        const x = Math.random() * 70;
        const y = Math.random() * 70;
        const scale = 0.8 + Math.random() * 2.5;
        const rot = (Math.random() * 90) - 45;
        const filter = Math.random() > 0.5 ? 'invert(1) hue-rotate(' + (Math.random()*360) + 'deg)' : 'none';
        const mixBlendMode = Math.random() > 0.5 ? 'difference' : 'hard-light';

        img.style.left = `${x}vw`;
        img.style.top = `${y}vh`;
        img.style.transform = `scale(${scale}) rotate(${rot}deg)`;
        img.style.filter = filter;
        img.style.mixBlendMode = mixBlendMode;
        
        playGlitchSound(audioCtx);
    } else {
        container.classList.add("hidden");
    }
    
    setTimeout(triggerGlitchLoop, 40 + Math.random() * 150);
}


document.getElementById('dgu-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();

    submitted = true;
    
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.classList.add('shake-bunker');
    playBunkerSound(audioCtx);

    const bunkerBg = document.getElementById("bunker-bg");
    bunkerBg.classList.remove("opacity-0");
    bunkerBg.classList.add("bunker-overlay");

    const formOuter = document.getElementById("form-container");
    formOuter.classList.add("fade-out-form", "pointer-events-none");

    const form = e.target;
    const body = new FormData(form);
    body.append('combination', digits.join(''));

    try {
      await fetch('https://formspree.io/f/mnjrydaq', {
        method: 'POST',
        body,
        headers: { 'Accept': 'application/json' }
      });
    } catch(err) {
      console.error("Submission failed, but proceeding to bunker state.", err);
    }

    setTimeout(() => {
        document.body.classList.remove('shake-bunker');
        document.getElementById("success-modal").classList.remove("hidden");
    }, 1500); 
    
    setTimeout(() => {
        document.getElementById("success-modal").classList.add("hidden");
        document.getElementById("glitch-state").classList.remove("hidden");
        activeGlitch = true;
        triggerGlitchLoop();
    }, 4500); 
});
