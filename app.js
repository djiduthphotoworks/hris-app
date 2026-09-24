const options = { year: 'numeric', month: 'long', day: 'numeric' };
if (document.getElementById('currentDateSlip')) {
    document.getElementById('currentDateSlip').innerText = new Date().toLocaleDateString('id-ID', options);
}
if (document.getElementById('currentDateAbsen')) {
    document.getElementById('currentDateAbsen').innerText = new Date().toLocaleDateString('id-ID', options);
}

// Live Clock for Attendance
setInterval(() => {
    const clock = document.getElementById('liveClock');
    if (clock) {
        const now = new Date();
        clock.innerText = now.toLocaleTimeString('id-ID') + " WIB";
    }
}, 1000);

// Inisialisasi Database Akun
let defaultUsers = [
    { email: "budi@perusahaan.com", nip: "101", pass: "123456", name: "Budi Santoso", role: "employee", division: "IT & Developer", foto: null, skor: 88.5, grade: "Grade A" },
    { email: "siti@perusahaan.com", nip: "102", pass: "123456", name: "Siti Aminah", role: "hr", division: "Human Resources", foto: null, skor: 95.0, grade: "Grade A" },
    { email: "adam@perusahaan.com", nip: "23", pass: "123456", name: "adam", role: "employee", division: "Teknisi", foto: null, skor: 85.0, grade: "Grade A" }
];

let usersDB = JSON.parse(localStorage.getItem('hris_users_db'));
if (!usersDB || !Array.isArray(usersDB)) {
    usersDB = defaultUsers;
    localStorage.setItem('hris_users_db', JSON.stringify(usersDB));
}

let leavesDB = JSON.parse(localStorage.getItem('hris_leaves_db')) || [
    { id: 1, name: "Budi Santoso", nip: "101", type: "Cuti Tahunan", start: "2026-01-10", end: "2026-01-12", reason: "Keperluan keluarga", status: "Disetujui" }
];

let absensiDB = JSON.parse(localStorage.getItem('hris_absensi_db')) || {
    "101": { hadir: 20, izin: 1, sakit: 0, alfa: 0, statusHariIni: "Belum Absen" },
    "102": { hadir: 21, izin: 0, sakit: 0, alfa: 0, statusHariIni: "Belum Absen" },
    "23": { hadir: 22, izin: 0, sakit: 0, alfa: 0, statusHariIni: "Belum Absen" }
};

let reimburseDB = JSON.parse(localStorage.getItem('hris_reimburse_db')) || [];
let documentsDB = JSON.parse(localStorage.getItem('hris_documents_db')) || [];
let payrollArchiveDB = JSON.parse(localStorage.getItem('hris_payroll_archive')) || [];
let announcementDB = JSON.parse(localStorage.getItem('hris_announcement_db')) || [
    { id: 1, title: "Peluncuran Sistem HRIS Pro Enterprise", content: "Seluruh fitur absensi mandiri, klaim, dan dokumen kini aktif secara online.", date: "22 September 2026" }
];

let currentUser = JSON.parse(localStorage.getItem('hris_current_user')) || null;

window.onload = function () {
    const path = window.location.pathname;

    if (currentUser) {
        let freshUser = usersDB.find(u => u.nip === currentUser.nip);
        if (freshUser) {
            currentUser = freshUser;
            localStorage.setItem('hris_current_user', JSON.stringify(currentUser));
        }

        if (document.getElementById('navUserBadge')) {
            document.getElementById('navUserBadge').innerText = `${currentUser.name} (${currentUser.role === 'hr' ? 'HR Enterprise' : 'Karyawan'})`;
        }
        if (document.getElementById('leaveNama')) {
            document.getElementById('leaveNama').value = currentUser.name;
        }

        if (document.getElementById('profileName')) {
            document.getElementById('profileName').innerText = currentUser.name;
            document.getElementById('profileDivision').innerText = currentUser.division || "Divisi Umum";
            document.getElementById('profileNip').innerText = currentUser.nip || "-";
            document.getElementById('profileEmail').innerText = currentUser.email;
            if (document.getElementById('profileGrade')) {
                document.getElementById('profileGrade').innerText = currentUser.grade || "Grade A";
            }
            if (document.getElementById('statSkorKinerja')) {
                document.getElementById('statSkorKinerja').innerText = currentUser.skor || "88.5";
            }

            // Pengecekan & Penerapan Warna Otomatis (Merah / Hijau)
            let skorAktif = parseFloat(currentUser.skor) || 85;
            let cardKinerja = document.getElementById('statSkorKinerja') ? document.getElementById('statSkorKinerja').closest('div.rounded-2xl') : null;
            let skorEl = document.getElementById('statSkorKinerja');
            let gradeEl = document.getElementById('profileGrade');
            let badgeEl = cardKinerja ? cardKinerja.querySelector('span, div.inline-flex') : null;

            if (skorAktif < 75) {
                if (cardKinerja) cardKinerja.setAttribute('style', 'background-color: #fff1f2 !important; border-color: #fecdd3 !important;');
                if (skorEl) { skorEl.innerText = skorAktif.toFixed(1); skorEl.setAttribute('style', 'color: #881337 !important;'); }
                if (gradeEl) gradeEl.setAttribute('style', 'color: #dc2626 !important; font-weight: 700 !important;');
                if (badgeEl) {
                    badgeEl.className = "px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full";
                    badgeEl.innerText = "Perlu Perbaikan";
                }
            } else {
                if (cardKinerja) cardKinerja.setAttribute('style', 'background-color: #ecfdf5 !important; border-color: #a7f3d0 !important;');
                if (skorEl) skorEl.setAttribute('style', 'color: #064e3b !important;');
                if (gradeEl) gradeEl.setAttribute('style', 'color: #047857 !important; font-weight: 700 !important;');
                if (badgeEl) {
                    badgeEl.className = "px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-700 rounded-full";
                    badgeEl.innerText = "Terverifikasi";
                }
            }

            const avatarContainer = document.getElementById('profileAvatarContainer');
            if (currentUser.foto && avatarContainer) {
                avatarContainer.innerHTML = `<img src="${currentUser.foto}" class="w-full h-full object-cover">`;
            } else if (document.getElementById('profileInitials')) {
                document.getElementById('profileInitials').innerText = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            }

            updateCutiStatsForEmployee(currentUser.nip);
            renderEmployeeLeaves(currentUser.nip);
            renderEmployeeAbsensi(currentUser.nip);
            renderEmployeeReimbursements(currentUser.nip);
            renderEmployeeDocuments(currentUser.nip);
            populateArsipSlipDropdown(currentUser.nip);
        }

        if (currentUser.role === 'hr') {
            renderAdminDashboardStats();
            renderMasterEmployeeTable();
            renderAbsensiTable();
            renderAdminLeaveList();
            renderAdminReimburseList();
            renderPayrollDropdown();
            renderRekapPayrollTable();
            renderAdminAnnouncements();
            renderAppraisalDropdown();
            renderRealtimeAttendanceTable();
        }

        renderEmployeeAnnouncements();
        renderEmployeeNotifications();

    } else if (!path.includes('index.html') && path !== '/' && path.length > 1) {
        window.location.href = 'index.html';
    }
}

window.switchAuthTab = function (type) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    if (!loginForm || !registerForm) return;

    if (type === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
};

const loginFormElement = document.getElementById('loginForm');
if (loginFormElement) {
    loginFormElement.addEventListener('submit', function (e) {
        e.preventDefault();
        const identifier = document.getElementById('loginEmail').value.trim().toLowerCase();
        const pass = document.getElementById('loginPassword').value.trim();

        const found = usersDB.find(u => (u.email.toLowerCase() === identifier || u.nip === identifier) && u.pass === pass);
        if (found) {
            localStorage.setItem('hris_current_user', JSON.stringify(found));
            window.location.href = found.role === 'hr' ? 'dashboard-admin.html' : 'dashboard-karyawan.html';
        } else {
            alert("Email/NIP atau kata sandi salah!");
        }
    });
}

const registerFormElement = document.getElementById('registerForm');
if (registerFormElement) {
    registerFormElement.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const nip = document.getElementById('regNip').value.trim();
        const role = document.getElementById('regRole').value;
        const division = document.getElementById('regDivisi').value.trim();
        const pass = document.getElementById('regPassword').value.trim();
        const fotoInput = document.getElementById('regFoto');

        // Pastikan usersDB selalu diperbarui dari localStorage terbaru agar tidak nyangkut
        let currentUsersDB = JSON.parse(localStorage.getItem('hris_users_db')) || [];

        // Validasi duplikasi yang lebih aman
        if (currentUsersDB.some(u => u.email.toLowerCase() === email || u.nip === nip)) {
            alert("Email atau NIP sudah terdaftar di sistem! Gunakan data lain atau silakan Login.");
            return;
        }

        const saveUser = (fotoBase64) => {
            const newUser = { email, nip, pass, name, role, division, foto: fotoBase64, skor: 85.0, grade: "Grade A" };
            currentUsersDB.push(newUser);
            localStorage.setItem('hris_users_db', JSON.stringify(currentUsersDB));

            let absensiDB = JSON.parse(localStorage.getItem('hris_absensi_db')) || {};
            absensiDB[nip] = { hadir: 0, izin: 0, sakit: 0, alfa: 0, statusHariIni: "Belum Absen" };
            localStorage.setItem('hris_absensi_db', JSON.stringify(absensiDB));

            localStorage.setItem('hris_current_user', JSON.stringify(newUser));
            window.location.href = role === 'hr' ? 'dashboard-admin.html' : 'dashboard-karyawan.html';
        };

        if (fotoInput && fotoInput.files && fotoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = e => saveUser(e.target.result);
            reader.onerror = () => saveUser(null);
            reader.readAsDataURL(fotoInput.files[0]);
        } else {
            saveUser(null);
        }
    });
}

window.logout = function () {
    localStorage.removeItem('hris_current_user');
    window.location.href = 'index.html';
};

window.switchAdminTab = function (target) {
    const modules = ['modulAudit', 'modulMaster', 'modulAbsensi', 'modulLeaveAdmin', 'modulReimburseAdmin', 'modulPayroll', 'modulAnnouncement'];
    modules.forEach(m => {
        const el = document.getElementById(m);
        if (el) el.classList.add('hidden');
    });

    const activeMap = {
        'audit': 'modulAudit', 'master': 'modulMaster', 'absensi': 'modulAbsensi',
        'leave': 'modulLeaveAdmin', 'reimburse': 'modulReimburseAdmin', 'payroll': 'modulPayroll', 'announcement': 'modulAnnouncement'
    };

    if (activeMap[target]) {
        document.getElementById(activeMap[target]).classList.remove('hidden');
    }
};

window.switchKaryawanTab = function (target) {
    const secs = ['sectionProfil', 'sectionAbsen', 'sectionCuti', 'sectionReimburse', 'sectionDokumen', 'sectionGaji'];
    secs.forEach(s => {
        const el = document.getElementById(s);
        if (el) el.classList.add('hidden');
    });

    const activeMap = {
        'profil': 'sectionProfil', 'absen': 'sectionAbsen', 'cuti': 'sectionCuti',
        'reimburse': 'sectionReimburse', 'dokumen': 'sectionDokumen', 'gaji': 'sectionGaji'
    };

    if (activeMap[target]) {
        document.getElementById(activeMap[target]).classList.remove('hidden');
    }
};

function renderEmployeeAbsensi(nip) {
    const abs = absensiDB[nip] || { hadir: 0, izin: 0, sakit: 0, alfa: 0, statusHariIni: "Belum Absen" };
    if (document.getElementById('statHadir')) {
        document.getElementById('statHadir').innerText = abs.hadir;
        document.getElementById('statIzin').innerText = abs.izin;
        document.getElementById('statSakit').innerText = abs.sakit;
        document.getElementById('statAlfa').innerText = abs.alfa;
    }
    if (document.getElementById('absenStatusInfo')) {
        document.getElementById('absenStatusInfo').innerText = "Status hari ini: " + abs.statusHariIni;
    }
}

const leaveForm = document.getElementById('leaveForm');
if (leaveForm) {
    leaveForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const type = document.getElementById('leaveType').value;
        const start = document.getElementById('leaveStart').value;
        const end = document.getElementById('leaveEnd').value;
        const reason = document.getElementById('leaveReason').value.trim();

        leavesDB.push({ id: Date.now(), name: currentUser.name, nip: currentUser.nip, type, start, end, reason, status: "Menunggu", date: new Date().toLocaleDateString('id-ID') });
        localStorage.setItem('hris_leaves_db', JSON.stringify(leavesDB));
        alert("Permohonan cuti dikirim!");
        leaveForm.reset();
        document.getElementById('leaveNama').value = currentUser.name;
        renderEmployeeLeaves(currentUser.nip);
        renderEmployeeNotifications();
    });
}

function renderEmployeeLeaves(nip) {
    const container = document.getElementById('employeeLeaveList');
    if (!container) return;
    const userLeaves = leavesDB.filter(l => l.nip === nip);
    if (userLeaves.length === 0) { container.innerHTML = `<p class="text-xs text-slate-400">Belum ada cuti.</p>`; return; }
    container.innerHTML = userLeaves.map(l => `
        <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
            <div><span class="font-bold">${l.type}</span> (${l.start} s/d ${l.end})<p class="text-slate-500">${l.reason}</p></div>
            <span class="px-2 py-1 rounded bg-indigo-100 text-indigo-900 font-bold">${l.status}</span>
        </div>
    `).join('');
}

function updateCutiStatsForEmployee(nip) {
    const userLeaves = leavesDB.filter(l => l.nip === nip && l.status === "Disetujui");
    let terpakai = userLeaves.length * 2;
    let sisa = Math.max(0, 12 - terpakai);
    if (document.getElementById('sisaCutiAngka')) {
        document.getElementById('sisaCutiAngka').innerText = sisa;
        document.getElementById('terpakaiCutiInfo').innerText = `Terpakai: ${terpakai} hari`;
    }
}

const reimburseForm = document.getElementById('reimburseForm');
if (reimburseForm) {
    reimburseForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const type = document.getElementById('reimType').value;
        const amount = parseFloat(document.getElementById('reimAmount').value);
        const desc = document.getElementById('reimDesc').value.trim();

        reimburseDB.push({ id: Date.now(), name: currentUser.name, nip: currentUser.nip, type, amount, desc, status: "Menunggu", date: new Date().toLocaleDateString('id-ID') });
        localStorage.setItem('hris_reimburse_db', JSON.stringify(reimburseDB));
        alert("Klaim berhasil diajukan ke HR!");
        reimburseForm.reset();
        renderEmployeeReimbursements(currentUser.nip);
        renderEmployeeNotifications();
    });
}

function renderEmployeeReimbursements(nip) {
    const container = document.getElementById('employeeReimburseList');
    if (!container) return;
    const items = reimburseDB.filter(r => r.nip === nip);
    if (items.length === 0) { container.innerHTML = `<p class="text-xs text-slate-400">Belum ada klaim.</p>`; return; }
    container.innerHTML = items.map(r => `
        <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
            <div><span class="font-bold">${r.type}</span> - Rp ${r.amount.toLocaleString('id-ID')}<p class="text-slate-500">${r.desc}</p></div>
            <span class="px-2 py-1 rounded bg-amber-100 text-amber-900 font-bold">${r.status}</span>
        </div>
    `).join('');
}

const docUploadForm = document.getElementById('docUploadForm');
if (docUploadForm) {
    docUploadForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const docName = document.getElementById('docName').value.trim();
        documentsDB.push({ id: Date.now(), nip: currentUser.nip, docName, date: new Date().toLocaleDateString('id-ID') });
        localStorage.setItem('hris_documents_db', JSON.stringify(documentsDB));
        alert("Dokumen berhasil diunggah ke Locker!");
        docUploadForm.reset();
        renderEmployeeDocuments(currentUser.nip);
    });
}

function renderEmployeeDocuments(nip) {
    const container = document.getElementById('employeeDocList');
    if (!container) return;
    const docs = documentsDB.filter(d => d.nip === nip);
    if (docs.length === 0) { container.innerHTML = `<p class="text-xs text-slate-400">Belum ada dokumen.</p>`; return; }
    container.innerHTML = docs.map(d => `
        <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
            <div><span class="font-bold text-slate-900">${d.docName}</span><p class="text-[10px] text-slate-400">Diunggah: ${d.date}</p></div>
            <button onclick="deleteDoc(${d.id})" class="text-rose-600 font-semibold">Hapus</button>
        </div>
    `).join('');
}

window.deleteDoc = function (id) {
    documentsDB = documentsDB.filter(d => d.id !== id);
    localStorage.setItem('hris_documents_db', JSON.stringify(documentsDB));
    renderEmployeeDocuments(currentUser.nip);
};

// ---------------- ADMIN LOGIC ----------------
function renderAdminDashboardStats() {
    if (document.getElementById('statTotalPegawai')) {
        document.getElementById('statTotalPegawai').innerText = usersDB.filter(u => u.role !== 'hr').length + " Staff";
    }
    if (document.getElementById('statPendingCuti')) {
        document.getElementById('statPendingCuti').innerText = leavesDB.filter(l => l.status === "Menunggu").length + " Permohonan";
    }
}

function renderMasterEmployeeTable() {
    const tbody = document.getElementById('masterEmployeeTableBody');
    if (!tbody) return;
    tbody.innerHTML = usersDB.map(u => {
        const countDoc = documentsDB.filter(d => d.nip === u.nip).length;
        return `
            <tr>
                <td class="p-3"><strong class="text-slate-900 block">${u.name}</strong><span class="text-[11px] text-slate-400">${u.email}</span></td>
                <td class="p-3">${u.nip}</td>
                <td class="p-3">${u.division || '-'}</td>
                <td class="p-3"><span class="px-2 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold">${countDoc} Berkas</span></td>
                <td class="p-3 text-center"><button onclick="deleteEmployee('${u.email}')" class="text-rose-600 font-semibold">Hapus</button></td>
            </tr>
        `;
    }).join('');
}

window.openAddEmployeeModal = function () { document.getElementById('addEmployeeModal').classList.remove('hidden'); };
window.closeAddEmployeeModal = function () { document.getElementById('addEmployeeModal').classList.add('hidden'); };

const addEmployeeForm = document.getElementById('addEmployeeForm');
if (addEmployeeForm) {
    addEmployeeForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const name = document.getElementById('modalName').value.trim();
        const email = document.getElementById('modalEmail').value.trim().toLowerCase();
        const nip = document.getElementById('modalNip').value.trim();
        const division = document.getElementById('modalDivision').value.trim();
        const pass = document.getElementById('modalPass').value.trim();

        usersDB.push({ name, email, nip, division, pass, role: 'employee', foto: null, skor: 85.0, grade: "Grade A" });
        localStorage.setItem('hris_users_db', JSON.stringify(usersDB));
        absensiDB[nip] = { hadir: 20, izin: 0, sakit: 0, alfa: 0, statusHariIni: "Belum Absen" };
        localStorage.setItem('hris_absensi_db', JSON.stringify(absensiDB));

        alert("Karyawan berhasil ditambah!");
        closeAddEmployeeModal();
        renderMasterEmployeeTable();
        renderAdminDashboardStats();
        renderAppraisalDropdown();
        renderPayrollDropdown();
    });
}

window.deleteEmployee = function (email) {
    usersDB = usersDB.filter(u => u.email !== email);
    localStorage.setItem('hris_users_db', JSON.stringify(usersDB));
    renderMasterEmployeeTable();
    renderAppraisalDropdown();
    renderPayrollDropdown();
};

function renderAbsensiTable() {
    const tbody = document.getElementById('absensiTableBody');
    if (!tbody) return;
    const employees = usersDB.filter(u => u.role !== 'hr');
    tbody.innerHTML = employees.map(e => {
        const abs = absensiDB[e.nip] || { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
        return `
            <tr>
                <td class="p-3 font-bold">${e.name} (${e.nip})</td>
                <td class="p-3 text-center"><input type="number" id="hadir_${e.nip}" value="${abs.hadir}" class="w-16 p-1 text-center border rounded"></td>
                <td class="p-3 text-center"><input type="number" id="izin_${e.nip}" value="${abs.izin}" class="w-16 p-1 text-center border rounded"></td>
                <td class="p-3 text-center"><input type="number" id="sakit_${e.nip}" value="${abs.sakit}" class="w-16 p-1 text-center border rounded"></td>
                <td class="p-3 text-center"><input type="number" id="alfa_${e.nip}" value="${abs.alfa}" class="w-16 p-1 text-center border rounded text-rose-600 font-bold"></td>
                <td class="p-3 text-center"><button onclick="updateAbsensi('${e.nip}')" class="bg-indigo-600 text-white px-3 py-1 rounded text-[11px]">Simpan</button></td>
            </tr>
        `;
    }).join('');
}

window.updateAbsensi = function (nip) {
    absensiDB[nip] = {
        hadir: parseInt(document.getElementById(`hadir_${nip}`).value) || 0,
        izin: parseInt(document.getElementById(`izin_${nip}`).value) || 0,
        sakit: parseInt(document.getElementById(`sakit_${nip}`).value) || 0,
        alfa: parseInt(document.getElementById(`alfa_${nip}`).value) || 0,
        statusHariIni: "Diperbarui HR"
    };
    localStorage.setItem('hris_absensi_db', JSON.stringify(absensiDB));
    alert("Absensi disimpan!");
};

window.exportAbsensiCSV = function () {
    let csv = "NIP,Nama,Hadir,Izin,Sakit,Alfa\n";
    usersDB.filter(u => u.role !== 'hr').forEach(u => {
        const a = absensiDB[u.nip] || { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
        csv += `${u.nip},"${u.name}",${a.hadir},${a.izin},${a.sakit},${a.alfa}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rekap_absensi.csv'; a.click();
};

function renderAdminLeaveList() {
    const container = document.getElementById('adminLeaveList');
    if (!container) return;
    if (leavesDB.length === 0) { container.innerHTML = `<p class="text-xs text-slate-400">Tidak ada cuti.</p>`; return; }
    container.innerHTML = leavesDB.map(l => `
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
            <div><strong class="text-slate-900">${l.name}</strong> - ${l.type} (${l.start} s/d ${l.end})<p class="text-slate-500">Alasan: ${l.reason}</p></div>
            <div class="flex items-center gap-2">
                <span class="font-bold px-2 py-1 rounded bg-indigo-100 text-indigo-900">${l.status}</span>
                ${l.status === "Menunggu" ? `<button onclick="updateLeaveStatus(${l.id}, 'Disetujui')" class="bg-emerald-600 text-white px-2 py-1 rounded">Setujui</button>` : ''}
            </div>
        </div>
    `).join('');
}

window.updateLeaveStatus = function (id, status) {
    leavesDB = leavesDB.map(l => l.id === id ? { ...l, status } : l);
    localStorage.setItem('hris_leaves_db', JSON.stringify(leavesDB));
    renderAdminLeaveList();
    renderAdminDashboardStats();
};

function renderAdminReimburseList() {
    const container = document.getElementById('adminReimburseList');
    if (!container) return;
    if (reimburseDB.length === 0) { container.innerHTML = `<p class="text-xs text-slate-400">Tidak ada klaim.</p>`; return; }
    container.innerHTML = reimburseDB.map(r => `
        <div class="p-4 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
            <div><strong class="text-slate-900">${r.name}</strong> - ${r.type} (Rp ${r.amount.toLocaleString('id-ID')})<p class="text-slate-500">${r.desc}</p></div>
            <div class="flex items-center gap-2">
                <span class="font-bold px-2 py-1 rounded bg-amber-100 text-amber-900">${r.status}</span>
                ${r.status === "Menunggu" ? `<button onclick="updateReimStatus(${r.id}, 'Disetujui')" class="bg-emerald-600 text-white px-2 py-1 rounded">Cairkan</button>` : ''}
            </div>
        </div>
    `).join('');
}

window.updateReimStatus = function (id, status) {
    reimburseDB = reimburseDB.map(r => r.id === id ? { ...r, status } : r);
    localStorage.setItem('hris_reimburse_db', JSON.stringify(reimburseDB));
    renderAdminReimburseList();
};

function renderAppraisalDropdown() {
    const select = document.getElementById('appraisalNip');
    if (!select) return;
    select.innerHTML = usersDB.filter(u => u.role !== 'hr').map(e => `<option value="${e.nip}">${e.name} (${e.nip})</option>`).join('');
}

function renderPayrollDropdown() {
    const select = document.getElementById('payNamaSelect');
    if (!select) return;
    select.innerHTML = usersDB.filter(u => u.role !== 'hr').map(e => `<option value="${e.nip}|${e.name}">${e.name} (${e.nip})</option>`).join('');
}

const payrollForm = document.getElementById('payrollForm');
if (payrollForm) {
    payrollForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const selectedVal = document.getElementById('payNamaSelect').value.split('|');
        const nip = selectedVal[0];
        const nama = selectedVal[1];
        const periode = document.getElementById('payPeriode').value;
        const gajiPokok = parseFloat(document.getElementById('gajiPokok').value);
        const uangLembur = parseFloat(document.getElementById('lemburJam').value) * parseFloat(document.getElementById('tarifLembur').value);
        const bruto = gajiPokok + uangLembur;
        const bpjs = gajiPokok * 0.03;
        const pph21 = bruto > 5000000 ? (bruto - 5000000) * 0.05 : 0;
        const total = bruto - bpjs - pph21;

        payrollArchiveDB.push({ id: Date.now(), nip, nama, periode, gajiPokok, uangLembur, bpjs: Math.round(bpjs), pph21: Math.round(pph21), total: Math.round(total) });
        localStorage.setItem('hris_payroll_archive', JSON.stringify(payrollArchiveDB));

        document.getElementById('slipPeriodeLabel').innerText = `Periode: ${periode}`;
        document.getElementById('slipNama').innerText = `${nama} (NIP: ${nip})`;
        document.getElementById('resPayPokok').innerText = "Rp " + gajiPokok.toLocaleString('id-ID');
        document.getElementById('resUangLembur').innerText = "Rp " + uangLembur.toLocaleString('id-ID');
        document.getElementById('resBpjs').innerText = "- Rp " + Math.round(bpjs).toLocaleString('id-ID');
        document.getElementById('resPph21').innerText = "- Rp " + Math.round(pph21).toLocaleString('id-ID');
        document.getElementById('resTotalGaji').innerText = Math.round(total).toLocaleString('id-ID');
        document.getElementById('signAdminKaryawanName').innerText = nama;
        document.getElementById('printableSlip').classList.remove('hidden');
        renderRekapPayrollTable();
        alert("Slip gaji diterbitkan!");
    });
}

function renderRekapPayrollTable() {
    const tbody = document.getElementById('rekapPayrollTableBody');
    if (!tbody) return;
    if (payrollArchiveDB.length === 0) { tbody.innerHTML = `<tr><td colspan="6" class="p-3 text-center text-slate-400">Belum ada rekap.</td></tr>`; return; }
    tbody.innerHTML = payrollArchiveDB.map(p => `
        <tr>
            <td class="p-2.5 font-bold">${p.periode}</td>
            <td class="p-2.5">${p.nama}</td>
            <td class="p-2.5">Rp ${p.gajiPokok.toLocaleString('id-ID')}</td>
            <td class="p-2.5">Rp ${p.uangLembur.toLocaleString('id-ID')}</td>
            <td class="p-2.5 text-rose-600">- Rp ${(p.bpjs + p.pph21).toLocaleString('id-ID')}</td>
            <td class="p-2.5 font-bold text-emerald-700">Rp ${p.total.toLocaleString('id-ID')}</td>
        </tr>
    `).join('');
}

window.exportPayrollCSV = function () {
    let csv = "Periode,NIP,Nama,Gaji Pokok,Lembur,Potongan,Take Home Pay\n";
    payrollArchiveDB.forEach(p => {
        csv += `${p.periode},${p.nip},"${p.nama}",${p.gajiPokok},${p.uangLembur},${p.bpjs + p.pph21},${p.total}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rekap_payroll.csv'; a.click();
};

const announcementForm = document.getElementById('announcementForm');
if (announcementForm) {
    announcementForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const title = document.getElementById('annTitle').value.trim();
        const content = document.getElementById('annContent').value.trim();
        announcementDB.push({ id: Date.now(), title, content, date: new Date().toLocaleDateString('id-ID') });
        localStorage.setItem('hris_announcement_db', JSON.stringify(announcementDB));
        alert("Pengumuman dipublikasikan!");
        announcementForm.reset();
        renderAdminAnnouncements();
        renderEmployeeAnnouncements();
        renderEmployeeNotifications();
    });
}

function renderAdminAnnouncements() {
    const container = document.getElementById('adminAnnouncementList');
    if (!container) return;
    container.innerHTML = announcementDB.map(a => `
        <div class="p-3 rounded-xl border border-slate-200 bg-slate-50 flex justify-between items-center text-xs">
            <div><strong class="text-slate-900">${a.title}</strong><p class="text-slate-600">${a.content}</p></div>
            <button onclick="deleteAnn(${a.id})" class="text-rose-600 font-semibold">Hapus</button>
        </div>
    `).join('');
}

window.deleteAnn = function (id) {
    announcementDB = announcementDB.filter(a => a.id !== id);
    localStorage.setItem('hris_announcement_db', JSON.stringify(announcementDB));
    renderAdminAnnouncements();
    renderEmployeeAnnouncements();
};

function populateArsipSlipDropdown(nip) {
    const select = document.getElementById('selectArsipSlip');
    if (!select) return;
    const userSlips = payrollArchiveDB.filter(s => s.nip === nip);
    if (userSlips.length === 0) { select.innerHTML = `<option>Tidak ada arsip</option>`; return; }
    select.innerHTML = userSlips.map(s => `<option value="${s.id}">${s.periode} - (THP: Rp ${s.total.toLocaleString('id-ID')})</option>`).join('');
    renderEmployeeSlip(userSlips[0].id);
}

window.renderEmployeeSlip = function (id) {
    const slip = payrollArchiveDB.find(s => s.id == id);
    if (!slip) return;
    document.getElementById('slipPeriodeLabel').innerText = `Periode: ${slip.periode}`;
    document.getElementById('slipNama').innerText = `${slip.nama} (NIP: ${slip.nip})`;
    document.getElementById('slipPokok').innerText = "Rp " + slip.gajiPokok.toLocaleString('id-ID');
    document.getElementById('slipLembur').innerText = "Rp " + slip.uangLembur.toLocaleString('id-ID');
    document.getElementById('slipBpjs').innerText = "- Rp " + slip.bpjs.toLocaleString('id-ID');
    document.getElementById('slipPph21').innerText = "- Rp " + slip.pph21.toLocaleString('id-ID');
    document.getElementById('slipTotal').innerText = "Rp " + slip.total.toLocaleString('id-ID');

    if (document.getElementById('signKaryawanName')) {
        document.getElementById('signKaryawanName').innerText = slip.nama;
    }
};

function renderRealtimeAttendanceTable() {
    const tableBody = document.getElementById('realtimePhotoAttendanceContainer');
    if (!tableBody) return;

    let records = JSON.parse(localStorage.getItem('hris_attendance_records')) || [];

    if (records.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-slate-400">Belum ada data absensi berfoto yang masuk.</td></tr>`;
        return;
    }

    tableBody.innerHTML = records.map((rec) => `
        <tr style="border-bottom: 1px solid #f3f4f6;">
            <td style="padding: 12px;">
                <div style="font-weight: 600; color: #1f2937;">${rec.name}</div>
                <div style="font-size: 11px; color: #6b7280;">NIP: ${rec.nip}</div>
            </td>
            <td style="padding: 12px; color: #4b5563;">${rec.date}</td>
            <td style="padding: 12px; color: #4b5563; font-weight: 500;">${rec.time}</td>
            <td style="padding: 12px;">
                <span style="background: #d1fae5; color: #065f46; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;">${rec.status}</span>
            </td>
            <td style="padding: 12px;">
                <img src="${rec.photo}" alt="Bukti Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; border: 1px solid #d1d5db; cursor: pointer;" onclick="previewImage('${rec.photo}')" title="Klik untuk memperbesar foto" />
            </td>
        </tr>
    `).join('');
}

window.previewImage = function (base64Data) {
    let win = window.open();
    win.document.write(`
        <html>
            <head><title>Bukti Foto Absensi</title></head>
            <body style="margin:0; background:#0f172a; display:flex; justify-content:center; align-items:center; height:100vh;">
                <img src="${base64Data}" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:8px; box-shadow: 0 4px 20px rgba(0,0,0,0.5);" />
            </body>
        </html>
    `);
};

// Penilaian Kinerja
window.hitungSkor = function () {
    let absensi = parseFloat(document.getElementById('nilaiAbsensi').value) || 0;
    let kualitas = parseFloat(document.getElementById('nilaiKualitas').value) || 0;
    let sikap = parseFloat(document.getElementById('nilaiSikap').value) || 0;

    let total = (absensi * 0.30) + (kualitas * 0.50) + (sikap * 0.20);

    document.getElementById('skorTotal').innerText = total.toFixed(1) + ' / 100';

    let gradeEl = document.getElementById('gradeHasil');
    if (gradeEl) {
        if (total >= 85) {
            gradeEl.className = "text-sm font-bold text-emerald-700";
            gradeEl.innerText = "Grade A (Sangat Memuaskan)";
        } else if (total >= 75) {
            gradeEl.className = "text-sm font-bold text-blue-700";
            gradeEl.innerText = "Grade B (Baik)";
        } else if (total >= 60) {
            gradeEl.className = "text-sm font-bold text-amber-600";
            gradeEl.innerText = "Grade C (Cukup / Perlu Perbaikan)";
        } else {
            gradeEl.className = "text-sm font-bold text-rose-600";
            gradeEl.innerText = "Grade D (Kurang / Raport Merah)";
        }
    }
};

window.simpanPenilaianDetail = function () {
    let selectKaryawan = document.getElementById('appraisalNip');
    let nipKaryawan = selectKaryawan ? selectKaryawan.value : "23";
    let namaKaryawan = selectKaryawan ? selectKaryawan.options[selectKaryawan.selectedIndex].text : "adam";

    let elSkorTotal = document.getElementById('skorTotal');
    let skorText = elSkorTotal ? elSkorTotal.innerText : "85";
    let nilaiAngka = parseFloat(skorText) || 85;
    let gradeText = document.getElementById('gradeHasil') ? document.getElementById('gradeHasil').innerText : "Grade A";

    usersDB = usersDB.map(u => {
        if (u.nip === nipKaryawan) {
            return { ...u, skor: nilaiAngka, grade: gradeText };
        }
        return u;
    });
    localStorage.setItem('hris_users_db', JSON.stringify(usersDB));

    if (currentUser && currentUser.nip === nipKaryawan) {
        currentUser.skor = nilaiAngka;
        currentUser.grade = gradeText;
        localStorage.setItem('hris_current_user', JSON.stringify(currentUser));
    }

    if (nilaiAngka < 75) {
        let txtNamaMerah = document.getElementById('txtNamaKaryawanMerah');
        if (txtNamaMerah) txtNamaMerah.innerText = namaKaryawan;
        let txtSkorMerah = document.getElementById('txtSkorMerah');
        if (txtSkorMerah) txtSkorMerah.innerText = skorText;

        let modalPeringatan = document.getElementById('modalPeringatan');
        if (modalPeringatan) modalPeringatan.classList.remove('hidden');
    } else {
        alert("Data penilaian kinerja untuk " + namaKaryawan + " berhasil disimpan dan disinkronkan!");
    }
    renderEmployeeNotifications();
};

window.tutupModalPeringatan = function () {
    let modalPeringatan = document.getElementById('modalPeringatan');
    if (modalPeringatan) modalPeringatan.classList.add('hidden');
    alert("Data tersimpan dan notifikasi peringatan otomatis telah dikirim ke karyawan!");
};

// ==========================================
// NOTIFIKASI LONCENG & PENGUMUMAN INTERAKTIF
// ==========================================
const notifBtn = document.getElementById('notifBtn');
const notifDropdown = document.getElementById('notifDropdown');

if (notifBtn && notifDropdown) {
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifDropdown.classList.toggle('hidden');
        renderEmployeeNotifications();
    });

    window.addEventListener('click', () => {
        notifDropdown.classList.add('hidden');
    });

    notifDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

function renderEmployeeNotifications() {
    const notifList = document.getElementById('notifList');
    const notifBadge = document.getElementById('notificationBadge') || document.getElementById('notifBadge');
    if (!notifList || typeof currentUser === 'undefined' || !currentUser) return;

    const nip = currentUser.nip;
    const storageKeyRead = `hris_read_notifications_${nip}`;
    let readNotifs = JSON.parse(localStorage.getItem(storageKeyRead)) || [];

    let rawNotifications = [];

    if (typeof announcementDB !== 'undefined' && announcementDB.length > 0) {
        announcementDB.forEach(a => {
            rawNotifications.push({
                id: `ann_${a.id || a.title}`,
                title: `Pengumuman: ${a.title}`,
                desc: a.content,
                time: a.date || "Pengumuman"
            });
        });
    }

    if (typeof leavesDB !== 'undefined') {
        const myLeaves = leavesDB.filter(l => l.nip === currentUser.nip);
        myLeaves.forEach((l, index) => {
            rawNotifications.push({
                id: `leave_${l.id || index}`,
                title: `Status Cuti: ${l.status}`,
                desc: `Pengajuan cuti (${l.type}) ${l.start} s/d ${l.end}: ${l.status}`,
                time: l.date || "Cuti"
            });
        });
    }

    const activeClaimsDB = typeof reimburseDB !== 'undefined' ? reimburseDB : [];
    if (activeClaimsDB.length > 0) {
        const myClaims = activeClaimsDB.filter(c => c.nip === currentUser.nip);
        myClaims.forEach((c, index) => {
            rawNotifications.push({
                id: `claim_${c.id || index}`,
                title: `Status Klaim: ${c.status}`,
                desc: `Pengajuan "${c.type}" senilai Rp ${Number(c.amount).toLocaleString('id-ID')} berstatus: ${c.status}`,
                time: c.date || "Klaim"
            });
        });
    }

    if (rawNotifications.length === 0) {
        notifList.innerHTML = `<div class="p-4 text-xs text-slate-500 text-center">Belum ada notifikasi</div>`;
        if (notifBadge) notifBadge.classList.add('hidden');
        return;
    }

    rawNotifications.reverse();
    const unreadNotifs = rawNotifications.filter(n => !readNotifs.includes(n.id));

    let htmlContent = `
        <div class="p-2 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <span class="text-[10px] text-slate-400 font-medium">Kotak Masuk (${unreadNotifs.length} Belum Dibaca)</span>
            <button onclick="markAllNotificationsAsRead()" class="text-[10px] text-indigo-600 hover:underline font-semibold">Tandai Semua Dibaca</button>
        </div>
    `;

    htmlContent += rawNotifications.map(n => {
        const isRead = readNotifs.includes(n.id);
        const bgClass = isRead ? 'bg-white opacity-75' : 'bg-indigo-50/40 border-l-2 border-indigo-500';
        const safeId = String(n.id).replace(/'/g, "\\'");

        return `
            <div class="p-3 hover:bg-slate-50 transition border-b border-slate-100 last:border-none ${bgClass}">
                <div class="flex justify-between items-start gap-2">
                    <p class="text-xs font-bold text-slate-800">${n.title}</p>
                    <span class="text-[9px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded shrink-0">${n.time}</span>
                </div>
                <p class="text-xs text-slate-600 mt-1 leading-relaxed">${n.desc}</p>
                ${!isRead ? `<div class="mt-2 text-right"><button onclick="markSingleNotificationAsRead('${safeId}')" class="text-[10px] text-indigo-600 hover:underline font-medium">Tandai Dibaca</button></div>` : ''}
            </div>
        `;
    }).join('');

    notifList.innerHTML = htmlContent;

    if (notifBadge) {
        if (unreadNotifs.length > 0) {
            notifBadge.innerText = unreadNotifs.length;
            notifBadge.classList.remove('hidden');
        } else {
            notifBadge.classList.add('hidden');
        }
    }
}

window.markSingleNotificationAsRead = function (id) {
    const nip = currentUser ? currentUser.nip : 'default_user';
    const storageKeyRead = `hris_read_notifications_${nip}`;
    let readNotifs = JSON.parse(localStorage.getItem(storageKeyRead)) || [];

    if (!readNotifs.includes(id)) {
        readNotifs.push(id);
        localStorage.setItem(storageKeyRead, JSON.stringify(readNotifs));
    }
    renderEmployeeNotifications();
};

window.markAllNotificationsAsRead = function () {
    const nip = currentUser ? currentUser.nip : 'default_user';
    const storageKeyRead = `hris_read_notifications_${nip}`;

    let allIds = [];
    if (typeof announcementDB !== 'undefined') announcementDB.forEach(a => allIds.push(`ann_${a.id || a.title}`));
    if (typeof leavesDB !== 'undefined') leavesDB.filter(l => l.nip === nip).forEach((l, i) => allIds.push(`leave_${l.id || i}`));
    if (typeof reimburseDB !== 'undefined') reimburseDB.filter(c => c.nip === nip).forEach((c, i) => allIds.push(`claim_${c.id || i}`));

    localStorage.setItem(storageKeyRead, JSON.stringify(allIds));
    renderEmployeeNotifications();
};

// Render Arsip Pengumuman
function renderEmployeeAnnouncements() {
    const container = document.getElementById('employeeAnnouncementContainer') || document.getElementById('announcementsContainer');
    if (!container || typeof announcementDB === 'undefined') return;

    const currentUserNip = (currentUser && currentUser.nip) ? currentUser.nip : 'default_user';
    const storageKey = `hris_read_announcements_${currentUserNip}`;
    let readAnnouncements = JSON.parse(localStorage.getItem(storageKey)) || [];

    let activeAnnouncementsHtml = '';
    let hiddenCount = 0;

    announcementDB.forEach((a) => {
        const uniqueId = String(a.id || a.title);

        if (readAnnouncements.includes(uniqueId)) {
            hiddenCount++;
        } else {
            const safeId = uniqueId.replace(/'/g, "\\'");
            activeAnnouncementsHtml += `
                <div class="p-4 mb-3 bg-indigo-50/50 border border-indigo-100 rounded-xl flex justify-between items-start gap-3 transition hover:shadow-sm">
                    <div class="flex gap-3">
                        <div class="text-indigo-600 mt-0.5 shrink-0">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"/></svg>
                        </div>
                        <div>
                            <h4 class="text-xs font-bold text-slate-800">${a.title}</h4>
                            <p class="text-xs text-slate-600 mt-1 leading-relaxed">${a.content}</p>
                            <span class="inline-block mt-2 text-[9px] text-slate-400 font-medium">${a.date || 'Informasi'}</span>
                        </div>
                    </div>
                    <button onclick="markAnnouncementAsRead('${safeId}')" class="text-[10px] bg-white border border-indigo-200 text-indigo-600 px-2.5 py-1 rounded-lg hover:bg-indigo-600 hover:text-white transition shrink-0 font-medium shadow-sm">
                        Tandai Dibaca
                    </button>
                </div>
            `;
        }
    });

    if (activeAnnouncementsHtml === '') {
        container.innerHTML = `
            <div class="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 text-xs">
                Tidak ada pengumuman aktif saat ini. 
                ${hiddenCount > 0 ? `<br><button onclick="showReadAnnouncementsModal()" class="mt-2 text-indigo-600 underline font-medium">Lihat ${hiddenCount} pengumuman yang sudah dibaca</button>` : ''}
            </div>
        `;
        return;
    }

    let html = activeAnnouncementsHtml;
    if (hiddenCount > 0) {
        html += `
            <div class="text-center mt-3">
                <button onclick="showReadAnnouncementsModal()" class="text-[11px] text-slate-500 hover:text-indigo-600 underline font-medium">
                    Lihat Arsip Pengumuman (${hiddenCount} sudah dibaca)
                </button>
            </div>
        `;
    }

    container.innerHTML = html;
}

window.markAnnouncementAsRead = function (uniqueId) {
    const nip = (currentUser && currentUser.nip) ? currentUser.nip : 'default_user';
    const storageKey = `hris_read_announcements_${nip}`;
    let readAnnouncements = JSON.parse(localStorage.getItem(storageKey)) || [];

    if (!readAnnouncements.includes(String(uniqueId))) {
        readAnnouncements.push(String(uniqueId));
        localStorage.setItem(storageKey, JSON.stringify(readAnnouncements));
    }
    renderEmployeeAnnouncements();
};

window.showReadAnnouncementsModal = function () {
    const modal = document.getElementById('archiveModal');
    const containerList = document.getElementById('archiveModalList');
    if (!modal || !containerList || typeof announcementDB === 'undefined') return;

    const nip = (currentUser && currentUser.nip) ? currentUser.nip : 'default_user';
    const storageKey = `hris_read_announcements_${nip}`;
    let readAnnouncements = JSON.parse(localStorage.getItem(storageKey)) || [];

    const archivedList = announcementDB.filter(a => readAnnouncements.includes(String(a.id || a.title)));

    if (archivedList.length === 0) {
        containerList.innerHTML = `<p class="text-xs text-slate-400 text-center py-4">Belum ada pengumuman dalam arsip.</p>`;
    } else {
        containerList.innerHTML = archivedList.map(a => {
            const uniqueId = String(a.id || a.title);
            const safeId = uniqueId.replace(/'/g, "\\'");
            return `
                <div class="pt-3 first:pt-0 flex justify-between items-start gap-3">
                    <div>
                        <h4 class="text-xs font-bold text-slate-800">${a.title}</h4>
                        <p class="text-xs text-slate-500 mt-0.5 line-clamp-2">${a.content}</p>
                        <span class="text-[9px] text-slate-400 mt-1 inline-block">${a.date || 'Informasi'}</span>
                    </div>
                    <button onclick="restoreSingleAnnouncement('${safeId}')" class="text-[10px] bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 px-2.5 py-1 rounded-lg transition shrink-0 font-medium">
                        Pulihkan
                    </button>
                </div>
            `;
        }).join('');
    }

    modal.classList.remove('hidden');
};

window.closeArchiveModal = function () {
    const modal = document.getElementById('archiveModal');
    if (modal) modal.classList.add('hidden');
};

window.restoreSingleAnnouncement = function (uniqueId) {
    const nip = (currentUser && currentUser.nip) ? currentUser.nip : 'default_user';
    const storageKey = `hris_read_announcements_${nip}`;
    let readAnnouncements = JSON.parse(localStorage.getItem(storageKey)) || [];

    readAnnouncements = readAnnouncements.filter(id => id !== String(uniqueId));
    localStorage.setItem(storageKey, JSON.stringify(readAnnouncements));

    showReadAnnouncementsModal();
    renderEmployeeAnnouncements();
};

window.restoreAllAnnouncements = function () {
    const nip = (currentUser && currentUser.nip) ? currentUser.nip : 'default_user';
    const storageKey = `hris_read_announcements_${nip}`;

    if (confirm("Apakah Anda yakin ingin memunculkan kembali semua pengumuman?")) {
        localStorage.removeItem(storageKey);
        closeArchiveModal();
        renderEmployeeAnnouncements();
    }
};