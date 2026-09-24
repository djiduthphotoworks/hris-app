// ==========================================
// SINKRONISASI REAL-TIME ENTERPRISE (FIRESTORE)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    if (typeof db === 'undefined') return;

    // 1. SINKRONISASI PENGUMUMAN
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

            db.collection("hris_announcements").add(newAnn)
                .then(() => {
                    alert("Pengumuman berhasil dipublikasikan secara online!");
                    announcementForm.reset();
                })
                .catch(err => console.error("Gagal publikasi pengumuman:", err));
        });
    }

    db.collection("hris_announcements").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        let cloudAnnouncements = [];
        snapshot.forEach(doc => { cloudAnnouncements.push({ id: doc.id, ...doc.data() }); });
        if (cloudAnnouncements.length > 0) {
            window.announcementDB = cloudAnnouncements;
            if (typeof renderAdminAnnouncements === 'function') renderAdminAnnouncements();
            if (typeof renderEmployeeAnnouncements === 'function') renderEmployeeAnnouncements();
            if (typeof renderEmployeeNotifications === 'function') renderEmployeeNotifications();
        }
    });

    // 2. SINKRONISASI USERS & PENILAIAN KINERJA
    db.collection("hris_users").onSnapshot((snapshot) => {
        let cloudUsers = [];
        snapshot.forEach(doc => { cloudUsers.push({ id: doc.id, ...doc.data() }); });
        if (cloudUsers.length > 0) {
            window.usersDB = cloudUsers;
            localStorage.setItem('hris_users_db', JSON.stringify(cloudUsers));

            let current = JSON.parse(localStorage.getItem('hris_current_user'));
            if (current) {
                let updatedCurrent = cloudUsers.find(u => u.nip === current.nip);
                if (updatedCurrent) {
                    localStorage.setItem('hris_current_user', JSON.stringify(updatedCurrent));
                    currentUser = updatedCurrent;

                    const skorEl = document.getElementById('statSkorKinerja');
                    if (skorEl && updatedCurrent.skor !== undefined) skorEl.innerText = updatedCurrent.skor;
                    const gradeEl = document.getElementById('profileGrade');
                    if (gradeEl && updatedCurrent.grade) gradeEl.innerText = updatedCurrent.grade;
                }
            }
            if (typeof renderMasterEmployeeTable === 'function') renderMasterEmployeeTable();
        }
    });

    // 3. SINKRONISASI CUTI (LEAVES)
    db.collection("hris_leaves").onSnapshot((snapshot) => {
        let cloudLeaves = [];
        snapshot.forEach(doc => { cloudLeaves.push({ id: doc.id, ...doc.data() }); });
        if (cloudLeaves.length > 0) {
            window.leavesDB = cloudLeaves;
            localStorage.setItem('hris_leaves_db', JSON.stringify(cloudLeaves));

            if (typeof renderAdminLeaveList === 'function') renderAdminLeaveList();
            if (typeof renderAdminDashboardStats === 'function') renderAdminDashboardStats();

            let currentUser = JSON.parse(localStorage.getItem('hris_current_user'));
            if (currentUser && typeof renderEmployeeLeaves === 'function') {
                renderEmployeeLeaves(currentUser.nip);
                updateCutiStatsForEmployee(currentUser.nip);
            }
        }
    });

    // 4. SINKRONISASI KLAIM (REIMBURSE)
    db.collection("hris_reimburse").onSnapshot((snapshot) => {
        let cloudClaims = [];
        snapshot.forEach(doc => { cloudClaims.push({ id: doc.id, ...doc.data() }); });
        if (cloudClaims.length > 0) {
            window.reimburseDB = cloudClaims;
            localStorage.setItem('hris_reimburse_db', JSON.stringify(cloudClaims));

            if (typeof renderAdminReimburseList === 'function') renderAdminReimburseList();

            let currentUser = JSON.parse(localStorage.getItem('hris_current_user'));
            if (currentUser && typeof renderEmployeeReimbursements === 'function') {
                renderEmployeeReimbursements(currentUser.nip);
            }
        }
    });
});

// INTERSEPSI AKSI TOMBOL ADMIN & FORM KARYAWAN
document.addEventListener('click', function (e) {
    if (!e.target) return;

    // Simpan Penilaian Kinerja oleh Admin ke Firestore
    if (e.target.textContent && e.target.textContent.includes('Simpan Penilaian Kinerja')) {
        let selectKaryawan = document.getElementById('appraisalNip');
        if (!selectKaryawan) return;

        let nipKaryawan = selectKaryawan.value;
        let elSkorTotal = document.getElementById('skorTotal');
        let skorText = elSkorTotal ? elSkorTotal.innerText : "85";
        let nilaiAngka = parseFloat(skorText) || 85;
        let gradeText = document.getElementById('gradeHasil') ? document.getElementById('gradeHasil').innerText : "Grade A";

        db.collection("hris_users").where("nip", "==", nipKaryawan).get()
            .then((querySnapshot) => {
                querySnapshot.forEach((doc) => {
                    db.collection("hris_users").doc(doc.id).update({
                        skor: nilaiAngka,
                        grade: gradeText
                    });
                });
            });
    }
});

// Pengajuan Cuti & Klaim Online oleh Karyawan
document.addEventListener('submit', function (e) {
    if (typeof db === 'undefined') return;

    if (e.target && e.target.id === 'leaveForm') {
        e.preventDefault();
        const type = document.getElementById('leaveType').value;
        const start = document.getElementById('leaveStart').value;
        const end = document.getElementById('leaveEnd').value;
        const reason = document.getElementById('leaveReason').value.trim();
        let currentUser = JSON.parse(localStorage.getItem('hris_current_user'));
        if (!currentUser) return;

        const newLeave = {
            name: currentUser.name, nip: currentUser.nip, type, start, end, reason,
            status: "Menunggu", date: new Date().toLocaleDateString('id-ID'),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection("hris_leaves").add(newLeave).then(() => {
            alert("Permohonan cuti berhasil dikirim ke server HR!");
            e.target.reset();
            document.getElementById('leaveNama').value = currentUser.name;
        });
    }

    if (e.target && e.target.id === 'reimburseForm') {
        e.preventDefault();
        const type = document.getElementById('reimType').value;
        const amount = parseFloat(document.getElementById('reimAmount').value);
        const desc = document.getElementById('reimDesc').value.trim();
        let currentUser = JSON.parse(localStorage.getItem('hris_current_user'));
        if (!currentUser) return;

        const newClaim = {
            name: currentUser.name, nip: currentUser.nip, type, amount, desc,
            status: "Menunggu", date: new Date().toLocaleDateString('id-ID'),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection("hris_reimburse").add(newClaim).then(() => {
            alert("Klaim berhasil diajukan ke HR secara online!");
            e.target.reset();
        });
    }
});