// ==========================================
// SINKRONISASI PENGUMUMAN REAL-TIME (FIRESTORE)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Jika di halaman Admin (bisa publikasi pengumuman ke Firestore)
    const announcementForm = document.getElementById('announcementForm');
    if (announcementForm) {
        announcementForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const title = document.getElementById('annTitle').value.trim();
            const content = document.getElementById('annContent').value.trim();
            const dateStr = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

            const newAnn = {
                title: title,
                content: content,
                date: dateStr,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Kirim langsung ke koleksi Firestore "hris_announcements"
            db.collection("hris_announcements").add(newAnn)
                .then(() => {
                    alert("Pengumuman berhasil dipublikasikan secara online!");
                    announcementForm.reset();
                })
                .catch(err => {
                    console.error("Gagal mempublikasikan pengumuman:", err);
                    alert("Terjadi kesalahan jaringan saat menyimpan pengumuman.");
                });
        });
    }

    // 2. Listener Real-time untuk Admin & Karyawan (Agar otomatis sinkron)
    if (typeof db !== 'undefined') {
        db.collection("hris_announcements").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
            let cloudAnnouncements = [];
            snapshot.forEach(doc => {
                cloudAnnouncements.push({ id: doc.id, ...doc.data() });
            });

            if (cloudAnnouncements.length > 0) {
                // Timpa announcementDB global dengan data terbaru dari cloud
                window.announcementDB = cloudAnnouncements;

                // Update tampilan jika fungsinya tersedia di halaman tersebut
                if (typeof renderAdminAnnouncements === 'function') {
                    renderAdminAnnouncements();
                }
                if (typeof renderEmployeeAnnouncements === 'function') {
                    renderEmployeeAnnouncements();
                }
                if (typeof renderEmployeeNotifications === 'function') {
                    renderEmployeeNotifications();
                }
            }
        });
    }
});