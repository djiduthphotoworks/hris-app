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
    { email: "siti@perusahaan.com", nip: "102", pass: "123456", name: "Siti Aminah", role: "hr", division: "Human Resources", foto: null, skor: 95.0, grade: "Grade A" }
];

let usersDB = JSON.parse(localStorage.getItem('hris_users_db'));
if (!usersDB || !Array.isArray(usersDB)) {
    usersDB = defaultUsers;
    localStorage.setItem('hris_users_db', JSON.stringify(usersDB));
}

// Database Cuti
let leavesDB = JSON.parse(localStorage.getItem('hris_leaves_db')) || [
    { id: 1, name: "Budi Santoso", nip: "101", type: "Cuti Tahunan", start: "2026-01-10", end: "2026-01-12", reason: "Keperluan keluarga", status: "Disetujui" }
];

// Database Absensi
let absensiDB = JSON.parse(localStorage.getItem('hris_absensi_db')) || {
    "101": { hadir: 20, izin: 1, sakit: 0, alfa: 0, statusHariIni: "Belum Absen" },
    "102": { hadir: 21, izin: 0, sakit: 0, alfa: 0, statusHariIni: "Belum Absen" }
};

// Database Klaim Reimbursement
let reimburseDB = JSON.parse(localStorage.getItem('hris_reimburse_db')) || [
    { id: 1, name: "Budi Santoso", nip: "101", type: "Klaim Medis / Kesehatan", amount: 150000, desc: "Pembelian obat klinik", status: "Menunggu" }
];

// Database Dokumen Karyawan
let documentsDB = JSON.parse(localStorage.getItem('hris_documents_db')) || [
    { id: 1, nip: "101", docName: "Scan KTP Budi Santoso", date: "22 September 2026" }
];

// Database Payroll Arsip
let payrollArchiveDB = JSON.parse(localStorage.getItem('hris_payroll_archive')) || [
    { id: 1, nip: "101", nama: "Budi Santoso", periode: "September 2026", gajiPokok: 6500000, uangLembur: 400000, bpjs: 195000, pph21: 55000, total: 6650000 }
];

// Database Pengumuman
let announcementDB = JSON.parse(localStorage.getItem('hris_announcement_db')) || [
    { id: 1, title: "Peluncuran Sistem HRIS Pro Enterprise", content: "Seluruh fitur absensi mandiri, klaim, dan dokumen kini aktif secara online.", date: "22 September 2026" }
];

let currentUser = JSON.parse(localStorage.getItem('hris_current_user')) || null;

window.onload = function() {
    const path = window.location.pathname;

    if (currentUser) {
        if (document.getElementById('navUserBadge')) {
            document.getElementById('navUserBadge').innerText = `${currentUser.name} (${currentUser.role === 'hr' ? 'HR Enterprise' : 'Karyawan'})`;
        }
        if (document.getElementById('leaveNama')) {
            document.getElementById('leaveNama').value = currentUser.name;
        }

        // Render Profil Karyawan
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

        // Render Dashboard HR
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
        }

        if (document.getElementById('employeeAnnouncementContainer')) {
            renderEmployeeAnnouncements();
        }

    } else if (!path.includes('index.html') && path !== '/' && path.length > 1) {
        window.location.href = 'index.html';
    }
}

// Switch Tab Auth
window.switchAuthTab = function(type) {
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
}

// Login & Register
const loginFormElement = document.getElementById('loginForm');
if (loginFormElement) {
    loginFormElement.addEventListener('submit', function(e) {
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
    registerFormElement.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('regName').value.trim();
        const email = document.getElementById('regEmail').value.trim().toLowerCase();
        const nip = document.getElementById('regNip').value.trim();
        const role = document.getElementById('regRole').value;
        const division = document.getElementById('regDivisi').value.trim();
        const pass = document.getElementById('regPassword').value.trim();
        const fotoInput = document.getElementById('regFoto');

        if (usersDB.some(u => u.email.toLowerCase() === email || u.nip === nip)) {
            alert("Email atau NIP sudah terdaftar!");
            return;
        }

        const saveUser = (fotoBase64) => {
            const newUser = { email, nip, pass, name, role, division, foto: fotoBase64, skor: 85.0, grade: "Grade A" };
            usersDB.push(newUser);
            localStorage.setItem('hris_users_db', JSON.stringify(usersDB));

            absensiDB[nip] = { hadir: 0, izin: 0, sakit: 0, alfa: 0, statusHariIni: "Belum Absen" };
            localStorage.setItem('hris_absensi_db', JSON.stringify(absensiDB));

            localStorage.setItem('hris_current_user', JSON.stringify(newUser));
            window.location.href = role === 'hr' ? 'dashboard-admin.html' : 'dashboard-karyawan.html';
        };

        if (fotoInput.files && fotoInput.files[0]) {
            const reader = new FileReader();
            reader.onload = e => saveUser(e.target.result);
            reader.onerror = () => saveUser(null);
            reader.readAsDataURL(fotoInput.files[0]);
        } else {
            saveUser(null);
        }
    });
}

window.logout = function() {
    localStorage.removeItem('hris_current_user');
    window.location.href = 'index.html';
}

// Tabs Switcher Admin
window.switchAdminTab = function(target) {
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
}

// Tabs Switcher Karyawan
window.switchKaryawanTab = function(target) {
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
}

// Absensi Mandiri (Check-in / Check-out)
window.doCheckIn = function() {
    let abs = absensiDB[currentUser.nip] || { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
    abs.hadir += 1;
    abs.statusHariIni = "Check-in pukul " + new Date().toLocaleTimeString('id-ID');
    absensiDB[currentUser.nip] = abs;
    localStorage.setItem('hris_absensi_db', JSON.stringify(absensiDB));
    alert("Berhasil Check-in masuk kerja hari ini!");
    renderEmployeeAbsensi(currentUser.nip);
}

window.doCheckOut = function() {
    let abs = absensiDB[currentUser.nip] || { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
    abs.statusHariIni = "Check-out pukul " + new Date().toLocaleTimeString('id-ID');
    absensiDB[currentUser.nip] = abs;
    localStorage.setItem('hris_absensi_db', JSON.stringify(absensiDB));
    alert("Berhasil Check-out pulang!");
    renderEmployeeAbsensi(currentUser.nip);
}

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

// Cuti Karyawan
const leaveForm = document.getElementById('leaveForm');
if (leaveForm) {
    leaveForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const type = document.getElementById('leaveType').value;
        const start = document.getElementById('leaveStart').value;
        const end = document.getElementById('leaveEnd').value;
        const reason = document.getElementById('leaveReason').value.trim();

        leavesDB.push({ id: Date.now(), name: currentUser.name, nip: currentUser.nip, type, start, end, reason, status: "Menunggu" });
        localStorage.setItem('hris_leaves_db', JSON.stringify(leavesDB));
        alert("Permohonan cuti dikirim!");
        leaveForm.reset();
        document.getElementById('leaveNama').value = currentUser.name;
        renderEmployeeLeaves(currentUser.nip);
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

// Klaim Reimbursement Karyawan
const reimburseForm = document.getElementById('reimburseForm');
if (reimburseForm) {
    reimburseForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const type = document.getElementById('reimType').value;
        const amount = parseFloat(document.getElementById('reimAmount').value);
        const desc = document.getElementById('reimDesc').value.trim();

        reimburseDB.push({ id: Date.now(), name: currentUser.name, nip: currentUser.nip, type, amount, desc, status: "Menunggu" });
        localStorage.setItem('hris_reimburse_db', JSON.stringify(reimburseDB));
        alert("Klaim berhasil diajukan ke HR!");
        reimburseForm.reset();
        renderEmployeeReimbursements(currentUser.nip);
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

// Dokumen Karyawan (Locker)
const docUploadForm = document.getElementById('docUploadForm');
if (docUploadForm) {
    docUploadForm.addEventListener('submit', function(e) {
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

window.deleteDoc = function(id) {
    documentsDB = documentsDB.filter(d => d.id !== id);
    localStorage.setItem('hris_documents_db', JSON.stringify(documentsDB));
    renderEmployeeDocuments(currentUser.nip);
}

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

window.openAddEmployeeModal = function() { document.getElementById('addEmployeeModal').classList.remove('hidden'); }
window.closeAddEmployeeModal = function() { document.getElementById('addEmployeeModal').classList.add('hidden'); }

const addEmployeeForm = document.getElementById('addEmployeeForm');
if (addEmployeeForm) {
    addEmployeeForm.addEventListener('submit', function(e) {
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
    });
}

window.deleteEmployee = function(email) {
    usersDB = usersDB.filter(u => u.email !== email);
    localStorage.setItem('hris_users_db', JSON.stringify(usersDB));
    renderMasterEmployeeTable();
}

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

window.updateAbsensi = function(nip) {
    absensiDB[nip] = {
        hadir: parseInt(document.getElementById(`hadir_${nip}`).value) || 0,
        izin: parseInt(document.getElementById(`izin_${nip}`).value) || 0,
        sakit: parseInt(document.getElementById(`sakit_${nip}`).value) || 0,
        alfa: parseInt(document.getElementById(`alfa_${nip}`).value) || 0,
        statusHariIni: "Diperbarui HR"
    };
    localStorage.setItem('hris_absensi_db', JSON.stringify(absensiDB));
    alert("Absensi disimpan!");
}

// Ekspor Absensi ke CSV
window.exportAbsensiCSV = function() {
    let csv = "NIP,Nama,Hadir,Izin,Sakit,Alfa\n";
    usersDB.filter(u => u.role !== 'hr').forEach(u => {
        const a = absensiDB[u.nip] || { hadir: 0, izin: 0, sakit: 0, alfa: 0 };
        csv += `${u.nip},"${u.name}",${a.hadir},${a.izin},${a.sakit},${a.alfa}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rekap_absensi.csv'; a.click();
}

// Approval Cuti Admin
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

window.updateLeaveStatus = function(id, status) {
    leavesDB = leavesDB.map(l => l.id === id ? { ...l, status } : l);
    localStorage.setItem('hris_leaves_db', JSON.stringify(leavesDB));
    renderAdminLeaveList();
    renderAdminDashboardStats();
}

// Approval Reimbursement Admin
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

window.updateReimStatus = function(id, status) {
    reimburseDB = reimburseDB.map(r => r.id === id ? { ...r, status } : r);
    localStorage.setItem('hris_reimburse_db', JSON.stringify(reimburseDB));
    renderAdminReimburseList();
}

// Penilaian Kinerja Appraisal 360
function renderAppraisalDropdown() {
    const select = document.getElementById('appraisalNip');
    if (!select) return;
    select.innerHTML = usersDB.filter(u => u.role !== 'hr').map(e => `<option value="${e.nip}">${e.name} (${e.nip})</option>`).join('');
}

const appraisalForm = document.getElementById('appraisalForm');
if (appraisalForm) {
    appraisalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const nip = document.getElementById('appraisalNip').value;
        const skor = parseFloat(document.getElementById('appraisalScore').value);
        const grade = document.getElementById('appraisalGrade').value;

        usersDB = usersDB.map(u => u.nip === nip ? { ...u, skor, grade } : u);
        localStorage.setItem('hris_users_db', JSON.stringify(usersDB));
        alert("Penilaian kinerja berhasil disimpan!");
    });
}

// Payroll & Rekap
function renderPayrollDropdown() {
    const select = document.getElementById('payNamaSelect');
    if (!select) return;
    select.innerHTML = usersDB.filter(u => u.role !== 'hr').map(e => `<option value="${e.nip}|${e.name}">${e.name} (${e.nip})</option>`).join('');
}

const payrollForm = document.getElementById('payrollForm');
if (payrollForm) {
    payrollForm.addEventListener('submit', function(e) {
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
            <td class="p-2.5 text-rose-600">- Rp ${(p.bpjs + pph21).toLocaleString('id-ID')}</td>
            <td class="p-2.5 font-bold text-emerald-700">Rp ${p.total.toLocaleString('id-ID')}</td>
        </tr>
    `).join('');
}

window.exportPayrollCSV = function() {
    let csv = "Periode,NIP,Nama,Gaji Pokok,Lembur,Potongan,Take Home Pay\n";
    payrollArchiveDB.forEach(p => {
        csv += `${p.periode},${p.nip},"${p.nama}",${p.gajiPokok},${p.uangLembur},${p.bpjs + p.pph21},${p.total}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'rekap_payroll.csv'; a.click();
}

// Pengumuman
const announcementForm = document.getElementById('announcementForm');
if (announcementForm) {
    announcementForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const title = document.getElementById('annTitle').value.trim();
        const content = document.getElementById('annContent').value.trim();
        announcementDB.push({ id: Date.now(), title, content, date: new Date().toLocaleDateString('id-ID') });
        localStorage.setItem('hris_announcement_db', JSON.stringify(announcementDB));
        alert("Pengumuman dipublikasikan!");
        announcementForm.reset();
        renderAdminAnnouncements();
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

window.deleteAnn = function(id) {
    announcementDB = announcementDB.filter(a => a.id !== id);
    localStorage.setItem('hris_announcement_db', JSON.stringify(announcementDB));
    renderAdminAnnouncements();
}

function renderEmployeeAnnouncements() {
    const container = document.getElementById('employeeAnnouncementContainer');
    if (!container) return;
    container.innerHTML = announcementDB.map(a => `
        <div class="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-sm flex items-start gap-3">
            <span class="text-xl">📢</span>
            <div><h4 class="font-bold text-sm text-slate-900">${a.title}</h4><p class="text-xs text-slate-700 mt-1">${a.content}</p></div>
        </div>
    `).join('');
}

function populateArsipSlipDropdown(nip) {
    const select = document.getElementById('selectArsipSlip');
    if (!select) return;
    const userSlips = payrollArchiveDB.filter(s => s.nip === nip);
    if (userSlips.length === 0) { select.innerHTML = `<option>Tidak ada arsip</option>`; return; }
    select.innerHTML = userSlips.map(s => `<option value="${s.id}">${s.periode} - (THP: Rp ${s.total.toLocaleString('id-ID')})</option>`).join('');
    renderEmployeeSlip(userSlips[0].id);
}

window.renderEmployeeSlip = function(id) {
    const slip = payrollArchiveDB.find(s => s.id == id);
    if (!slip) return;
    document.getElementById('slipPeriodeLabel').innerText = `Periode: ${slip.periode}`;
    document.getElementById('slipNama').innerText = `${slip.nama} (NIP: ${slip.nip})`;
    document.getElementById('slipPokok').innerText = "Rp " + slip.gajiPokok.toLocaleString('id-ID');
    document.getElementById('slipLembur').innerText = "Rp " + slip.uangLembur.toLocaleString('id-ID');
    document.getElementById('slipBpjs').innerText = "- Rp " + slip.bpjs.toLocaleString('id-ID');
    document.getElementById('slipPph21').innerText = "- Rp " + slip.pph21.toLocaleString('id-ID');
    document.getElementById('slipTotal').innerText = "Rp " + slip.total.toLocaleString('id-ID');
    document.getElementById('signKaryawanName').innerText = slip.nama;
}