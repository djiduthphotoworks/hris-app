let currentAddress = "Mendapatkan lokasi...";
let currentLatitude = null;
let currentLongitude = null;

// 1. Ambil Lokasi GPS & Alamat saat halaman dibuka
function initLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                currentLatitude = position.coords.latitude;
                currentLongitude = position.coords.longitude;

                try {
                    let response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLatitude}&lon=${currentLongitude}`);
                    let data = await response.json();
                    currentAddress = data.display_name || `${currentLatitude}, ${currentLongitude}`;
                } catch (e) {
                    currentAddress = `Lat: ${currentLatitude.toFixed(5)}, Long: ${currentLongitude.toFixed(5)}`;
                }

                const locStatus = document.getElementById('locationStatus');
                if (locStatus) {
                    locStatus.innerText = "Lokasi siap: " + currentAddress.substring(0, 45) + "...";
                    locStatus.className = "text-xs text-emerald-600 font-semibold";
                }
            },
            (error) => {
                const locStatus = document.getElementById('locationStatus');
                if (locStatus) {
                    locStatus.innerText = "GPS Gagal / Nonaktif. Menggunakan lokasi default.";
                    locStatus.className = "text-xs text-rose-600 font-semibold";
                }
                currentAddress = "Lokasi tidak terdeteksi (GPS Nonaktif)";
            },
            { enableHighAccuracy: true }
        );
    } else {
        currentAddress = "Geolocation tidak didukung browser ini";
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initLocation();
});

// 2. Fungsi saat tombol Check-in diklik -> Buka Input File Kamera
function triggerCamera() {
    const input = document.getElementById('cameraInput');
    if (input) {
        input.click();
    } else {
        alert("Elemen input kamera (cameraInput) tidak ditemukan di HTML!");
    }
}

// 3. Fungsi Memproses Foto & Simpan ke LocalStorage
function processStampedPhoto(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const img = new Image();
        img.onload = function () {
            const canvas = document.getElementById('watermarkCanvas');
            if (!canvas) {
                alert("Elemen canvas (watermarkCanvas) tidak ditemukan di HTML!");
                return;
            }
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const fontSize = Math.max(canvas.width * 0.035, 24);
            ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
            ctx.fillRect(0, canvas.height - (fontSize * 5.5), canvas.width, fontSize * 5.5);

            ctx.fillStyle = "#FFFFFF";
            ctx.font = `bold ${fontSize}px sans-serif`;

            const now = new Date();
            const timeString = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateString = now.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const dayString = now.toLocaleDateString('id-ID', { weekday: 'long' });

            let startY = canvas.height - (fontSize * 4.2);
            ctx.fillText(timeString, fontSize * 0.8, startY);

            ctx.font = `${fontSize * 0.75}px sans-serif`;
            ctx.fillText(`${dateString}  ${dayString}`, fontSize * 4.2, startY);

            ctx.font = `${fontSize * 0.6}px sans-serif`;
            let wrappedAddress = currentAddress.match(/.{1,50}/g);
            let addressY = startY + (fontSize * 1.2);

            if (wrappedAddress) {
                wrappedAddress.forEach((line, index) => {
                    ctx.fillText(line, fontSize * 0.8, addressY + (index * fontSize * 0.75));
                });
            }

            const finalPhotoData = canvas.toDataURL('image/jpeg', 0.8);

            const statusInfo = document.getElementById('absenStatusInfo');
            if (statusInfo) {
                statusInfo.innerText = "Status: Absen Berhasil! Foto & Lokasi terekam.";
            }

            let currentUser = JSON.parse(localStorage.getItem('hris_current_user')) || { name: "Karyawan Test", nip: "101" };
            const currentDateFormatted = now.toISOString().split('T')[0];

            const attendanceRecord = {
                name: currentUser.name,
                nip: currentUser.nip || "101",
                date: currentDateFormatted,
                time: timeString,
                status: "Hadir",
                photo: finalPhotoData,
                timestamp: now.getTime()
            };

            let existingRecords = JSON.parse(localStorage.getItem('hris_attendance_records')) || [];
            existingRecords.unshift(attendanceRecord);
            localStorage.setItem('hris_attendance_records', JSON.stringify(existingRecords));

            let absensiDB = JSON.parse(localStorage.getItem('hris_absensi_db')) || {};
            if (!absensiDB[currentUser.nip]) {
                absensiDB[currentUser.nip] = { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
            }
            absensiDB[currentUser.nip].hadir += 1;
            absensiDB[currentUser.nip].statusHariIni = "Check-in pukul " + timeString;
            localStorage.setItem('hris_absensi_db', JSON.stringify(absensiDB));

            window.dispatchEvent(new Event('storage'));
            alert("Absensi berhasil disimpan ke sistem!");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function doCheckOut() {
    let currentUser = JSON.parse(localStorage.getItem('hris_current_user'));
    if (!currentUser) return;
    let absensiDB = JSON.parse(localStorage.getItem('hris_absensi_db')) || {};
    if (absensiDB[currentUser.nip]) {
        absensiDB[currentUser.nip].statusHariIni = "Check-out pukul " + new Date().toLocaleTimeString('id-ID');
        localStorage.setItem('hris_absensi_db', JSON.stringify(absensiDB));
    }
    alert("Berhasil Check-out pulang!");
}