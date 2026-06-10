// Renderer (View logic): đọc giọng từ folder local qua window.api.

const $ = (sel) => document.querySelector(sel);

let allVoices = [];      // toàn bộ giọng từ manifest
let languages = [];      // danh sách ngôn ngữ
let currentLang = '';    // tab ngôn ngữ đang chọn ('' = tất cả)
const player = $('#player');
let playingCard = null;

// ----- Khởi động -----
async function init() {
    $('#downloadDir').textContent = await window.api.getDownloadDir();
    try {
        allVoices = await window.api.getLocalVoices();
    } catch (e) {
        setMessage('Lỗi tải danh sách giọng: ' + e.message, 'err');
        return;
    }
    languages = [...new Set(allVoices.map((v) => v.language))];
    buildLangTabs();
    render();
}

// ----- Tabs ngôn ngữ -----
function buildLangTabs() {
    const nav = $('#langTabs');
    nav.innerHTML = '';
    const tabs = [{ key: '', label: `Tất cả (${allVoices.length})` }].concat(
        languages.map((l) => ({ key: l, label: `${l} (${allVoices.filter((v) => v.language === l).length})` }))
    );
    tabs.forEach((t, idx) => {
        const btn = document.createElement('button');
        btn.className = 'tab' + (idx === 0 ? ' active' : '');
        btn.textContent = t.label;
        btn.addEventListener('click', () => {
            currentLang = t.key;
            nav.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'));
            btn.classList.add('active');
            render();
        });
        nav.appendChild(btn);
    });
}

// ----- Lọc + render -----
function visibleVoices() {
    const q = $('#searchInput').value.trim().toLowerCase();
    return allVoices.filter((v) => {
        if (currentLang && v.language !== currentLang) return false;
        if (q && !v.name.toLowerCase().includes(q)) return false;
        return true;
    });
}

function render() {
    const voices = visibleVoices();
    const grid = $('#voiceGrid');
    grid.innerHTML = '';
    voices.forEach((v) => grid.appendChild(buildCard(v)));
    setMessage(`Hiển thị ${voices.length} giọng.`, '');
}

function buildCard(v) {
    const card = document.createElement('div');
    card.className = 'voice-card';
    card.innerHTML = `
        <div class="vc-head">
            <div class="vc-avatar">${escHtml((v.name[0] || '?').toUpperCase())}</div>
            <div>
                <div class="vc-name">${escHtml(v.name)}</div>
                <div class="vc-sub">${escHtml(v.language)}</div>
            </div>
        </div>
        <div class="vc-actions">
            <button class="btn play-btn">▶ Nghe</button>
            <button class="btn ghost dl-btn">⬇ Tải</button>
        </div>
    `;

    const playBtn = card.querySelector('.play-btn');
    const dlBtn = card.querySelector('.dl-btn');

    playBtn.addEventListener('click', () => togglePlay(v, card, playBtn));

    dlBtn.addEventListener('click', async () => {
        const old = dlBtn.textContent;
        dlBtn.disabled = true;
        dlBtn.textContent = 'Đang tải...';
        try {
            const filePath = await window.api.downloadVoice({ file: v.file, name: v.name });
            setMessage('✅ Đã tải: ' + filePath, '');
            dlBtn.textContent = '✓ Đã tải';
        } catch (e) {
            setMessage('Lỗi tải: ' + e.message, 'err');
            dlBtn.textContent = old;
        } finally {
            dlBtn.disabled = false;
        }
    });

    return card;
}

// ----- Tải tất cả đang hiện -----
$('#downloadAllBtn').addEventListener('click', async () => {
    const voices = visibleVoices();
    if (voices.length === 0) return;
    const btn = $('#downloadAllBtn');
    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = `Đang tải ${voices.length} giọng...`;
    try {
        const res = await window.api.downloadMany(voices.map((v) => ({ file: v.file, name: v.name })));
        setMessage(`✅ Đã tải ${res.downloaded}/${voices.length} giọng về: ${res.dir}`, '');
    } catch (e) {
        setMessage('Lỗi tải hàng loạt: ' + e.message, 'err');
    } finally {
        btn.disabled = false;
        btn.textContent = old;
    }
});

// ----- Phát / dừng preview -----
function togglePlay(v, card, btn) {
    if (playingCard === card && !player.paused) {
        player.pause();
        return;
    }
    if (playingCard) {
        playingCard.classList.remove('playing');
        const oldBtn = playingCard.querySelector('.play-btn');
        if (oldBtn) oldBtn.textContent = '▶ Nghe';
    }
    player.src = v.src;
    player.play().catch((e) => setMessage('Không phát được: ' + e.message, 'err'));
    playingCard = card;
    card.classList.add('playing');
    btn.textContent = '⏸ Dừng';
}

player.addEventListener('ended', resetPlayer);
player.addEventListener('pause', () => {
    if (playingCard) {
        const btn = playingCard.querySelector('.play-btn');
        if (btn) btn.textContent = '▶ Nghe';
    }
});
player.addEventListener('play', () => {
    if (playingCard) {
        const btn = playingCard.querySelector('.play-btn');
        if (btn) btn.textContent = '⏸ Dừng';
    }
});

function resetPlayer() {
    if (playingCard) {
        playingCard.classList.remove('playing');
        const btn = playingCard.querySelector('.play-btn');
        if (btn) btn.textContent = '▶ Nghe';
    }
    playingCard = null;
}

// ----- Đổi thư mục tải -----
$('#chooseDirBtn').addEventListener('click', async () => {
    const dir = await window.api.chooseDownloadDir();
    $('#downloadDir').textContent = dir;
});

// ----- Tìm kiếm -----
$('#searchInput').addEventListener('input', render);

// ----- Helpers -----
function setMessage(html, cls) {
    const el = $('#message');
    el.innerHTML = html;
    el.className = 'message ' + (cls || '');
}
function escHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

init();
