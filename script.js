class CrnePloce {
    constructor() {
        this.records = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadRecords();
        this.updateAuthStatus();
    }

    setupEventListeners() {
        const addRecordBtn = document.getElementById('addRecordBtn');
        const searchInput = document.getElementById('searchInput');
        const modal = document.getElementById('recordModal');
        const closeBtn = modal.querySelector('.close');

        addRecordBtn.addEventListener('click', () => this.addRecord());

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addRecord();
            }
        });

        closeBtn.addEventListener('click', () => this.closeModal());

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal();
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    async loadRecords() {
        try {
            const response = await fetch('get_records.php');
            this.records = await response.json();
            this.displayRecords();
            this.updateRecordCount();
            this.updateYearChart();
        } catch (error) {
            console.error('Error loading records:', error);
            this.showStatus('Greška pri učitavanju kolekcije', 'error');
        }
    }

    displayRecords() {
        const grid = document.getElementById('recordsGrid');

        if (this.records.length === 0) {
            grid.innerHTML = '<div class="loading">Nema ploča u kolekciji. Dodajte prvu ploču!</div>';
            return;
        }

        // Sort records by year (oldest first)
        const sortedRecords = [...this.records].sort((a, b) => {
            const yearA = a.year || 9999;
            const yearB = b.year || 9999;
            return yearA - yearB;
        });

        grid.innerHTML = sortedRecords.map(record => `
            <div class="record-card" onclick="app.showRecordDetails('${record.id}')">
                <div class="record-cover">
                    ${record.cover ?
                        `<img src="${record.cover}" alt="${record.title}" onerror="this.style.display='none'; this.parentNode.innerHTML='🎵';">` :
                        '🎵'
                    }
                </div>
                <div class="record-info">
                    <h3>${this.escapeHtml(record.title)}</h3>
                    <div class="artist">${this.escapeHtml(record.artists.join(', '))}</div>
                    <div class="year">${record.year || 'Nepoznata godina'}</div>
                </div>
            </div>
        `).join('');
    }

    updateRecordCount() {
        document.getElementById('recordCount').textContent = this.records.length;
    }

    async addRecord() {
        const searchInput = document.getElementById('searchInput');
        const releaseId = searchInput.value.trim();

        if (!releaseId) {
            this.showStatus('Unesite Discogs ID ploče', 'error');
            return;
        }

        if (!this.isValidDiscogsId(releaseId)) {
            this.showStatus('Unesite valjan Discogs ID (samo brojevi)', 'error');
            return;
        }

        // Check if user is authenticated
        const credentials = sessionStorage.getItem('authCredentials');
        if (!credentials) {
            this.showStatus('Morate se prijaviti da biste dodali ploču', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        const addBtn = document.getElementById('addRecordBtn');
        const originalText = addBtn.textContent;

        addBtn.disabled = true;
        addBtn.textContent = 'Dodajem...';
        this.showStatus('Preuzimam podatke sa Discogs-a...', 'loading');

        try {
            const response = await fetch('add_record.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify({ releaseId })
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus('Ploča je uspešno dodana u kolekciju!', 'success');
                searchInput.value = '';
                await this.loadRecords();
            } else {
                this.showStatus(result.error || 'Greška pri dodavanju ploče', 'error');
            }
        } catch (error) {
            console.error('Error adding record:', error);
            this.showStatus('Greška pri komunikaciji sa serverom', 'error');
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = originalText;
        }
    }

    async showRecordDetails(recordId) {
        try {
            const response = await fetch(`get_record.php?id=${recordId}`);
            const record = await response.json();

            if (record.error) {
                this.showStatus(record.error, 'error');
                return;
            }

            this.displayRecordModal(record);
        } catch (error) {
            console.error('Error loading record details:', error);
            this.showStatus('Greška pri učitavanju detalja ploče', 'error');
        }
    }

    displayRecordModal(record) {
        const modal = document.getElementById('recordModal');
        const modalContent = document.getElementById('modalContent');
        const credentials = sessionStorage.getItem('authCredentials');

        const content = this.parseMarkdown(record.content);

        // Only show delete button if user is authenticated
        const deleteButton = credentials ? `
            <div class="modal-actions">
                <button class="delete-btn" onclick="app.deleteRecord('${record.id}')">
                    🗑️ Obriši ploču
                </button>
            </div>
        ` : '';

        modalContent.innerHTML = `
            <div class="modal-record">
                ${record.cover ? `
                    <div class="modal-cover">
                        <img src="${record.cover}" alt="Cover">
                    </div>
                ` : ''}
                <div class="modal-details">
                    ${content}
                    ${deleteButton}
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('recordModal').style.display = 'none';
    }

    parseMarkdown(markdown) {
        return markdown
            .replace(/^# (.+)$/gm, '<h2>$1</h2>')
            .replace(/^## (.+)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/^- (.+)$/gm, '<li>$1</li>')
            .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
            .replace(/\n\n/g, '</p><p>')
            .replace(/^(.+)$/gm, '<p>$1</p>')
            .replace(/<p><h/g, '<h')
            .replace(/<\/h2><\/p>/g, '</h2>')
            .replace(/<\/h3><\/p>/g, '</h3>')
            .replace(/<p><ul>/g, '<ul>')
            .replace(/<\/ul><\/p>/g, '</ul>');
    }

    showStatus(message, type) {
        const statusDiv = document.getElementById('searchStatus');
        statusDiv.textContent = message;
        statusDiv.className = `status-message ${type}`;

        if (type === 'success') {
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = '';
            }, 3000);
        }
    }

    isValidDiscogsId(id) {
        return /^\d+$/.test(id);
    }

    async deleteRecord(recordId) {
        if (!confirm('Da li ste sigurni da želite da obrišete ovu ploču?')) {
            return;
        }

        // Check if user is authenticated
        const credentials = sessionStorage.getItem('authCredentials');
        if (!credentials) {
            this.showStatus('Morate se prijaviti da biste obrisali ploču', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        try {
            const response = await fetch('delete_record.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: JSON.stringify({ releaseId: recordId })
            });

            const result = await response.json();

            if (result.success) {
                this.showStatus('Ploča je uspešno obrisana iz kolekcije!', 'success');
                this.closeModal();
                await this.loadRecords();
            } else {
                this.showStatus(result.error || 'Greška pri brisanju ploče', 'error');
            }
        } catch (error) {
            console.error('Error deleting record:', error);
            this.showStatus('Greška pri komunikaciji sa serverom', 'error');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    updateYearChart() {
        const canvas = document.getElementById('yearChart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.records.length === 0) {
            return;
        }

        // Count records by year
        const yearCounts = {};
        this.records.forEach(record => {
            const year = record.year || 'Nepoznata';
            yearCounts[year] = (yearCounts[year] || 0) + 1;
        });

        // Sort years and create continuous range
        const sortedYears = Object.keys(yearCounts)
            .filter(y => y !== 'Nepoznata')
            .map(y => parseInt(y))
            .sort((a, b) => a - b);

        if (sortedYears.length === 0) return;

        const minYear = sortedYears[0];
        const maxYear = sortedYears[sortedYears.length - 1];
        const yearRange = maxYear - minYear + 1;

        // Fill in missing years with 0
        const dataPoints = [];
        for (let year = minYear; year <= maxYear; year++) {
            dataPoints.push({
                year: year,
                count: yearCounts[year] || 0
            });
        }

        const maxCount = Math.max(...dataPoints.map(d => d.count));
        const paddingBottom = 20;
        const paddingX = 25;
        const chartHeight = height - paddingBottom;
        const chartWidth = width - (paddingX * 2);
        const barWidth = chartWidth / dataPoints.length;
        const barSpacing = 1;

        // Draw histogram bars
        dataPoints.forEach((point, index) => {
            if (point.count > 0) {
                const x = paddingX + (index * barWidth);
                const barHeight = (point.count / maxCount) * chartHeight;
                const y = height - barHeight;

                // Create gradient for each bar
                const gradient = ctx.createLinearGradient(x, y, x, height);
                gradient.addColorStop(0, '#ff6b6b');
                gradient.addColorStop(1, '#4ecdc4');

                ctx.fillStyle = gradient;
                ctx.fillRect(x + barSpacing/2, y, barWidth - barSpacing, barHeight);
            }
        });

        // Draw year labels
        ctx.fillStyle = '#cccccc';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';

        // Show first and last year
        ctx.fillText(minYear.toString(), paddingX + barWidth/2, height - 5);
        ctx.fillText(maxYear.toString(), paddingX + chartWidth - barWidth/2, height - 5);

        // Show middle year if range is large
        if (yearRange > 10) {
            const midYear = Math.floor((minYear + maxYear) / 2);
            const midIndex = dataPoints.findIndex(p => p.year === midYear);
            if (midIndex >= 0) {
                ctx.fillText(midYear.toString(), paddingX + (midIndex * barWidth) + barWidth/2, height - 5);
            }
        }
    }

    updateAuthStatus() {
        const authStatus = document.getElementById('authStatus');
        const searchSection = document.querySelector('.search-section');
        const credentials = sessionStorage.getItem('authCredentials');
        const username = sessionStorage.getItem('username');

        if (credentials && username) {
            authStatus.innerHTML = `
                <span class="username">${this.escapeHtml(username)}</span>
                <button onclick="app.logout()">Odjavi se</button>
            `;
            // Show add record section
            if (searchSection) {
                searchSection.classList.remove('hidden');
            }
        } else {
            authStatus.innerHTML = `
                <button class="login-btn" onclick="window.location.href='login.html'">Prijavi se</button>
            `;
            // Hide add record section
            if (searchSection) {
                searchSection.classList.add('hidden');
            }
        }
    }

    logout() {
        sessionStorage.removeItem('authCredentials');
        sessionStorage.removeItem('username');
        this.updateAuthStatus();
        this.showStatus('Uspešno ste se odjavili', 'success');
    }
}

const app = new CrnePloce();