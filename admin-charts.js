// ==========================================
// KODE KHUSUS ADMIN: GRAFIK STATISTIK DASHBOARD (CHART.JS)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderAdminCharts, 400);
    setTimeout(initIndividualChart, 500);
    window.addEventListener('storage', () => {
        renderAdminCharts();
        initIndividualChart();
    });
});

function renderAdminCharts() {
    // 1. Ambil data real cuti & klaim dari localStorage untuk Bar Chart
    let rawLeaves = JSON.parse(localStorage.getItem('leavesDB') || localStorage.getItem('hris_leaves_db') || '[]');
    let rawClaims = JSON.parse(localStorage.getItem('claimsDB') || localStorage.getItem('reimburseDB') || '[]');

    const monthlyLeaveCounts = new Array(12).fill(0);
    const monthlyClaimCounts = new Array(12).fill(0);

    if (Array.isArray(rawLeaves)) {
        rawLeaves.forEach(l => {
            if (l.date || l.tanggal) {
                let month = new Date(l.date || l.tanggal).getMonth(); // 0 - 11
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

    // 2. Render Grafik Batang (Monthly Bar Chart)
    const ctxMonthly = document.getElementById('monthlyChart');
    if (ctxMonthly) {
        let existingChart = Chart.getChart(ctxMonthly);
        if (existingChart) existingChart.destroy();

        new Chart(ctxMonthly, {
            type: 'bar',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
                datasets: [
                    {
                        label: 'Cuti',
                        data: monthlyLeaveCounts,
                        backgroundColor: '#6366f1',
                        borderRadius: 4
                    },
                    {
                        label: 'Klaim',
                        data: monthlyClaimCounts,
                        backgroundColor: '#f43f5e',
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#f1f5f9' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    // 3. Render Grafik Donat (Employee Status Doughnut Chart)
    const ctxStatus = document.getElementById('statusChart');
    if (ctxStatus) {
        let existingStatusChart = Chart.getChart(ctxStatus);
        if (existingStatusChart) existingStatusChart.destroy();

        new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Aktif Bekerja', 'Sedang Cuti', 'Izin / Sakit'],
                datasets: [{
                    data: [8, 1, 0],
                    backgroundColor: ['#10b981', '#f59e0b', '#6366f1'],
                    borderWidth: 2,
                    borderColor: '#ffffff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 10 } } }
                },
                cutout: '65%'
            }
        });
    }
}

// --- GRAFIK PERFORMA PER INDIVIDU (SINKRON DENGAN MASTER DATA) ---
let individualChartInstance = null;

function initIndividualChart() {
    const selectEl = document.getElementById('selectKaryawanPerforma');
    if (!selectEl) return;

    let currentSelectedValue = selectEl.value;

    // Cek menyeluruh ke berbagai kemungkinan key localStorage aplikasi Anda
    let employees = JSON.parse(
        localStorage.getItem('employees') ||
        localStorage.getItem('hris_employees') ||
        localStorage.getItem('employeeList') ||
        '[]'
    );

    window.employeePerformanceData = {};
    selectEl.innerHTML = ''; // Bersihkan opsi dropdown lama

    if (!Array.isArray(employees) || employees.length === 0) {
        let opt = document.createElement('option');
        opt.value = "";
        opt.textContent = "Belum ada data karyawan";
        selectEl.appendChild(opt);
        if (typeof updateIndividualChart === 'function') updateIndividualChart();
        return;
    }

    employees.forEach((emp, index) => {
        let rawName = typeof emp === 'string' ? emp : (emp.name || emp.nama || `Karyawan ${index + 1}`);
        let empId = emp.id || emp.nip || emp.employeeId || '';

        let displayName = empId && !rawName.includes(empId) ? `${rawName} (${empId})` : rawName;

        window.employeePerformanceData[displayName] = [78, 80, 82, 85, 84, 88, 87, 90, 89, 92, 91, 94];

        let opt = document.createElement('option');
        opt.value = displayName;
        opt.textContent = displayName;
        selectEl.appendChild(opt);
    });

    // Pertahankan pilihan sebelumnya jika masih ada di list, jika tidak pilih data pertama
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
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
            },
            scales: {
                y: { min: 50, max: 100, grid: { color: '#f1f5f9' } },
                x: { grid: { display: false } }
            }
        }
    });
}