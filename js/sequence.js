/* ========= Web Audio & Data ========= */
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

const NOTE_TO_INDEX = Object.fromEntries(RECORDER_RANGE.map((n,i)=>[n,i]));

/* ========= Token tables ========= */
const INPUT_TO_NOTE = {
  /* ――― octave 1 ――― */
  'ど':'C','ど#':'C#','ど♯':'C#','れ':'D','れ#':'D#','れ♯':'D#','み':'E','ふぁ':'F','ふぁ#':'F#','ふぁ♯':'F#','そ':'G','そ#':'G#','そ♯':'G#','ら':'A','ら#':'A#','ら♯':'A#','し':'B',
  'ド':'C','ド#':'C#','ド♯':'C#','レ':'D','レ#':'D#','レ♯':'D#','ミ':'E','ファ':'F','ファ#':'F#','ファ♯':'F#','ソ':'G','ソ#':'G#','ソ♯':'G#','ラ':'A','ラ#':'A#','ラ♯':'A#','シ':'B',
  'C':'C','C#':'C#','D':'D','D#':'D#','E':'E','F':'F','F#':'F#','G':'G','G#':'G#','A':'A','A#':'A#','B':'B',
  'Db':'C#','D♭':'C#','Eb':'D#','E♭':'D#','Gb':'F#','G♭':'F#','Ab':'G#','A♭':'G#','Bb':'A#','B♭':'A#',

  /* ――― octave 2 (Hi) ――― */
  'ど2':'C2','ど#2':'C#2','ど♯2':'C#2','れ2':'D2','れ#2':'D#2','れ♯2':'D#2','み2':'E2',
  'ふぁ2':'F2','ふぁ#2':'F#2','ふぁ♯2':'F#2','そ2':'G2','そ#2':'G#2','そ♯2':'G#2','ら2':'A2','ら#2':'A#2','ら♯2':'A#2','し2':'B2',

  'ド2':'C2','ド#2':'C#2','ド♯2':'C#2','レ2':'D2','レ#2':'D#2','レ♯2':'D#2','ミ2':'E2',
  'ファ2':'F2','ファ#2':'F#2','ファ♯2':'F#2','ソ2':'G2','ソ#2':'G#2','ソ♯2':'G#2','ラ2':'A2','ラ#2':'A#2','ラ♯2':'A#2','シ2':'B2',

  'どhi':'C2','ドHi':'C2','れhi':'D2','レHi':'D2','ミhi':'E2','ミHi':'E2','ソhi':'G2','ソHi':'G2','ラhi':'A2','ラHi':'A2','シhi':'B2','シHi':'B2',

  'C2':'C2','C#2':'C#2','D2':'D2','D#2':'D#2','E2':'E2','F2':'F2','F#2':'F#2','G2':'G2','G#2':'G#2','A2':'A2','A#2':'A#2','B2':'B2',
  'Db2':'C#2','D♭2':'C#2','Eb2':'D#2','E♭2':'D#2','Gb2':'F#2','G♭2':'F#2','Ab2':'G#2','A♭2':'G#2','Bb2':'A#2','B♭2':'A#2',

  /* ――― octave 3 (Hi-Hi) ――― */
  'ど3':'C3','ど#3':'C#3','ド3':'C3','ド#3':'C#3','C3':'C3','C#3':'C#3',
  'どhihi':'C3','どHiHi':'C3','ドhihi':'C3','ドHiHi':'C3',
  'ど#hihi':'C#3','ど#HiHi':'C#3','ド#hihi':'C#3','ド#HiHi':'C#3'
};

/* ========= 同名異オクターブ表 (クリック切替用) ========= */
const AMBIGUOUS_NOTE_MAP = {};
RECORDER_RANGE.forEach(n=>{
  const base = n.replace(/[23]/,'');
  (AMBIGUOUS_NOTE_MAP[base] ||= []).push(n);
});

/* ========= 追加 Hi / HiHi エイリアス自動生成 ========= */
(function augmentHiAliases(){
  const table=[{suf:['hi','Hi','HI'],o:1},{suf:['hihi','HiHi','HIHI','Hi-Hi','hi-hi','HI-HI'],o:2}];
  Object.entries(INPUT_TO_NOTE).forEach(([t,note])=>{
    const base = note.replace(/[23]/,'');
    const vars = AMBIGUOUS_NOTE_MAP[base];
    if(!vars) return;
    table.forEach(({suf,o})=>{
      const target = vars[Math.min(o,vars.length-1)];
      suf.forEach(s=>{INPUT_TO_NOTE[t+s] = target;});
    });
  });
})();

/* ========= 検索正規表現 ========= */
const ESCAPED_KEYS = Object.keys(INPUT_TO_NOTE)
  .sort((a,b)=>b.length-a.length)
  .map(k=>k.replace(/[.*+?^${}()|[\\]\\\\]/g,'\\\\$&'));

/* ========= 表示名テーブル ========= */
const NOTE_TO_DISPLAY = {
  'C':'ド','C#':'ド♯','D':'レ','D#':'レ♯','E':'ミ','F':'ファ','F#':'ファ♯','G':'ソ','G#':'ソ♯','A':'ラ','A#':'ラ♯','B':'シ',
  'C2':'ドHi','C#2':'ド♯Hi','D2':'レHi','D#2':'レ♯Hi','E2':'ミHi','F2':'ファHi','F#2':'ファ♯Hi','G2':'ソHi','G#2':'ソ♯Hi','A2':'ラHi','A#2':'ラ♯Hi','B2':'シHi',
  'C3':'ドHi-Hi','C#3':'ド♯Hi-Hi'
};

/* ========= 画像パス ========= */
const IMG_PATH = './img/';
const FINGERING_IMG = {
  'C':'fingering_C.png','C#':'fingering_Cs.png','D':'fingering_D.png','D#':'fingering_Ds.png','E':'fingering_E.png','F':'fingering_F.png','F#':'fingering_Fs.png','G':'fingering_G.png','G#':'fingering_Gs.png','A':'fingering_A.png','A#':'fingering_As.png','B':'fingering_B.png',
  'C2':'fingering_C2.png','C#2':'fingering_Cs2.png','D2':'fingering_D2.png','D#2':'fingering_Ds2.png','E2':'fingering_E2.png','F2':'fingering_F2.png','F#2':'fingering_Fs2.png','G2':'fingering_G2.png','G#2':'fingering_Gs2.png','A2':'fingering_A2.png','A#2':'fingering_As2.png','B2':'fingering_B2.png',
  'C3':'fingering_C3.png','C#3':'fingering_Cs3.png'
};

/* ========= DOM ========= */
const pianoRoot              = document.getElementById('piano');
const keyFingeringDisplay    = document.getElementById('key-fingering-display');
const keyboardSection        = document.getElementById('keyboard-section');
const seqInput               = document.getElementById('seq-input');
const boardSeq               = document.getElementById('board-seq');
const transposeControls      = document.getElementById('transpose-controls');
const transposeLevel         = document.getElementById('transpose-level');
const transposeUp            = document.getElementById('transpose-up');
const transposeDown          = document.getElementById('transpose-down');
const toggleKeyboardBtn      = document.getElementById('toggle-keyboard-btn');
const mobilePrevBtn          = document.getElementById('mobile-prev-btn');
const mobileNextBtn          = document.getElementById('mobile-next-btn');
const helpIcon               = document.getElementById('help-icon');
const helpBubble             = document.getElementById('help-bubble');

/* ========= State ========= */
let currentSequenceIndex = null;
let originalSequence     = [];      // {note:'C'|REST|LINEBREAK, lyric?:string}
let transposition        = 0;

/* ========= Audio helper ========= */
function playNote(freq,dur=0.45){
  if(!audioContext||!freq) return;
  if(audioContext.state==='suspended') audioContext.resume();
  const osc  = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type='sine';
  osc.frequency.setValueAtTime(freq,audioContext.currentTime);
  gain.gain.setValueAtTime(0.5,audioContext.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001,audioContext.currentTime+dur);
  osc.connect(gain); gain.connect(audioContext.destination);
  osc.start(); osc.stop(audioContext.currentTime+dur);
}

/* ========= UI helpers ========= */
function createCard(note,label){
  const wrap = document.createElement('div');
  wrap.className='card';
  const lbl = document.createElement('div');
  lbl.className='note-label';
  lbl.textContent=label;

  if(note && note!=='REST' && note!=='LINEBREAK'){
    if(note.includes('3')) lbl.style.color='var(--high-octave-color)';
    else if(note.includes('2')) lbl.style.color='var(--accent-color)';
  }

  if(note==='REST' || note===null){
    wrap.classList.add('rest-card');
    lbl.style.color = note==='REST' ? 'var(--text-light-color)' : '#888';
    wrap.appendChild(lbl);
    return wrap;
  }

  const img = document.createElement('img');
  img.onerror = ()=>{img.style.display='none'; lbl.style.color='#888'; lbl.textContent+=' (画像なし)';};
  if(note && FINGERING_IMG[note]){
    img.src = IMG_PATH + FINGERING_IMG[note];
    img.alt = '';
  }else{
    img.style.display='none';
  }

  wrap.appendChild(lbl);
  wrap.appendChild(img);
  return wrap;
}

function highlightPianoKeys(note){
  pianoRoot.querySelectorAll('.white-key,.black-key')
    .forEach(k=>k.classList.toggle('active',k.dataset.note===note));
}

function transposeNote(note,step){
  if(note==='REST' || note==='LINEBREAK') return note;
  const idx = NOTE_TO_INDEX[note];
  if(idx===undefined) return null;
  const newIdx = idx + step;
  if(newIdx<0 || newIdx>=RECORDER_RANGE.length) return null;
  return RECORDER_RANGE[newIdx];
}

function renderSingle(note){
  if(!RECORDER_RANGE.includes(note)){
    highlightPianoKeys(null);
    keyFingeringDisplay.innerHTML='';
    keyFingeringDisplay.appendChild(createCard(null,'音域外'));
    return;
  }
  highlightPianoKeys(note);
  keyFingeringDisplay.innerHTML='';
  keyFingeringDisplay.appendChild(createCard(note,NOTE_TO_DISPLAY[note]||note));
  playNote(NOTE_FREQUENCIES[note]);
}

/* ========= Piano builder ========= */
function buildPiano(){
  const wasVisible = keyboardSection.classList.contains('visible');
  if(!wasVisible){
    keyboardSection.style.visibility='hidden';
    keyboardSection.classList.add('visible');
  }

  pianoRoot.innerHTML='';
  const PIANO_RANGE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B',
                       'C2','C#2','D2','D#2','E2','F2','F#2','G2','G#2','A2','A#2','B2',
                       'C3','C#3','D3'];

  const white = PIANO_RANGE.filter(n=>!n.includes('#'));
  const black = PIANO_RANGE.filter(n=> n.includes('#'));
  const whiteEl = {};
  const jp = {'C':'ド','D':'レ','E':'ミ','F':'ファ','G':'ソ','A':'ラ','B':'シ'};

  /* white keys */
  white.forEach(n=>{
    const el = document.createElement('div');
    el.className='white-key';
    el.dataset.note=n;
    if(RECORDER_RANGE.includes(n)){
      el.addEventListener('click',()=>renderSingle(n));
    }else{
      el.style.background='#eee';
      el.style.cursor='not-allowed';
    }
    const base = n.replace(/[0-9]/,'');
    const label = document.createElement('div');
    label.className='key-label';
    label.textContent = jp[base] ? jp[base] + (n.includes('2') ? '\'' : (n.includes('3') ? '\'\'':'') ) : '';
    el.appendChild(label);
    pianoRoot.appendChild(el);
    whiteEl[n]=el;
  });

  /* black keys */
  black.forEach(n=>{
    const parent = whiteEl[n.replace('#','')] || whiteEl[n.replace('#','').slice(0,-1)];
    if(parent){
      const bk = document.createElement('div');
      bk.className='black-key';
      bk.dataset.note=n;
      if(RECORDER_RANGE.includes(n)){
        bk.addEventListener('click',e=>{e.stopPropagation(); renderSingle(n);});
      }else{
        bk.style.background='#666';
        bk.style.cursor='not-allowed';
      }
      bk.style.left = `${parent.offsetLeft + 36 - 12}px`;
      pianoRoot.appendChild(bk);
    }
  });

  if(!wasVisible){
    keyboardSection.classList.remove('visible');
    keyboardSection.style.visibility='visible';
  }
}

/* ========= Sequence parsing ========= */
const TOKEN_REGEX = new RegExp(`(${ESCAPED_KEYS.join('|')})(?:（([^）]+)）)?|([ 　]+)|(\\n)`,'gi');

function parseSequence(raw){
  if(!raw.trim()) return [];
  const out=[];
  const matches=[...raw.matchAll(TOKEN_REGEX)];
  matches.forEach(m=>{
    const [_,token,lyric,space,nl]=m;
    if(nl){ out.push({note:'LINEBREAK'}); return; }
    if(space){ out.push({note:'REST'}); return; }
    if(token){
      const key = token.toUpperCase();
      const note = INPUT_TO_NOTE[key] || INPUT_TO_NOTE[token];
      if(note) out.push({note,lyric:lyric||''});
    }
  });
  return out;
}

/* ========= Grid rendering ========= */
function renderTransposedSequence(){
  boardSeq.innerHTML='';
  if(originalSequence.length===0){ transposeControls.style.display='none'; return; }
  transposeControls.style.display='flex';
  transposeLevel.textContent = `Key: ${transposition>0?'+':''}${transposition}`;

  originalSequence.forEach((item,idx)=>{
    if(item.note==='LINEBREAK'){
      const div=document.createElement('div');
      div.style.gridColumn='1/-1';
      div.style.height='0';
      boardSeq.appendChild(div);
      return;
    }

    let card;
    if(item.note==='REST'){
      card=createCard('REST','休');
    }else{
      const t=transposeNote(item.note,transposition);
      if(t){
        const disp=NOTE_TO_DISPLAY[t]||t;
        card=createCard(t,item.lyric?`${disp}（${item.lyric}）`:disp);
      }else{
        card=createCard(null,'音域外');
      }
    }

    /* 右クリック／ダブルクリックでオクターブ切替 */
    card.addEventListener('contextmenu',e=>{e.preventDefault(); cycleOctave(idx);});
    card.addEventListener('dblclick',e=>{e.preventDefault(); cycleOctave(idx);});

    card.style.cursor='pointer';
    card.addEventListener('click',()=>selectSequenceNote(idx,true));
    boardSeq.appendChild(card);
  });

  if(currentSequenceIndex!==null) selectSequenceNote(currentSequenceIndex,false);
}

/* ========= Octave cycling helper ========= */
function cycleOctave(seqIdx){
  const entry=originalSequence[seqIdx];
  if(!entry || entry.note==='REST' || entry.note==='LINEBREAK') return;
  const base = entry.note.replace(/[23]/,'');
  const vars = AMBIGUOUS_NOTE_MAP[base];
  if(!vars || vars.length<2) return;
  const cur = vars.indexOf(entry.note);
  entry.note = vars[(cur+1)%vars.length];
  renderTransposedSequence();
  selectSequenceNote(seqIdx,false);
}

/* ========= Navigation ========= */
function selectSequenceNote(i,play=true){
  if(i<0||i>=originalSequence.length) return;
  currentSequenceIndex=i;

  /* ハイライト */
  let cardIndex=0;
  for(let j=0;j<i;j++){
    if(originalSequence[j].note!=='LINEBREAK') cardIndex++;
  }
  const cards = boardSeq.querySelectorAll('.card');
  cards.forEach((c,k)=>c.classList.toggle('active',k===cardIndex));
  const item=originalSequence[i];
  if(item.note==='REST'||item.note==='LINEBREAK') return;

  const t=transposeNote(item.note,transposition);
  if(t && play) playNote(NOTE_FREQUENCIES[t]);
}

function navigate(dir){
  if(originalSequence.length===0) return;
  let idx = currentSequenceIndex===null ? (dir===1?-1:originalSequence.length) : currentSequenceIndex;
  do{ idx+=dir; }
  while(idx>=0 && idx<originalSequence.length && originalSequence[idx].note==='LINEBREAK');
  if(idx>=0 && idx<originalSequence.length) selectSequenceNote(idx,true);
}

/* ========= Update ========= */
function updateApp(){
  const txt=seqInput.value;
  history.replaceState({sequence:txt},'',txt.trim() ? `${location.pathname}?sequence=${encodeURIComponent(txt)}` : location.pathname);
  originalSequence = parseSequence(txt);
  currentSequenceIndex=null;
  transposition=0;
  renderTransposedSequence();
}

/* ========= Bindings ========= */
transposeUp.addEventListener('click',()=>{transposition++; renderTransposedSequence();});
transposeDown.addEventListener('click',()=>{transposition--; renderTransposedSequence();});

mobilePrevBtn.addEventListener('click',()=>navigate(-1));
mobileNextBtn.addEventListener('click',()=>navigate(1));

document.addEventListener('keydown',e=>{
  if(document.activeElement===seqInput) return;
  if(e.key==='ArrowLeft'){ e.preventDefault(); navigate(-1); }
  else if(e.key==='ArrowRight'){ e.preventDefault(); navigate(1); }
});

seqInput.addEventListener('input',updateApp);

toggleKeyboardBtn.addEventListener('click',()=>{
  keyboardSection.classList.toggle('visible');
  toggleKeyboardBtn.textContent = keyboardSection.classList.contains('visible') ? 'キーボードを非表示' : 'キーボードを表示';
  if(!keyboardSection.classList.contains('visible')) highlightPianoKeys(null);
});

helpIcon.addEventListener('click',e=>{
  e.stopPropagation();
  helpBubble.classList.toggle('visible');
});
document.addEventListener('click',e=>{
  if(helpBubble.classList.contains('visible') && !helpIcon.contains(e.target) && !helpBubble.contains(e.target)){
    helpBubble.classList.remove('visible');
  }
});

/* ========= Init ========= */
window.addEventListener('load',()=>{
  buildPiano();
  const params=new URLSearchParams(location.search);
  const s=params.get('sequence');
  if(s) seqInput.value=decodeURIComponent(s);
  updateApp();
});
