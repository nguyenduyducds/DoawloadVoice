// --- BẢN CẬP NHẬT VIP V3: FIX LỖI KHÔNG TẢI NHIỀU FILE ---
(function() {
    console.clear();
    console.log("%c🔥 HỆ THỐNG CLONE GIỌNG ĐÃ BẬT (Bản Update V3 - Sửa Lỗi Click)!", "color: cyan; font-size: 20px; font-weight: bold;");
    console.log("%c👉 Bây giờ bạn cứ thoải mái bấm Play liên tục, hệ thống sẽ bắt trọn từng giọng!", "font-size: 14px; color: yellow;");

    let fileCount = 1;
    const downloadedUrls = new Set(); 
    const originalFetch = window.fetch; 

    function downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function processAudioSrc(src) {
        if (!src || downloadedUrls.has(src)) return;
        downloadedUrls.add(src);

        if (src.startsWith('blob:')) {
            const a = document.createElement("a");
            a.href = src;
            a.download = `elevenlabs_voice_${fileCount++}.wav`;
            a.click();
            console.log(`✅ ĐÃ BẮT VÀ TẢI GIỌNG (BLOB): ${a.download}`);
        } else if (src.startsWith('http')) {
            originalFetch(src)
                .then(res => res.blob())
                .then(blob => {
                    if (blob.size > 1000) { 
                        const filename = `elevenlabs_voice_${fileCount++}.mp3`;
                        downloadBlob(blob, filename);
                        console.log(`✅ ĐÃ BẮT VÀ TẢI GIỌNG (URL): ${filename}`);
                    }
                }).catch(e => console.log('Lỗi tải file:', e));
        }
    }

    // TẤN CÔNG VÀO SỰ KIỆN PHÁT CỦA AUDIO (Bắt chính xác link đang chạy)
    const originalPlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function() {
        // Cài đặt sự kiện lắng nghe mỗi khi thẻ audio này chuẩn bị phát dữ liệu mới
        if (!this.HookedElevenLabs) {
            this.HookedElevenLabs = true;
            this.addEventListener('loadeddata', () => {
                processAudioSrc(this.src || this.currentSrc);
            });
            this.addEventListener('play', () => {
                processAudioSrc(this.src || this.currentSrc);
            });
        }
        // Chạy ngay lập tức cho lần bấm đầu
        processAudioSrc(this.src || this.currentSrc);
        return originalPlay.apply(this, arguments);
    };

    // BẮT FETCH API (Dành cho việc tải ngầm)
    window.fetch = async function(...args) {
        const response = await originalFetch.apply(this, args);
        try {
            const url = args[0] ? args[0].toString() : '';
            if (url.includes('google-analytics') || url.includes('metrics') || url.includes('events')) return response; 

            const clone = response.clone();
            const contentType = clone.headers.get('content-type') || '';

            if ((contentType.includes('audio') || url.includes('.mp3') || url.includes('/text-to-speech')) && !downloadedUrls.has(url)) {
                downloadedUrls.add(url);
                clone.blob().then(blob => {
                    if (blob.size > 1000) { 
                        const ext = contentType.includes('mpeg') ? 'mp3' : 'wav';
                        const filename = `elevenlabs_generated_${fileCount++}.${ext}`;
                        downloadBlob(blob, filename);
                        console.log(`✅ ĐÃ TẢI GIỌNG (FETCH): ${filename}`);
                    }
                }).catch(e => {});
            }
        } catch (error) {}
        return response;
    };
})();