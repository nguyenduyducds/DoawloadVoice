// Model: Lưu cấu hình (thư mục tải) vào file local trong thư mục userData của Electron.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// Lazy: chỉ tính khi app đã ready (tránh app.getPath() lúc require).
function configFile() {
    return path.join(app.getPath('userData'), 'config.json');
}

function readConfig() {
    try {
        const f = configFile();
        if (fs.existsSync(f)) {
            return JSON.parse(fs.readFileSync(f, 'utf-8'));
        }
    } catch (e) {
        console.error('Lỗi đọc config:', e);
    }
    return {};
}

function writeConfig(cfg) {
    try {
        fs.writeFileSync(configFile(), JSON.stringify(cfg, null, 2), 'utf-8');
        return true;
    } catch (e) {
        console.error('Lỗi ghi config:', e);
        return false;
    }
}

module.exports = {
    getDownloadDir() {
        return readConfig().downloadDir || app.getPath('downloads');
    },
    setDownloadDir(dir) {
        const cfg = readConfig();
        cfg.downloadDir = dir;
        return writeConfig(cfg);
    },
};
