// projectPropertiesManager.js


document.addEventListener('DOMContentLoaded', () => {
    // This ensures the tab handler is properly set up
    const projectTab = document.querySelector('button[onclick="openTab(event, \'ProjectPropertiesTab\')"]');
    if (projectTab) {
        projectTab.addEventListener('click', () => {
            console.log('Project tab clicked');
            ProjectPropertiesManager.init();
        });
    }
});

const ProjectPropertiesManager = {
    // State variables
    state: {
        selectedProjectId: null,
        availableProperties: [],
        connectedProperties: []
    },

    // Configuration
    config: {
        apiBaseUrl: 'https://propertify.onrender.com/api',
        selectors: {
            projectSelector: '#projectSelector',
            searchInput: '#projectPropertySearch',
            availableList: '#availablePropertiesList',
            connectedList: '#connectedPropertiesList'
        }
    },

    // Initialization
    init() {
        console.log('Initializing project properties manager');
        this.attachEventListeners();
        this.loadProjects();
    },


    // Event listeners
    attachEventListeners() {
        document.querySelector(this.config.selectors.searchInput)
            ?.addEventListener('input', (e) => this.handlePropertySearch(e));
        
        document.querySelector(this.config.selectors.projectSelector)
            ?.addEventListener('change', (e) => this.handleProjectSelection(e));
    },

    // API calls
    async loadProjects() {
        try {
            const response = await fetch(`${this.config.apiBaseUrl}/projects`);
            const projects = await response.json();
            this.populateProjectSelector(projects);
        } catch (error) {
            console.error('Error loading projects:', error);
            showPopup('Failed to load projects');
        }
    },

    async loadAvailableProperties() {
        const response = await fetch(`${this.config.apiBaseUrl}/properties/all`);
        const properties = await response.json();
        this.state.availableProperties = properties.filter(property => 
            !property.project || property.project !== this.state.selectedProjectId
        );
        this.displayAvailableProperties();
    },

    async loadConnectedProperties() {
        const response = await fetch(`${this.config.apiBaseUrl}/projects/${this.state.selectedProjectId}/properties`);
        const properties = await response.json();
        this.state.connectedProperties = properties;
        this.displayConnectedProperties();
    },

    // UI Updates
    populateProjectSelector(projects) {
        const selector = document.querySelector(this.config.selectors.projectSelector);
        if (!selector) return;

        selector.innerHTML = '<option value="">Select Project</option>';
        projects.forEach(project => {
            const option = document.createElement('option');
            option.value = project._id;
            option.textContent = project.name;
            selector.appendChild(option);
        });
    },

    createPropertyElement(property, isAvailable) {
        const div = document.createElement('div');
        div.className = 'property-item';
        div.innerHTML = `
            <div class="property-details">
                <div class="property-title">${property.post_title}</div>
                <div class="property-info">
                    ID: ${property.post_id} | Type: ${property.type_name} | 
                    Price: ₹${property.price?.toLocaleString() || 'N/A'}
                </div>
            </div>
            <button onclick="ProjectPropertiesManager.${isAvailable ? 'connectProperty' : 'disconnectProperty'}('${property.post_id}')" 
                    class="${isAvailable ? 'connect-button' : 'disconnect-button'}">
                ${isAvailable ? 'Connect' : 'Disconnect'}
            </button>
        `;
        return div;
    },

    displayAvailableProperties() {
        const container = document.querySelector(this.config.selectors.availableList);
        if (!container) return;

        container.innerHTML = '';
        
        if (this.state.availableProperties.length === 0) {
            container.innerHTML = '<div class="empty-state">No available properties</div>';
            return;
        }

        this.state.availableProperties.forEach(property => {
            container.appendChild(this.createPropertyElement(property, true));
        });
    },

    displayConnectedProperties() {
        const container = document.querySelector(this.config.selectors.connectedList);
        if (!container) return;

        container.innerHTML = '';
        
        if (this.state.connectedProperties.length === 0) {
            container.innerHTML = '<div class="empty-state">No connected properties</div>';
            return;
        }

        this.state.connectedProperties.forEach(property => {
            container.appendChild(this.createPropertyElement(property, false));
        });
    },

    // Event Handlers
    async handleProjectSelection(event) {
        this.state.selectedProjectId = event.target.value;
        if (!this.state.selectedProjectId) {
            this.clearPropertyLists();
            return;
        }

        this.showLoading();
        try {
            await Promise.all([
                this.loadAvailableProperties(),
                this.loadConnectedProperties()
            ]);
        } catch (error) {
            console.error('Error loading properties:', error);
            showPopup('Error loading properties');
        }
        this.hideLoading();
    },

    handlePropertySearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        
        const filteredAvailable = this.state.availableProperties.filter(property =>
            property.post_title.toLowerCase().includes(searchTerm) ||
            property.post_id.toLowerCase().includes(searchTerm)
        );

        const filteredConnected = this.state.connectedProperties.filter(property =>
            property.post_title.toLowerCase().includes(searchTerm) ||
            property.post_id.toLowerCase().includes(searchTerm)
        );

        this.displayFilteredProperties(filteredAvailable, filteredConnected);
    },

    // Property Connection Methods
    async connectProperty(propertyId) {
        if (!this.state.selectedProjectId) {
            showPopup('Please select a project first');
            return;
        }

        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}/projects/${this.state.selectedProjectId}/properties/${propertyId}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }
            );

            if (!response.ok) throw new Error('Failed to connect property');

            showPopup('Property connected successfully');
            await Promise.all([
                this.loadAvailableProperties(),
                this.loadConnectedProperties()
            ]);
        } catch (error) {
            console.error('Error connecting property:', error);
            showPopup('Failed to connect property');
        }
    },

    async disconnectProperty(propertyId) {
        if (!this.state.selectedProjectId) {
            showPopup('Please select a project first');
            return;
        }

        try {
            const response = await fetch(
                `${this.config.apiBaseUrl}/projects/${this.state.selectedProjectId}/properties/${propertyId}`,
                { method: 'DELETE' }
            );

            if (!response.ok) throw new Error('Failed to disconnect property');

            showPopup('Property disconnected successfully');
            await Promise.all([
                this.loadAvailableProperties(),
                this.loadConnectedProperties()
            ]);
        } catch (error) {
            console.error('Error disconnecting property:', error);
            showPopup('Failed to disconnect property');
        }
    },

    // Utility Methods
    showLoading() {
        [this.config.selectors.availableList, this.config.selectors.connectedList]
            .forEach(selector => {
                const container = document.querySelector(selector);
                if (container) {
                    container.innerHTML = '<div class="loading">Loading...</div>';
                }
            });
    },

    hideLoading() {
        // Loading will be hidden when properties are displayed
    },

    clearPropertyLists() {
        [this.config.selectors.availableList, this.config.selectors.connectedList]
            .forEach(selector => {
                const container = document.querySelector(selector);
                if (container) {
                    container.innerHTML = '';
                }
            });
    },

    displayFilteredProperties(availableFiltered, connectedFiltered) {
        const availableContainer = document.querySelector(this.config.selectors.availableList);
        const connectedContainer = document.querySelector(this.config.selectors.connectedList);

        if (availableContainer) {
            availableContainer.innerHTML = '';
            availableFiltered.forEach(property => {
                availableContainer.appendChild(this.createPropertyElement(property, true));
            });
        }

        if (connectedContainer) {
            connectedContainer.innerHTML = '';
            connectedFiltered.forEach(property => {
                connectedContainer.appendChild(this.createPropertyElement(property, false));
            });
        }
    }
};



// Export the manager
window.ProjectPropertiesManager = ProjectPropertiesManager;