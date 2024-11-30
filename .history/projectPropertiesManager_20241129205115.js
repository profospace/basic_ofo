// projectPropertiesManager.js

(function () {
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

        init() {
            console.log('ProjectPropertiesManager init called');
            
            console.log('Testing element connections:');
console.log('availablePropertiesList exists:', !!document.getElementById('availablePropertiesList'));
console.log('connectedPropertiesList exists:', !!document.getElementById('connectedPropertiesList'));

// Also test query selectors:
console.log('Available list (querySelector):', !!document.querySelector(ProjectPropertiesManager.config.selectors.availableList));
console.log('Connected list (querySelector):', !!document.querySelector(ProjectPropertiesManager.config.selectors.connectedList));
            // Debug check for elements
            const searchInput = document.querySelector(this.config.selectors.searchInput);
            console.log('Search input found:', !!searchInput);
            
            const projectSelector = document.querySelector(this.config.selectors.projectSelector);
            console.log('Project selector found:', !!projectSelector);
            
            // Try to make an API call immediately
            this.testApiConnection();
            
            this.attachEventListeners();
            this.loadProjects();
        },
        

        async testApiConnection() {
            try {
                console.log('Testing API connection...');
                const response = await fetch(`${this.config.apiBaseUrl}/projects`);
                console.log('API test response:', response);
                const data = await response.json();
                console.log('API test data:', data);
            } catch (error) {
                console.error('API test failed:', error);
            }
        },

        // Event listeners
        attachEventListeners() {
            document.querySelector(this.config.selectors.searchInput)
                ?.addEventListener('input', (e) => this.handlePropertySearch(e));

            document.querySelector(this.config.selectors.projectSelector)
                ?.addEventListener('change', (e) => this.handleProjectSelection(e));
        },

        // Add this at the start of loadProjects method
        async loadProjects() {
            console.log('Loading projects...');
            try {
                const response = await fetch(`${this.config.apiBaseUrl}/projects`);
                console.log('Projects response:', response);
                const projects = await response.json();
                console.log('Projects loaded:', projects);
                this.populateProjectSelector(projects);
            } catch (error) {
                console.error('Error loading projects:', error);
                showPopup('Failed to load projects');
            }
        },

        showLoading() {
            [this.config.selectors.availableList, this.config.selectors.connectedList].forEach(selector => {
                const container = document.querySelector(selector);
                if (container) {
                    container.innerHTML = '<div class="loading">Loading properties...</div>';
                }
            });
        },

        showError(message) {
            [this.config.selectors.availableList, this.config.selectors.connectedList].forEach(selector => {
                const container = document.querySelector(selector);
                if (container) {
                    container.innerHTML = `<div class="error-state">${message}</div>`;
                }
            });
        },

    async loadAvailableProperties() {
            try {
                const response = await fetch(`${this.config.apiBaseUrl}/properties/all`);
                if (!response.ok) throw new Error('Failed to fetch available properties');

                const properties = await response.json();
                this.state.availableProperties = properties.filter(property =>
                    !property.projectId
                );
                this.displayAvailableProperties();
            } catch (error) {
                console.error('Error loading available properties:', error);
                showPopup('Failed to load available properties');
            }
        },

        async loadConnectedProperties() {
            if (!this.state.selectedProjectId) return;

            try {
                const response = await fetch(`${this.config.apiBaseUrl}/projects/${this.state.selectedProjectId}/properties`);
                if (!response.ok) throw new Error('Failed to fetch connected properties');

                const properties = await response.json();
                this.state.connectedProperties = properties;
                this.displayConnectedProperties();
            } catch (error) {
                console.error('Error loading connected properties:', error);
                showPopup('Failed to load connected properties');
            }
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


    console.log('ProjectPropertiesManager loaded:', !!window.ProjectPropertiesManager);

// Add a global error handler for fetch
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

    // Make it globally available
    window.ProjectPropertiesManager = ProjectPropertiesManager;

    // Add this to log when the script loads
    console.log('ProjectPropertiesManager script loaded');
})();
