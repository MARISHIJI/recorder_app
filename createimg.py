import os
from music21 import stream, note, clef, environment, meter, bar

# --------------------------------------------------------------------------
# 1. MuseScore 4 の場所を指定する設定 (環境に合わせて変更してください)
# --------------------------------------------------------------------------
env = environment.Environment()
# Macの場合の例
env['musicxmlPath'] = '/Applications/MuseScore 4.app/Contents/MacOS/mscore'
env['musescoreDirectPNGPath'] = '/Applications/MuseScore 4.app/Contents/MacOS/mscore'
# Windowsの場合の例 (ご自身のインストール場所を確認してください)
# env['musicxmlPath'] = r'C:\Program Files\MuseScore 4\bin\MuseScore4.exe'
# env['musescoreDirectPNGPath'] = r'C:\Program Files\MuseScore 4\bin\MuseScore4.exe'

# --------------------------------------------------------------------------
# 2. ファイル名の定義 (この部分は変更ありません)
# --------------------------------------------------------------------------
STAFF_IMG = {
    'C':'staff_C.png',   'C#':'staff_Cs.png',   'Db':'staff_Db.png',
    'D':'staff_D.png',   'D#':'staff_Ds.png',   'Eb':'staff_Eb.png',
    'E':'staff_E.png',   'F':'staff_F.png',   'F#':'staff_Fs.png',   'Gb':'staff_Gb.png',
    'G':'staff_G.png',   'G#':'staff_Gs.png',   'Ab':'staff_Ab.png',
    'A':'staff_A.png',   'A#':'staff_As.png',   'Bb':'staff_Bb.png',
    'B':'staff_B.png',
    'C2':'staff_C2.png',  'C#2':'staff_Cs2.png',  'Db2':'staff_Db2.png',
    'D2':'staff_D2.png',  'D#2':'staff_Ds2.png',  'Eb2':'staff_Eb2.png',
    'E2':'staff_E2.png',  'F2':'staff_F2.png',  'F#2':'staff_Fs2.png',  'Gb2':'staff_Gb2.png',
    'G2':'staff_G2.png',  'G#2':'staff_Gs2.png',  'Ab2':'staff_Ab2.png',
    'A2':'staff_A2.png',  'A#2':'staff_As2.png',  'Bb2':'staff_Bb2.png',
    'B2':'staff_B2.png',
    'C3':'staff_C3.png',  'C#3':'staff_Cs3.png',  'Db3':'staff_Db3.png'
}
STAFF_BLANK = 'staff_blank.png'

# --------------------------------------------------------------------------
# 3. 音名の対応表 (全体を1オクターブ下げる)
# --------------------------------------------------------------------------
# ▼▼▼ ここが修正箇所です ▼▼▼
NOTE_MAP = {
    'C': 'C4',   'C#': 'C#4', 'Db': 'D-4',
    'D': 'D4',   'D#': 'D#4', 'Eb': 'E-4',
    'E': 'E4',   'F': 'F4',   'F#': 'F#4', 'Gb': 'G-4',
    'G': 'G4',   'G#': 'G#4', 'Ab': 'A-4',
    'A': 'A4',   'A#': 'A#4', 'Bb': 'B-4',
    'B': 'B4',
    'C2': 'C5',  'C#2': 'C#5', 'Db2': 'D-5',
    'D2': 'D5',  'D#2': 'D#5', 'Eb2': 'E-5',
    'E2': 'E5',  'F2': 'F5',  'F#2': 'F#5', 'Gb2': 'G-5',
    'G2': 'G5',  'G#2': 'G#5', 'Ab2': 'A-5',
    'A2': 'A5',  'A#2': 'A#5', 'Bb2': 'B-5',
    'B2': 'B5',
    'C3': 'C6',  'C#3': 'C#6', 'Db3': 'D-6'
}
# ▲▲▲ ここまでが修正箇所です ▲▲▲

# --------------------------------------------------------------------------
# 4. 異名同音のペアを定義 (この部分は変更ありません)
# --------------------------------------------------------------------------
ENHARMONIC_PAIRS = {
    'C#': 'Db',   'D#': 'Eb',   'F#': 'Gb',   'G#': 'Ab',   'A#': 'Bb',
    'C#2': 'Db2', 'D#2': 'Eb2', 'F#2': 'Gb2', 'G#2': 'Ab2', 'A#2': 'Bb2',
    'C#3': 'Db3'
}


# --------------------------------------------------------------------------
# 5. 画像を生成するメインの処理 (この部分のロジックは変更ありません)
# --------------------------------------------------------------------------
def generate_images():
    """必要な五線譜画像をすべて生成する"""
    output_dir = 'img'
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        print(f"'{output_dir}' フォルダを作成しました。")

    processed_keys = set()

    print("\n各音符の五線譜画像を生成します...")
    for key, filename in sorted(STAFF_IMG.items()):
        if key in processed_keys:
            continue

        s = stream.Score()
        p = stream.Part()
        m = stream.Measure()

        ts = meter.TimeSignature('4/4')
        ts.style.hideObjectOnPrint = True
        m.append(ts)
        m.append(clef.TrebleClef())

        if key in ENHARMONIC_PAIRS:
            sharp_key = key
            flat_key = ENHARMONIC_PAIRS[sharp_key]
            
            print(f"異名同音ペア ({sharp_key} と {flat_key}) を処理します...")

            n_sharp = note.Note(NOTE_MAP[sharp_key])
            n_sharp.duration.type = 'quarter'
            m.append(n_sharp)
            
            n_flat = note.Note(NOTE_MAP[flat_key])
            n_flat.duration.type = 'quarter'
            m.append(n_flat)

            processed_keys.add(sharp_key)
            processed_keys.add(flat_key)
            
            m.rightBarline = bar.Barline('none')
            p.append(m)
            s.append(p)

            filepath_sharp = os.path.join(output_dir, STAFF_IMG[sharp_key])
            try:
                s.write('musicxml.png', fp=filepath_sharp)
                print(f"✅ {STAFF_IMG[sharp_key]} を生成しました。")
            except Exception as e:
                print(f"❌ {STAFF_IMG[sharp_key]} の生成に失敗しました。エラー: {e}")
            
            filepath_flat = os.path.join(output_dir, STAFF_IMG[flat_key])
            try:
                s.write('musicxml.png', fp=filepath_flat)
                print(f"✅ {STAFF_IMG[flat_key]} を生成しました。")
            except Exception as e:
                print(f"❌ {STAFF_IMG[flat_key]} の生成に失敗しました。エラー: {e}")

        else:
            if key not in NOTE_MAP:
                print(f"警告: '{key}' の音符マッピングが見つかりません。スキップします。")
                continue
            
            n = note.Note(NOTE_MAP[key])
            n.duration.type = 'quarter'
            m.append(n)
            
            processed_keys.add(key)
            
            m.rightBarline = bar.Barline('none')
            p.append(m)
            s.append(p)

            filepath = os.path.join(output_dir, filename)
            try:
                s.write('musicxml.png', fp=filepath)
                print(f"✅ {filename} を生成しました。")
            except Exception as e:
                print(f"❌ {filename} の生成に失敗しました。エラー: {e}")
        
    print("\n空の五線譜画像を生成します...")
    s_blank = stream.Score()
    p_blank = stream.Part()
    m_blank = stream.Measure()
    
    ts_blank = meter.TimeSignature('4/4')
    ts_blank.style.hideObjectOnPrint = True
    m_blank.append(ts_blank)
    m_blank.append(clef.TrebleClef())
    
    r = note.Rest(type='whole')
    r.style.hideObjectOnPrint = True
    m_blank.append(r)
    
    m_blank.rightBarline = bar.Barline('none')
    
    p_blank.append(m_blank)
    s_blank.append(p_blank)

    filepath_blank = os.path.join(output_dir, STAFF_BLANK)
    try:
        s_blank.write('musicxml.png', fp=filepath_blank)
        print(f"✅ {STAFF_BLANK} を生成しました。")
    except Exception as e:
        print(f"❌ {STAFF_BLANK} の生成に失敗しました。エラー: {e}")

    print("\nすべての処理が完了しました。")

if __name__ == '__main__':
    generate_images()