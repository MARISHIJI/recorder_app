/* ========= Web Audio ========= */
let audioContext;
try { audioContext = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { console.error('Web Audio API unsupported'); }

/* ========= Soprano Recorder (Baroque) Range & Data (C5-C#7) ========= */
const RECORDER_RANGE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C2','C#2','D2','D#2','E2','F2','F#2','G2','G#2','A2','A#2','B2','C3','C#3'];
const NOTE_FREQUENCIES = {'C':523.25,'C#':554.37,'D':587.33,'D#':622.25,'E':659.25,'F':698.46,'F#':739.99,'G':783.99,'G#':830.61,'A':880.00,'A#':932.33,'B':987.77,'C2':1046.50,'C#2':1108.73,'D2':1174.66,'D#2':1244.51,'E2':1318.51,'F2':1396.91,'F#2':1479.98,'G2':1567.98,'G#2':1661.22,'A2':1760.00,'A#2':1864.66,'B2':1975.53,'C3':2093.00,'C#3':2217.46};
const NOTE_TO_INDEX = Object.fromEntries(RECORDER_RANGE.map((n,i) => [n,i]));
const IMG_PATH = './img/';
// 画像ファイル名は音域に合わせて追加します
const FINGERING_IMG = {'C':'fingering_C.png','C#':'fingering_Cs.png','D':'fingering_D.png','D#':'fingering_Ds.png','E':'fingering_E.png','F':'fingering_F.png','F#':'fingering_Fs.png','G':'fingering_G.png','G#':'fingering_Gs.png','A':'fingering_A.png','A#':'fingering_As.png','B':'fingering_B.png','C2':'fingering_C2.png','C#2':'fingering_Cs2.png','D2':'fingering_D2.png','D#2':'fingering_Ds2.png','E2':'fingering_E2.png','F2':'fingering_F2.png','F#2':'fingering_Fs2.png','G2':'fingering_G2.png','G#2':'fingering_Gs2.png','A2':'fingering_A2.png','A#2':'fingering_As2.png','B2':'fingering_B2.png','C3':'fingering_C3.png','C#3':'fingering_Cs3.png'};
const STAFF_IMG = {'C':'staff_C.png','C#':'staff_Cs.png','Db':'staff_Db.png','D':'staff_D.png','D#':'staff_Ds.png','Eb':'staff_Eb.png','E':'staff_E.png','F':'staff_F.png','F#':'staff_Fs.png','Gb':'staff_Gb.png','G':'staff_G.png','G#':'staff_Gs.png','Ab':'staff_Ab.png','A':'staff_A.png','A#':'staff_As.png','Bb':'staff_Bb.png','B':'staff_B.png','C2':'staff_C2.png','C#2':'staff_Cs2.png','Db2':'staff_Db2.png','D2':'staff_D2.png','D#2':'staff_Ds2.png','Eb2':'staff_Eb2.png','E2':'staff_E2.png','F2':'staff_F2.png','F#2':'staff_Fs2.png','Gb2':'staff_Gb2.png','G2':'staff_G2.png','G#2':'staff_Gs2.png','Ab2':'staff_Gs2.png','A2':'staff_A2.png','A#2':'staff_As2.png','Bb2':'staff_Bb2.png','B2':'staff_B2.png','C3':'staff_C3.png','C#3':'staff_Cs3.png','Db3':'staff_Cs3.png'};
const STAFF_BLANK = 'staff_blank.png';
const SHARP_TO_FLAT = {'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb','C#2':'Db2','D#2':'Eb2','F#2':'Gb2','G#2':'Ab2','A#2':'Bb2','C#3':'Db3'};

/* ========= DOM ========= */
const pianoRoot = document.getElementById('piano');
const staffImg  = document.getElementById('staff-img');
const keyFingeringDisplay = document.getElementById('key-fingering-display');

/* ========= 状態 ========= */
let currentNoteIndex = null;

/* ========= Audio ========= */
function playNote(freq, dur = 0.45) {
    if (!audioContext || !freq) return;
    if (audioContext.state === 'suspended') audioContext.resume();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, audioContext.currentTime);
    gain.gain.setValueAtTime(0.5, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + dur);
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.start(); osc.stop(audioContext.currentTime + dur);
}

/* ========= UI Helper ========= */
function getNoteDisplayName(note) {
    if (note in SHARP_TO_FLAT) {
        const sharpName = note.replace('#', '♯');
        const flatName = SHARP_TO_FLAT[note].replace('b', '♭');
        return `${sharpName} / ${flatName}`;
    }
    return note.replace('#', '♯');
}

function setStaff(key) {
    staffImg.src = key && STAFF_IMG[key] ? IMG_PATH + STAFF_IMG[key] : IMG_PATH + STAFF_BLANK;
}
function highlightKeys(note) {
    document.querySelectorAll('.piano .white-key, .piano .black-key').forEach(k => k.classList.toggle('active', k.dataset.note === note));
}
function createCard(note, label) {
    const wrap = document.createElement('div');
    wrap.className = 'card';
    const lbl = document.createElement('div');
    lbl.className = 'note-label';
    lbl.textContent = label;
    const img = document.createElement('img');
    img.onerror = () => { img.style.display = 'none'; lbl.style.color = '#888'; lbl.textContent += ' (画像なし)'; };
    if (note && FINGERING_IMG[note]) { img.src = IMG_PATH + FINGERING_IMG[note]; img.alt = `${note} fingering`; } else { img.style.display = 'none'; }
    wrap.appendChild(lbl); wrap.appendChild(img);
    return wrap;
}

function renderSingle(note) {
    if (!(note in NOTE_FREQUENCIES)) return;
    const staffKey = SHARP_TO_FLAT[note] || note;
    highlightKeys(note);
    setStaff(staffKey);
    keyFingeringDisplay.innerHTML = '';
    
    const displayName = getNoteDisplayName(note);
    const card = createCard(note, displayName);

    keyFingeringDisplay.appendChild(card);
    playNote(NOTE_FREQUENCIES[note]);
    currentNoteIndex = NOTE_TO_INDEX[note];
}

function moveNote(step) {
    if (currentNoteIndex === null) {
        renderSingle(RECORDER_RANGE[0]);
        return;
    }
    const newIdx = currentNoteIndex + step;
    if (newIdx < 0 || newIdx >= RECORDER_RANGE.length) return;
    renderSingle(RECORDER_RANGE[newIdx]);
}

/* ========= Piano Build ========= */
(function buildPiano() {
    const PIANO_RANGE = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B','C2','C#2','D2','D#2','E2','F2','F#2','G2','G#2','A2','A#2','B2','C3','C#3','D3'];
    const whiteKeysData = PIANO_RANGE.filter(n => !n.includes('#'));
    const blackKeysData = PIANO_RANGE.filter(n => n.includes('#'));
    const whiteKeyElements = {};
    const noteToDoremi = { 'C': 'ド', 'D': 'レ', 'E': 'ミ', 'F': 'ファ', 'G': 'ソ', 'A': 'ラ', 'B': 'シ' };

    whiteKeysData.forEach(noteName => {
        const el = document.createElement('div');
        el.className = 'white-key';
        el.dataset.note = noteName;
        // Only add click listener if the note is in the recorder range
        if (RECORDER_RANGE.includes(noteName)) {
            el.addEventListener('click', () => renderSingle(noteName));
        } else {
            el.style.background = '#eee'; // Visually disable keys outside the range
            el.style.cursor = 'not-allowed';
        }
        const baseNote = noteName.replace(/[0-9]/, '');
        const doremiText = noteToDoremi[baseNote];
        if (doremiText) {
            const label = document.createElement('div');
            label.className = 'key-label';
            let labelText = doremiText;
            if (noteName.includes('2')) labelText += "'";
            if (noteName.includes('3')) labelText += "''";
            label.textContent = labelText;
            el.appendChild(label);
        }
        pianoRoot.appendChild(el);
        whiteKeyElements[noteName] = el;
    });

    blackKeysData.forEach(noteName => {
        const parentWhiteKeyName = noteName.replace('#', '');
        const parentElement = whiteKeyElements[parentWhiteKeyName] || whiteKeyElements[parentWhiteKeyName.slice(0, -1)];
        if (parentElement) {
            const blackKeyElement = document.createElement('div');
            blackKeyElement.className = 'black-key';
            blackKeyElement.dataset.note = noteName;
            
            if (RECORDER_RANGE.includes(noteName)) {
                 blackKeyElement.addEventListener('click', e => {
                    e.stopPropagation();
                    renderSingle(noteName);
                });
            } else {
                blackKeyElement.style.background = '#666';
                blackKeyElement.style.cursor = 'not-allowed';
            }

            const whiteKeyWidth = 36;
            const blackKeyWidth = 26;
            blackKeyElement.style.left = `${parentElement.offsetLeft + whiteKeyWidth - (blackKeyWidth / 2)}px`;
            
            pianoRoot.appendChild(blackKeyElement);
        }
    });
})();

/* ========= Keyboard Navigation ========= */
document.addEventListener('keydown', e => {
    const isLeft = e.key === 'ArrowLeft';
    const isRight = e.key === 'ArrowRight';
    if (!isLeft && !isRight) return;
    e.preventDefault();
    moveNote(isLeft ? -1 : 1);
});

/* ========= Fingering Chart Build ========= */
(function buildFingeringChart() {
    const board = document.getElementById('fingering-chart-board');
    if (!board) return;
    const noteToDoremi = { 'C': 'ド', 'D': 'レ', 'E': 'ミ', 'F': 'ファ', 'G': 'ソ', 'A': 'ラ', 'B': 'シ' };
    RECORDER_RANGE.forEach(note => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';
        card.style.justifyContent = 'space-between';

        if (note.includes('#')) {
            card.classList.add('is-black-key');
        }

        const staffKey = SHARP_TO_FLAT[note] || note;
        
        let octaveSuffix = '';
        if (note.includes('2')) octaveSuffix = 'Hi';
        if (note.includes('3')) octaveSuffix = 'Hi-Hi';

        let labelText = '';

        if (note in SHARP_TO_FLAT) {
            const sharpBase = note.replace(/[0-9#]/g, '');
            const flatNote = SHARP_TO_FLAT[note];
            const flatBase = flatNote.replace(/[0-9b]/g, '');
            const doremiSharp = noteToDoremi[sharpBase] + '♯';
            const doremiFlat = noteToDoremi[flatBase] + '♭';
            labelText = `${doremiSharp}${octaveSuffix} / ${doremiFlat}${octaveSuffix}`;
        } else {
            const baseNote = note.replace(/[0-9]/g, '');
            const doremi = noteToDoremi[baseNote] || '';
            labelText = `${doremi}${octaveSuffix}`;
        }
        
        const lbl = document.createElement('div');
        lbl.className = 'note-label';
        lbl.textContent = labelText;
        const staffImgEl = document.createElement('img');
        staffImgEl.style.width = '200px';
        staffImgEl.style.maxHeight = '100px';
        staffImgEl.style.objectFit = 'contain';
        staffImgEl.style.border = '1px solid var(--border-color)';
        staffImgEl.style.borderRadius = '4px';
        staffImgEl.style.padding = '4px';
        staffImgEl.style.background = '#fff';
        if (STAFF_IMG[staffKey]) {
            staffImgEl.src = IMG_PATH + STAFF_IMG[staffKey];
            staffImgEl.alt = `${staffKey} on staff`;
        } else { staffImgEl.style.display = 'none'; }
        const fingeringImgEl = document.createElement('img');
        if (FINGERING_IMG[note]) {
            fingeringImgEl.src = IMG_PATH + FINGERING_IMG[note];
            fingeringImgEl.alt = `${note} fingering`;
        } else { fingeringImgEl.style.display = 'none'; }
        
        card.addEventListener('click', () => {
            renderSingle(note);
            //window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        card.appendChild(lbl);
        card.appendChild(staffImgEl);
        card.appendChild(fingeringImgEl);
        board.appendChild(card);
    });
})();