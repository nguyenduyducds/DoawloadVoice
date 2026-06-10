// Electron main process: tạo cửa sổ, đăng ký IPC nối View <-> Controller/Model.
// Nguồn giọng: folder local "FolderNgonNguGiong" đi kèm app (đọc qua manifest View/voices.json).
const { app, BrowserWindow, ipcMain, dialog, protocol } = require('electron');
const path = require('path');
const fs = require('fs');

const Store = require('./Model/Store');

let mainWindow;

const MANIFEST = path.join(__dirname, 'View', 'voices.json');
const VOICES_ROOT = path.join(__dirname, 'FolderNgonNguGiong');

// Đăng ký scheme "voice://" để renderer phát audio an toàn (tránh chặn file://).
protocol.registerSchemesAsPrivileged([
    { scheme: 'voice', privileges: { secure: true, supportFetchAPI: true, stream: true, bypassCSP: true } },
]);

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 900,
        minHeight: 600,
        title: 'Tool Tải Giọng - Thư viện giọng nói',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'View', 'index.html'));
}

app.whenReady().then(() => {
    // voice://<relative-path-encoded> -> file trong FolderNgonNguGiong
    protocol.handle('voice', (request) => {
        try {
            const rel = decodeURIComponent(new URL(request.url).host + new URL(request.url).pathname);
            const filePath = path.normalize(path.join(VOICES_ROOT, rel));
            // Chặn path traversal: phải nằm trong VOICES_ROOT
            if (!filePath.startsWith(VOICES_ROOT)) {
                return new Response('Forbidden', { status: 403 });
            }
            const data = fs.readFileSync(filePath);
            return new Response(data, { headers: { 'Content-Type': 'audio/mpeg' } });
        } catch (e) {
            return new Response('Not found', { status: 404 });
        }
    });

    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// ---------- IPC handlers ----------

// Thư mục tải về (nơi người dùng lưu giọng họ chọn)
ipcMain.handle('config:getDownloadDir', () => Store.getDownloadDir());

ipcMain.handle('config:chooseDownloadDir', async () => {
    const res = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory', 'createDirectory'],
        defaultPath: Store.getDownloadDir(),
    });
    if (res.canceled || !res.filePaths[0]) return Store.getDownloadDir();
    Store.setDownloadDir(res.filePaths[0]);
    return res.filePaths[0];
});

// Lấy danh sách giọng từ manifest local.
ipcMain.handle('voices:getLocal', async () => {
    if (!fs.existsSync(MANIFEST)) {
        throw new Error('Không tìm thấy danh sách giọng (View/voices.json).');
    }
    const list = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));
    // Gắn URL voice:// để renderer phát được audio.
    // v.file = "FolderNgonNguGiong/<lang>/<file>"; bỏ tiền tố root cho khớp protocol handler.
    return list.map((v) => {
        const rel = v.file.replace(/^FolderNgonNguGiong\//, '');
        const encoded = rel.split('/').map(encodeURIComponent).join('/');
        return { ...v, src: 'voice://' + encoded };
    });
});

// Tải (copy) một giọng về thư mục download đã chọn.
ipcMain.handle('voices:download', async (_e, { file, name }) => {
    const srcPath = path.join(__dirname, file);
    if (!fs.existsSync(srcPath)) throw new Error('Không tìm thấy file giọng: ' + file);

    const dir = Store.getDownloadDir();
    const ext = path.extname(srcPath) || '.mp3';
    const safeName = (name || 'voice').replace(/[^\wÀ-ỹ\- ]/g, '_').trim() || 'voice';
    let destPath = path.join(dir, `${safeName}${ext}`);
    let i = 1;
    while (fs.existsSync(destPath)) {
        destPath = path.join(dir, `${safeName} (${i++})${ext}`);
    }
    fs.copyFileSync(srcPath, destPath);
    return destPath;
});

// Tải hàng loạt: copy nhiều giọng cùng lúc, trả về số lượng đã tải.
ipcMain.handle('voices:downloadMany', async (_e, items) => {
    const dir = Store.getDownloadDir();
    let ok = 0;
    for (const { file, name } of items || []) {
        try {
            const srcPath = path.join(__dirname, file);
            if (!fs.existsSync(srcPath)) continue;
            const ext = path.extname(srcPath) || '.mp3';
            const safeName = (name || 'voice').replace(/[^\wÀ-ỹ\- ]/g, '_').trim() || 'voice';
            let destPath = path.join(dir, `${safeName}${ext}`);
            let i = 1;
            while (fs.existsSync(destPath)) {
                destPath = path.join(dir, `${safeName} (${i++})${ext}`);
            }
            fs.copyFileSync(srcPath, destPath);
            ok++;
        } catch (_) {}
    }
    return { downloaded: ok, dir };
});
