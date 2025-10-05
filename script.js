class CrnePloce {
    constructor() {
        this.records = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadRecords();
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

        grid.innerHTML = this.records.map(record => `
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

        const content = this.parseMarkdown(record.content);

        modalContent.innerHTML = `
            <div class="modal-record">
                ${record.cover ? `
                    <div class="modal-cover">
                        <img src="${record.cover}" alt="Cover">
                    </div>
                ` : ''}
                <div class="modal-details">
                    ${content}
                    <div class="modal-actions">
                        <button class="delete-btn" onclick="app.deleteRecord('${record.id}')">
                            🗑️ Obriši ploču
                        </button>
                    </div>
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

        try {
            const response = await fetch('delete_record.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
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
}

const app = new CrnePloce();