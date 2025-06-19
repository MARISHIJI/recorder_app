/* ========= サンプル曲データ (リコーダー音域対応) ========= */
const SAMPLE_SONGS = [
    { title: 'きらきら星', sequence: 'ド ド ソ ソ ラ ラ ソ\nファ ファ ミ ミ レ レ ド' },
    { title: 'チューリップ', sequence: 'ド レ ミ ド レ ミ\nソ ミ レ ド レ ミ レ\nド レ ミ ド レ ミ\nソ ミ レ ド レ ミ ド' },
    { title: 'メリーさんのひつじ', sequence: 'ミ レ ド レ ミ ミ ミ\nレ レ レ ミ ソ ソ\nミ レ ド レ ミ ミ ミ\nミ レ レ ミ レ ド' },
    { title: '聖者の行進', sequence: 'ソ ド2 ミ2 ソ2 ソ ド2 ミ2 ソ2\nソ ド2 ミ2 ソ2 ミ2 ド2 ミ2 レ2\nミ2 ミ2 レ2 ド2 シ ド2 レ2 ド2\nソ ラ シ ド2 レ2 ミ2 レ2 ド2' },
    { title: '喜びの歌', sequence: 'ミ ミ ファ ソ ソ ファ ミ レ\nド ド レ ミ ミ レ レ\nミ ミ ファ ソ ソ ファ ミ レ\nド ド レ ミ ド レ レ' }
];
    
/* ========= サンプル曲リストの生成 ========= */
(function buildSampleSongList() {
   const listContainer = document.getElementById('sample-song-list');
   if (!listContainer) return;
   listContainer.innerHTML = '';

   SAMPLE_SONGS.forEach(song => {
       const details = document.createElement('details');
       details.className = 'song-item';

       const summary = document.createElement('summary');
       summary.className = 'song-item-title';
       summary.textContent = song.title;

       const content = document.createElement('div');
       content.className = 'song-details-content';

       const pre = document.createElement('pre');
       pre.textContent = song.sequence;

       const loadLink = document.createElement('a');
       loadLink.className = 'btn';
       loadLink.textContent = 'この曲の運指を表示';
       // sequence.htmlへURLパラメータで曲データを渡す
       loadLink.href = `sequence.html?sequence=${encodeURIComponent(song.sequence)}`;

       content.appendChild(pre);
       content.appendChild(loadLink);
       details.appendChild(summary);
       details.appendChild(content);
       listContainer.appendChild(details);
   });
})();