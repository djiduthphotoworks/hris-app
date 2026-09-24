// ==========================================
// KODE KHUSUS ADMIN: GRAFIK STATISTIK DASHBOARD (CHART.JS)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderAdminCharts, 400);
    setTimeout(initIndividualChart, 600); // Sedikit diperlambat agar elemen bawah sudah siap sepenuhnya
    window.addEventListener('storage', () => {
        renderAdminCharts();
        initIndividualChart();
    });
});

function renderAdminCharts() {
    let rawLeaves = JSON.parse(localStorage.getItem('leavesDB') || localStorage.getItem('hris_leaves_db') || '[]');
    let rawClaims = JSON.parse(localStorage.getItem('claimsDB') || localStorage.getItem('reimburseDB') || '[]');

    const monthlyLeaveCounts = new Array(12).fill(0);
    const monthlyClaimCounts = new Array(12).fill(0);

    if (Array.isArray(rawLeaves)) {
        rawLeaves.forEach(l => {
            if (l.date || l.tanggal) {
                let month = new Date(l.date || l.tanggal).getMonth();
                if (!isNaN(month)) monthlyLeaveCounts[month]++;
            }
        });
    }

    if (Array.isArray(rawClaims)) {
        rawClaims.forEach(c => {
            if (c.date || c.tanggal) {
                let month = new Date(c.date || c.tanggal).getMonth();
                if (!isNaN(month)) monthlyClaimCounts[month]++;
            }
        });
    }

    const ctxMonthly = document.getElementById('monthlyChart');
    if (ctxMonthly) {
        let existingChart = Chart.getChart(ctxMonthly);
        if (existingChart) existingChart.destroy();

        new Chart(ctxMonthly, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                datasets: [
                    { label: 'Cuti', data: monthlyLeaveCounts, backgroundColor: '#6366f1', borderRadius: 4 },
                    { label: 'Klaim', data: monthlyClaimCounts, backgroundColor: '#f43f5e', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
                scales: { y: { beginAtZero: true, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
            }
        });
    }

    const ctxStatus = document.getElementById('statusChart');
    if (ctxStatus) {
        let existingStatusChart = Chart.getChart(ctxStatus);
        if (existingStatusChart) existingStatusChart.destroy();

        new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Aktif Bekerja', 'Sedang Cuti', 'Izin / Sakit'],
                datasets: [{ data: [8, 1, 0], backgroundColor: ['#10b981', '#f59e0b', '#6366f1'], borderWidth: 2, borderColor: '#ffffff' }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } } },
                cutout: '65%'
            }
        });
    }
}

// --- GRAFIK PERFORMA PER INDIVIDU (SINKRON LANGSUNG DENGAN HALAMAN) ---
let individualChartInstance = null;

function initIndividualChart() {
    const selectEl = document.getElementById('selectKaryawanPerforma');
    if (!selectEl) return;

    let currentSelectedValue = selectEl.value;
    window.employeePerformanceData = {};
    selectEl.innerHTML = '';

    let employeeNames = [];

    // 1. Ambil langsung opsi dari dropdown form evaluasi di bagian bawah halaman
    const allSelects = document.querySelectorAll('select');
    allSelects.forEach(sel => {
        if (sel !== selectEl && sel.options && sel.options.length > 0) {
            for (let opt of sel.options) {
                let text = opt.text.trim();
                let val = opt.value.trim();
                // Validasi agar mengambil data nama karyawan yang valid
                if (text && !text.toLowerCase().includes('pilih') && !text.toLowerCase().includes('belum') && !employeeNames.includes(text)) {
                    employeeNames.push(text);
                }
            }
        }
    });

    // 2. Jika elemen bawah belum terdeteksi, ambil cadangan dari localStorage utama
    if (employeeNames.length === 0) {
        try {
            for (let key of ['employees', 'hris_employees', 'employeeList', 'karyawanDB']) {
                let data = JSON.parse(localStorage.getItem(key) || '[]');
                if (Array.isArray(data) && data.length > 0) {
                    data.forEach(emp => {
                        let rawName = typeof emp === 'string' ? emp : (emp.name || emp.nama || '');
                        let empId = emp.id || emp.nip || emp.employeeId || '';
                        if (rawName) {
                            let displayName = empId && !rawName.includes(empId) ? `${rawName} (${empId})` : rawName;
                            employeeNames.push(displayName);
                        }
                    });
                    break;
                }
            }
        } catch (e) { }
    }

    // 3. Pengaman mutlak terakhir jika masih kosong
    if (employeeNames.length === 0) {
        employeeNames = ['Budi Santoso (101)', 'Siti Aminah (102)', 'tomo (2347)'];
    }

    // Masukkan ke dropdown grafik performa
    employeeNames.forEach(name => {
        window.employeePerformanceData[name] = [78, 80, 82, 85, 84, 88, 87, 90, 89, 92, 91, 94];

        let opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        selectEl.appendChild(opt);
    });

    if (currentSelectedValue && window.employeePerformanceData[currentSelectedValue]) {
        selectEl.value = currentSelectedValue;
    }

    updateIndividualChart();
}

function updateIndividualChart() {
    const selectEl = document.getElementById('selectKaryawanPerforma');
    const ctx = document.getElementById('individualPerformanceChart');
    if (!selectEl || !ctx) return;

    let selectedName = selectEl.value;
    let dataValues = window.employeePerformanceData[selectedName] || new Array(12).fill(0);

    let existingLineChart = Chart.getChart(ctx);
    if (existingLineChart) existingLineChart.destroy();

    individualChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
            datasets: [{
                label: `Skor Performa - ${selectedName}`,
                data: dataValues,
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#6366f1',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
            scales: { y: { min: 50, max: 100, grid: { color: '#f1f5f9' } }, x: { grid: { display: false } } }
        }
    });
}