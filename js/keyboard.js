/* ========= Web Audio ========== */
let audioContext;
try {
  audioContext = new (window.AudioContext || window.webkitAudioContext)();
} catch (e) {
  console.error('Web Audio API unsupported');
}

/* ========= Recorder range & reference tables ========= */
const RECORDER_RANGE = [
  'C','C#','D','D#','E','F','F#','G','G#','A','A#','B',
  'C2','C#2','D2','D#2','E2','F2','F#2','G2','G#2','A2','A#2','B2',
  'C3','C#3'
];

const NOTE_FREQUENCIES = {
  'C':523.25,'C#':554.37,'D':587.33,'D#':622.25,'E':659.25,'F':698.46,'F#':739.99,'G':783.99,'G#':830.61,'A':880.00,'A#':932.33,'B':987.77,
  'C2':1046.50,'C#2':1108.73,'D2':1174.66,'D#2':1244.51,'E2':1318.51,'F2':1396.91,'F#2':1479.98,'G2':1567.98,'G#2':1661.22,'A2':1760.00,'A#2':1864.66,'B2':1975.53,
  'C3':2093.00,'C#3':2217.46
};

const NOTE_TO_INDEX = Object.fromEntries(RECORDER_RANGE.map((n, i) => [n, i]));
const IMG_PATH = './img/';

/* ========= Fingering / staff image tables ========= */
const FINGERING_IMG = {
  'C':'fingering_C.png','C#':'fingering_Cs.png','D':'fingering_D.png','D#':'fingering_Ds.png','E':'fingering_E.png',
  'F':'fingering_F.png','F#':'fingering_Fs.png','G':'fingering_G.png','G#':'fingering_Gs.png','A':'fingering_A.png',
  'A#':'fingering_As.png','B':'fingering_B.png',
  'C2':'fingering_C2.png','C#2':'fingering_Cs2.png','D2':'fingering_D2.png','D#2':'fingering_Ds2.png','E2':'fingering_E2.png',
  'F2':'fingering_F2.png','F#2':'fingering_Fs2.png','G2':'fingering_G2.png','G#2':'fingering_Gs2.png','A2':'fingering_A2.png',
  'A#2':'fingering_As2.png','B2':'fingering_B2.png',
  'C3':'fingering_C3.png','C#3':'fingering_Cs3.png'
};

const STAFF_IMG = {
  'C':'staff_C.png','C#':'staff_Cs.png','Db':'staff_Db.png','D':'staff_D.png','D#':'staff_Ds.png','Eb':'staff_Eb.png','E':'staff_E.png',
  'F':'staff_F.png','F#':'staff_Fs.png','Gb':'staff_Gb.png','G':'staff_G.png','G#':'staff_Gs.png','Ab':'staff_Ab.png','A':'staff_A.png',
  'A#':'staff_As.png','Bb':'staff_Bb.png','B':'staff_B.png',
  'C2':'staff_C2.png','C#2':'staff_Cs2.png','Db2':'staff_Db2.png','D2':'staff_D2.png','D#2':'staff_Ds2.png','Eb2':'staff_Eb2.png',
  'E2':'staff_E2.png','F2':'staff_F2.png','F#2':'staff_Fs2.png','Gb2':'staff_Gb2.png','G2':'staff_G2.png','G#2':'staff_Gs2.png',
  'Ab2':'staff_Ab2.png','A2':'staff_A2.png','A#2':'staff_As2.png','Bb2':'staff_Bb2.png','B2':'staff_B2.png',
  'C3':'staff_C3.png','C#3':'staff_Cs3.png','Db3':'staff_Db3.png'
};

const STAFF_BLANK = 'staff_blank.png';

const SHARP_TO_FLAT = {
  'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb',
  'C#2':'Db2','D#2':'Eb2','F#2':'Gb2','G#2':'Ab2','A#2':'Bb2',
  'C#3':'Db3'
};

/* ========= ドレミ変換表 ========= */
const noteToDoremi = { 'C':'ド','D':'レ','E':'ミ','F':'ファ','G':'ソ','A':'ラ','B':'シ' };

/* ========= DOM ========= */
const pianoRoot           = document.getElementById('piano');
const staffImg            = document.getElementById('staff-img');
const keyFingeringDisplay = document.getElementById('key-fingering-display');
const boardChart          = document.getElementById('fingering-chart-board');

/* ========= 状態 ========= */
let currentNoteIndex = null;
const noteToCard = {};      // 運指カード逆引き

/* ========= Audio helper ========= */
function playNote(freq, dur = 0.45) {
  if (!audioContext || !freq) return;
  if (audioContext.state === 'suspended') audioContext.resume();
  const osc  = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, audioContext.currentTime);
  gain.gain.setValueAtTime(0.5, audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + dur);
  osc.connect(gain); gain.connect(audioContext.destination);
  osc.start(); osc.stop(audioContext.currentTime + dur);
}

/* ========= UI helpers ========= */
function getOctaveSuffix(n){ return n.includes('3') ? 'Hi-Hi' : (n.includes('2') ? 'Hi' : ''); }

function getNoteDisplayName(note) {
  if (note in SHARP_TO_FLAT) {
    const sharpBase = note.replace(/[0-9#]/g, '');
    const flatKey   = SHARP_TO_FLAT[note];
    const flatBase  = flatKey.replace(/[0-9b]/g, '');
    const suf       = getOctaveSuffix(note);
    return `${noteToDoremi[sharpBase]}♯${suf} / ${noteToDoremi[flatBase]}♭${suf}`;
  }
  const base = note.replace(/[0-9#]/g, '');
  let label  = noteToDoremi[base] || base;
  if (note.includes('#')) label += '♯';
  label += getOctaveSuffix(note);
  return label;
}

function setStaff(key){
  staffImg.src = key && STAFF_IMG[key] ? IMG_PATH + STAFF_IMG[key] : IMG_PATH + STAFF_BLANK;
}
function highlightKeys(n){
  document.querySelectorAll('.white-key,.black-key')
          .forEach(k=>k.classList.toggle('active',k.dataset.note===n));
}
function highlightChart(note){
  Object.values(noteToCard).forEach(c=>c.classList.remove('active'));
  const card = noteToCard[note];
  if(card){
    card.classList.add('active');
  }
}
function createCard(note,label){
  const wrap=document.createElement('div');
  wrap.className='card';
  const lbl=document.createElement('div');
  lbl.className='note-label';
  lbl.textContent=label;
  const img=document.createElement('img');
  img.onerror=()=>{img.style.display='none';lbl.style.color='#888';lbl.textContent+=' (画像なし)';};
  if(note && FINGERING_IMG[note]) img.src=IMG_PATH+FINGERING_IMG[note];
  else img.style.display='none';
  wrap.append(lbl,img);
  return wrap;
}

function renderSingle(note){
  if(!(note in NOTE_FREQUENCIES)) return;
  highlightKeys(note);
  setStaff(SHARP_TO_FLAT[note]||note);
  keyFingeringDisplay.innerHTML='';
  keyFingeringDisplay.appendChild(createCard(note,getNoteDisplayName(note)));
  playNote(NOTE_FREQUENCIES[note]);
  currentNoteIndex = NOTE_TO_INDEX[note];
  highlightChart(note);
}

function moveNote(step){
  if(currentNoteIndex===null){ renderSingle(RECORDER_RANGE[0]); return; }
  const idx=currentNoteIndex+step;
  if(idx<0 || idx>=RECORDER_RANGE.length) return;
  renderSingle(RECORDER_RANGE[idx]);
}

/* ========= Piano build ========= */
(function buildPiano(){
  const PIANO_RANGE = [
    'C','C#','D','D#','E','F','F#','G','G#','A','A#','B',
    'C2','C#2','D2','D#2','E2','F2','F#2','G2','G#2','A2','A#2','B2',
    'C3','C#3','D3'
  ];
  const whiteKeys = PIANO_RANGE.filter(n=>!n.includes('#'));
  const blackKeys = PIANO_RANGE.filter(n=> n.includes('#'));
  const whiteMap  = {};

  /* white keys */
  whiteKeys.forEach(note=>{
    const el=document.createElement('div');
    el.className='white-key'; el.dataset.note=note;
    if(RECORDER_RANGE.includes(note)) el.addEventListener('click',()=>renderSingle(note));
    else {el.style.background='#eee'; el.style.cursor='not-allowed';}

    const base=note.replace(/[0-9]/,'');
    const lbl=document.createElement('div');
    lbl.className='key-label';
    lbl.textContent=(noteToDoremi[base]||base)+(note.includes('2')?"'":(note.includes('3')?"''":''));
    el.appendChild(lbl);

    pianoRoot.appendChild(el);
    whiteMap[note]=el;
  });

  /* black keys */
  blackKeys.forEach(note=>{
    const parent = whiteMap[note.replace('#','')] || whiteMap[note.replace('#','').slice(0,-1)];
    if(!parent) return;
    const bk=document.createElement('div');
    bk.className='black-key'; bk.dataset.note=note;

    if(RECORDER_RANGE.includes(note))
      bk.addEventListener('click',e=>{e.stopPropagation();renderSingle(note);});
    else {bk.style.background='#666'; bk.style.cursor='not-allowed';}

    bk.style.left=`${parent.offsetLeft + 36 - 12}px`; // white-36px / 2
    pianoRoot.appendChild(bk);
  });
})();

/* ========= Fingering chart build ========= */
(function buildChart(){
  if(!boardChart) return;
  RECORDER_RANGE.forEach(note=>{
    const card=createCard(note,getNoteDisplayName(note));
    if(note.includes('#')) card.classList.add('is-black-key');
    card.addEventListener('click',()=>renderSingle(note));
    boardChart.appendChild(card);
    noteToCard[note]=card;
  });
})();

/* ========= Keyboard navigation ========= */
document.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'){e.preventDefault();moveNote(-1);}
  else if(e.key==='ArrowRight'){e.preventDefault();moveNote(1);}
});
