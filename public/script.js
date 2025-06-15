// Logger Dashboard JavaScript

class LoggerDashboard {
    constructor() {
        this.currentPage = 1;
        this.currentFilters = {};
        this.authToken = 'demo789token123'; // This should be configurable
        this.refreshInterval = null;
        
        this.initializeElements();
        this.attachEventListeners();        this.loadInitialData();
        this.startAutoRefresh();
    }    initializeElements() {
        // Filter elements
        this.sourceFilter = document.getElementById('sourceFilter');
        this.levelFilter = document.getElementById('levelFilter');
        this.actionFilter = document.getElementById('actionFilter');
        this.groupFilter = document.getElementById('groupFilter');
        this.timeRangeFilter = document.getElementById('timeRangeFilter');
        this.dateFrom = document.getElementById('dateFrom');
        this.dateTo = document.getElementById('dateTo');
        this.limitFilter = document.getElementById('limitFilter');

        // Button elements
        this.filterBtn = document.getElementById('filterBtn');
        this.prevBtn = document.getElementById('prevBtn');
        this.nextBtn = document.getElementById('nextBtn');

        // Display elements
        this.loading = document.getElementById('loading');
        this.noLogs = document.getElementById('noLogs');
        this.logsTable = document.getElementById('logsTable');
        this.logsBody = document.getElementById('logsBody');
        this.totalLogs = document.getElementById('totalLogs');
        this.currentPageSpan = document.getElementById('currentPage');
        this.totalPages = document.getElementById('totalPages');
        this.alertCount = document.getElementById('alertCount');
        this.pageInfo = document.getElementById('pageInfo');

        // Modal elements
        this.modal = document.getElementById('logModal');
        this.modalClose = document.getElementById('modalClose');
        this.modalBody = document.getElementById('modalBody');
    }    attachEventListeners() {
        this.filterBtn.addEventListener('click', () => this.applyFilters());
        this.prevBtn.addEventListener('click', () => this.previousPage());
        this.nextBtn.addEventListener('click', () => this.nextPage());
        
        // Modal events
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.closeModal();
        });        // Filter change events
        this.sourceFilter.addEventListener('change', () => this.loadGroups());
        this.timeRangeFilter.addEventListener('change', () => this.handleTimeRangeChange());
          // Enter key support for filters
        [this.dateFrom, this.dateTo].forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.applyFilters();
            });
            // Reset time range filter when manually changing dates
            input.addEventListener('change', () => {
                this.timeRangeFilter.value = '';
            });
        });
    }

    async loadInitialData() {
        await Promise.all([
            this.loadSources(),
            this.loadGroups(),
            this.loadLogs()
        ]);
    }

    async loadSources() {
        try {
            const response = await fetch('/api/sources', {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.populateSelect(this.sourceFilter, data.data, 'All Sources');
            }
        } catch (error) {
            console.error('Error loading sources:', error);
        }
    }

    async loadGroups() {
        try {
            const source = this.sourceFilter.value;
            const url = source ? `/api/groups?source=${source}` : '/api/groups';
            
            const response = await fetch(url, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });
            
            if (response.ok) {
                const data = await response.json();
                this.populateSelect(this.groupFilter, data.data, 'All Groups');
            }
        } catch (error) {
            console.error('Error loading groups:', error);
        }
    }

    populateSelect(selectElement, options, defaultText) {
        const currentValue = selectElement.value;
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        
        options.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.value = option;
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
        });
        
        // Restore previous selection if it still exists
        if (options.includes(currentValue)) {
            selectElement.value = currentValue;
        }
    }

    async loadLogs() {
        this.showLoading();
        
        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.limitFilter.value,
                ...this.currentFilters
            });

            const response = await fetch(`/api/logs?${params}`, {
                headers: { 'Authorization': `Bearer ${this.authToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                this.displayLogs(data);
                this.updateStats(data);
                this.updatePagination(data);
            } else {
                this.showError('Failed to load logs');
            }
        } catch (error) {
            console.error('Error loading logs:', error);
            this.showError('Network error while loading logs');
        }
    }

    showLoading() {
        this.loading.style.display = 'flex';
        this.noLogs.style.display = 'none';
        this.logsTable.classList.remove('show');
    }

    displayLogs(data) {
        this.loading.style.display = 'none';
        
        if (!data.logs || data.logs.length === 0) {
            this.noLogs.style.display = 'block';
            this.logsTable.classList.remove('show');
            return;
        }

        this.noLogs.style.display = 'none';
        this.logsTable.classList.add('show');
        
        this.logsBody.innerHTML = '';
        
        data.logs.forEach(log => {
            const row = this.createLogRow(log);
            this.logsBody.appendChild(row);
        });
    }

    createLogRow(log) {
        const row = document.createElement('div');
        row.className = `log-row ${log.action === 'alert' ? 'alert' : ''}`;
        
        const timestamp = new Date(log.timestamp).toLocaleString();
        const actionText = log.action === 'alert' ? 'Alert' : 'Regular';
        const actionClass = log.action === 'alert' ? 'alert' : 'regular';
        
        row.innerHTML = `
            <div class="log-timestamp" data-label="Time">${timestamp}</div>
            <div class="log-level ${log.level}" data-label="Level">${log.level}</div>
            <div class="log-source" data-label="Source">${log.source}</div>
            <div class="log-group" data-label="Group">${log.group}</div>
            <div class="log-action ${actionClass}" data-label="Action">${actionText}</div>
            <div class="log-message" data-label="Message">${this.escapeHtml(log.message)}</div>            <div data-label="Details">
                <button class="log-details-btn" title="View Details">
                    <span class="material-icons">visibility</span>
                </button>
            </div>
        `;
        
        // Add click handler for details button
        const detailsBtn = row.querySelector('.log-details-btn');
        detailsBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showLogDetails(log);
        });
        
        // Add click handler for row
        row.addEventListener('click', () => this.showLogDetails(log));
        
        return row;
    }

    showLogDetails(log) {
        const timestamp = new Date(log.timestamp).toLocaleString();
        const actionText = log.action === 'alert' ? 'Alert' : 'Regular';
        
        this.modalBody.innerHTML = `
            <div class="detail-item">
                <div class="detail-label">Timestamp</div>
                <div class="detail-value">${timestamp}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Level</div>
                <div class="detail-value">
                    <span class="log-level ${log.level}">${log.level}</span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Source</div>
                <div class="detail-value">${this.escapeHtml(log.source)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Group</div>
                <div class="detail-value">${this.escapeHtml(log.group)}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Action</div>
                <div class="detail-value">
                    <span class="log-action ${log.action === 'alert' ? 'alert' : 'regular'}">${actionText}</span>
                </div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Position</div>
                <div class="detail-value">${log.position}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Message</div>
                <div class="detail-value">${this.escapeHtml(log.message)}</div>
            </div>
            ${log.details && Object.keys(log.details).length > 0 ? `
                <div class="detail-item">
                    <div class="detail-label">Details</div>
                    <div class="detail-value json">${JSON.stringify(log.details, null, 2)}</div>
                </div>
            ` : ''}
        `;
        
        this.modal.classList.add('show');
    }

    closeModal() {
        this.modal.classList.remove('show');
    }

    updateStats(data) {
        this.totalLogs.textContent = data.total || 0;
        this.currentPageSpan.textContent = data.page || 1;
        this.totalPages.textContent = data.total_pages || 1;
        
        // Count alerts
        const alertCount = data.logs ? data.logs.filter(log => log.action === 'alert').length : 0;
        this.alertCount.textContent = alertCount;
    }

    updatePagination(data) {
        const hasNext = data.page < data.total_pages;
        const hasPrev = data.page > 1;
        
        this.nextBtn.disabled = !hasNext;
        this.prevBtn.disabled = !hasPrev;
          this.pageInfo.textContent = `Page ${data.page} of ${data.total_pages}`;
    }

    handleTimeRangeChange() {
        const timeRange = this.timeRangeFilter.value;
        if (timeRange) {
            const now = new Date();
            const fromDate = new Date(now);
            
            // Calculate the start time based on selected range
            switch (timeRange) {
                case '1m':
                    fromDate.setMinutes(now.getMinutes() - 1);
                    break;
                case '5m':
                    fromDate.setMinutes(now.getMinutes() - 5);
                    break;
                case '10m':
                    fromDate.setMinutes(now.getMinutes() - 10);
                    break;
                case '30m':
                    fromDate.setMinutes(now.getMinutes() - 30);
                    break;
                case '1h':
                    fromDate.setHours(now.getHours() - 1);
                    break;
                case '5h':
                    fromDate.setHours(now.getHours() - 5);
                    break;
                case '24h':
                    fromDate.setHours(now.getHours() - 24);
                    break;
                case '7d':
                    fromDate.setDate(now.getDate() - 7);
                    break;
            }
            
            // Set the datetime-local inputs
            this.dateFrom.value = this.formatDateTimeLocal(fromDate);
            this.dateTo.value = this.formatDateTimeLocal(now);
        } else {
            // Clear custom range when "Custom Range" is selected
            this.dateFrom.value = '';
            this.dateTo.value = '';
        }
    }

    formatDateTimeLocal(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    applyFilters() {
        this.currentFilters = {};
        
        if (this.sourceFilter.value) this.currentFilters.source = this.sourceFilter.value;
        if (this.levelFilter.value) this.currentFilters.level = this.levelFilter.value;
        if (this.actionFilter.value) this.currentFilters.action = this.actionFilter.value;
        if (this.groupFilter.value) this.currentFilters.group = this.groupFilter.value;
        if (this.dateFrom.value) this.currentFilters.start_date = new Date(this.dateFrom.value).toISOString();
        if (this.dateTo.value) this.currentFilters.end_date = new Date(this.dateTo.value).toISOString();
        
        this.currentPage = 1;
        this.loadLogs();    }

    // clearFilters method removed - button was removed from UI
    // exportLogs method removed - button was removed from UI

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadLogs();
        }
    }

    nextPage() {
        this.currentPage++;
        this.loadLogs();
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadLogs();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    showError(message) {
        this.loading.style.display = 'none';
        this.noLogs.style.display = 'block';
        this.logsTable.classList.remove('show');
        
        // Show error in no-logs section
        const noLogsContent = this.noLogs.querySelector('h3');
        if (noLogsContent) {
            noLogsContent.textContent = 'Error Loading Logs';
            const noLogsDesc = this.noLogs.querySelector('p');
            if (noLogsDesc) {
                noLogsDesc.textContent = message;
            }
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.loggerDashboard = new LoggerDashboard();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (window.loggerDashboard) {        if (document.hidden) {
            window.loggerDashboard.stopAutoRefresh();
        } else {
            window.loggerDashboard.startAutoRefresh();
        }
    }
});
