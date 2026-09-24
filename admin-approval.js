document.addEventListener('DOMContentLoaded', () => {
    setTimeout(checkAndRenderAdminBadges, 300);
    window.addEventListener('storage', checkAndRenderAdminBadges);
});

function checkAndRenderAdminBadges() {
    let pendingLeaves = [];
    let rawLeaves = window.leavesDB || JSON.parse(localStorage.getItem('hris_leaves_db') || '[]');
    if (Array.isArray(rawLeaves)) {
        pendingLeaves = rawLeaves.filter(l => {
            const status = String(l.status || '').toLowerCase();
            return status.includes('pending') || status.includes('menunggu') || status.includes('diajukan');
        });
    }

    let pendingClaims = [];
    let rawClaims = [];
    const possibleKeys = ['hris_reimburse_db', 'reimburseDB', 'reimbursementDB'];

    possibleKeys.forEach(key => {
        let data = JSON.parse(localStorage.getItem(key));
        if (Array.isArray(data) && data.length > 0) {
            rawClaims = rawClaims.concat(data);
        }
    });

    pendingClaims = rawClaims.filter(c => {
        const status = String(c.status || '').toLowerCase();
        return status.includes('pending') || status.includes('menunggu') || status.includes('diajukan') || status.includes('proses');
    });

    const totalPendingCount = pendingLeaves.length + pendingClaims.length;

    const allCards = document.querySelectorAll('div');
    allCards.forEach(card => {
        if (card.innerText && (card.innerText.includes('PENDING APPROVAL') || card.innerText.includes('Permohonan'))) {
            const numberElements = card.querySelectorAll('.text-2xl, .text-3xl, .text-4xl, span, p');
            numberElements.forEach(el => {
                let text = el.innerText.trim();
                if (/^\d+$/.test(text) || text.includes('Permohonan')) {
                    el.innerText = totalPendingCount + (text.includes('Permohonan') ? ' Permohonan' : '');
                }
            });
        }
    });

    const navLinks = document.querySelectorAll('nav a, header a, div[role="navigation"] a, header button');
    navLinks.forEach(link => {
        const text = link.textContent.trim().toLowerCase();
        if (text.includes('cuti')) {
            injectBadge(link, pendingLeaves.length);
        }
        if (text.includes('klaim')) {
            injectBadge(link, pendingClaims.length);
        }
    });
}

function injectBadge(element, count) {
    let badge = element.querySelector('.admin-nav-badge');
    if (!badge) {
        element.style.position = 'relative';
        badge = document.createElement('span');
        badge.className = 'admin-nav-badge absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-sm';
        element.appendChild(badge);
    }

    if (count > 0) {
        badge.innerText = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}