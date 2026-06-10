# Tool Tải Giọng — Thư viện giọng nói

App desktop (Electron) hiển thị thư viện giọng nói có sẵn theo **tab ngôn ngữ**: nghe thử và tải file về máy. Giọng đi kèm app (offline, không cần API key).

## Cấu trúc (MVC)

```
ToolTaiGiong/
├── main.js                 # Electron main process + IPC + protocol voice://
├── preload.js              # Cầu nối an toàn View <-> main
├── Model/
│   └── Store.js            # Lưu thư mục tải (local config)
├── Controoller/
│   └── ElevenLabsApi.js    # (Tùy chọn) client ElevenLabs, không dùng ở luồng chính
├── View/
│   ├── index.html          # Giao diện + tab ngôn ngữ
│   ├── style.css
│   ├── renderer.js         # Logic UI: lưới giọng, nghe, tải
│   └── voices.json         # Manifest: danh sách giọng (sinh từ folder)
└── FolderNgonNguGiong/     # Giọng theo ngôn ngữ (Hàn, Nhật, Tây Ban Nha, voice vn)
```

## Chạy app

```bash
npm install
npm start
```

## Sử dụng

1. Mở app → chọn **tab ngôn ngữ** (Tất cả / Hàn / Nhật Bản / …).
2. **▶ Nghe**: phát thử ngay trong app.
3. **⬇ Tải**: lưu giọng về thư mục tải (đổi bằng nút **Đổi** ở góc phải).
4. **⬇ Tải tất cả đang hiện**: tải hàng loạt mọi giọng đang lọc.
5. Ô **Tìm** lọc theo tên giọng.

## Thêm giọng mới

Bỏ file audio vào `FolderNgonNguGiong/<tên ngôn ngữ>/`, rồi sinh lại manifest:

```bash
node tools/gen-manifest.js
```
