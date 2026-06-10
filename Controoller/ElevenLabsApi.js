// Controller: Giao tiếp với ElevenLabs API (Voice Library = shared voices).
// Docs: https://api.elevenlabs.io/v1/shared-voices  và  /v1/voices
const https = require('https');

const BASE = 'api.elevenlabs.io';

// Gọi GET tới ElevenLabs, trả về JSON đã parse.
function apiGet(pathWithQuery, apiKey) {
    return new Promise((resolve, reject) => {
        const headers = { 'Accept': 'application/json' };
        if (apiKey) headers['xi-api-key'] = apiKey; // chỉ gửi key khi có
        const options = {
            hostname: BASE,
            path: pathWithQuery,
            method: 'GET',
            headers,
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => (data += chunk));
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Phản hồi không phải JSON hợp lệ.'));
                    }
                } else {
                    let msg = `HTTP ${res.statusCode}`;
                    try {
                        const err = JSON.parse(data);
                        msg = err.detail?.message || err.detail || msg;
                    } catch (_) {}
                    reject(new Error(msg));
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

// Tải nội dung nhị phân (preview audio) về dưới dạng Buffer.
function downloadBuffer(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    // theo redirect
                    return downloadBuffer(res.headers.location).then(resolve).catch(reject);
                }
                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode} khi tải file`));
                }
                const chunks = [];
                res.on('data', (c) => chunks.push(c));
                res.on('end', () => resolve(Buffer.concat(chunks)));
            })
            .on('error', reject);
    });
}

module.exports = {
    // Lấy danh sách giọng từ Voice Library (shared voices) với bộ lọc/tìm kiếm + phân trang.
    async getSharedVoices(apiKey, { search = '', page = 0, pageSize = 30, gender = '', language = '' } = {}) {
        const params = new URLSearchParams();
        params.set('page_size', String(pageSize));
        params.set('page', String(page));
        if (search) params.set('search', search);
        if (gender) params.set('gender', gender);
        if (language) params.set('language', language);

        const json = await apiGet(`/v1/shared-voices?${params.toString()}`, apiKey);
        return {
            voices: (json.voices || []).map(normalizeVoice),
            hasMore: !!json.has_more,
            lastSortId: json.last_sort_id || null,
        };
    },

    // Lấy các giọng đã có trong tài khoản (My Voices) — dùng để kiểm tra kết nối/key.
    async getMyVoices(apiKey) {
        const json = await apiGet('/v1/voices', apiKey);
        return (json.voices || []).map(normalizeVoice);
    },

    downloadBuffer,
};

// Chuẩn hóa object voice từ API về dạng View dùng được.
function normalizeVoice(v) {
    return {
        voiceId: v.voice_id,
        publicOwnerId: v.public_owner_id || null,
        name: v.name || 'Không tên',
        gender: v.gender || '',
        age: v.age || '',
        accent: v.accent || '',
        language: v.language || '',
        descriptive: v.descriptive || '',
        useCase: v.use_case || '',
        category: v.category || '',
        previewUrl: v.preview_url || '',
        imageUrl: v.image_url || '',
        clonedByCount: v.cloned_by_count || 0,
        freeUsersAllowed: v.free_users_allowed,
    };
}
