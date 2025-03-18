import "./styles/notifications.css";

class NotificationManager {
    constructor() {
        this.container = null;
        this.notifications = [];
        this.maxNotifications = 5;
        this.position = "bottom-right"; // top-left, top-right, bottom-left, bottom-right
        this.defaultDuration = 3000; // 3 seconds
        this.initialized = false;
        this.animationDuration = 300; // ms
    }

    initialize() {
        if (this.initialized) return;
        
        // Create container
        this.container = document.createElement("div");
        this.container.className = `notification-container ${this.position}`;
        document.body.appendChild(this.container);
        
        // Handle theme properties from document
        this.updateThemeFromDocument();
        
        this.initialized = true;
    }
    
    updateThemeFromDocument() {
        // Read theme variables from document if available
        const computedStyle = getComputedStyle(document.documentElement);
        
        // Map of CSS variables to check and use in our notifications
        const cssVars = [
            'trollium-accent-color',
            'button-color',
            'panel-bg',
            'text-color',
            'border-radius',
            'shadow-color',
            'spring-easing',
            'standard-easing'
        ];
        
        // Create notification theme CSS variables
        cssVars.forEach(varName => {
            const value = computedStyle.getPropertyValue(`--${varName}`);
            if (value) {
                this.container.style.setProperty(`--${varName}`, value);
            }
        });
    }

    /**
     * Show a notification
     * @param {Object} options - Notification options
     * @param {string} options.title - Notification title
     * @param {string} options.message - Notification message
     * @param {string} options.type - Notification type: 'info', 'success', 'warning', 'error'
     * @param {number} options.duration - Duration in milliseconds before auto-close
     * @param {boolean} options.closable - Whether the notification can be closed manually
     * @returns {Object} - The notification object
     */
    show(options = {}) {
        if (!this.initialized) {
            this.initialize();
        }
        
        const notification = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            title: options.title || '',
            message: options.message || '',
            type: options.type || 'info',
            duration: options.duration !== undefined ? options.duration : this.defaultDuration,
            closable: options.closable !== undefined ? options.closable : true,
            element: null,
            timeoutId: null
        };
        
        // Create the notification element
        const element = document.createElement("div");
        element.className = `notification notification-${notification.type}`;
        element.setAttribute("data-id", notification.id);
        element.innerHTML = `
            <div class="notification-icon"></div>
            <div class="notification-content">
                ${notification.title ? `<div class="notification-title">${notification.title}</div>` : ''}
                ${notification.message ? `<div class="notification-message">${notification.message}</div>` : ''}
            </div>
            ${notification.closable ? `<div class="notification-close"></div>` : ''}
        `;
        
        // Add close button handler
        if (notification.closable) {
            const closeButton = element.querySelector(".notification-close");
            closeButton.addEventListener("click", () => {
                this.dismiss(notification.id);
            });
        }
        
        // Add entire notification click handler
        element.addEventListener("click", (event) => {
            // Only dismiss when clicked outside close button
            if (!event.target.classList.contains("notification-close")) {
                this.dismiss(notification.id);
            }
        });
        
        // Set auto-dismiss timeout if duration > 0
        if (notification.duration > 0) {
            notification.timeoutId = setTimeout(() => {
                this.dismiss(notification.id);
            }, notification.duration);
        }
        
        // Store the element reference
        notification.element = element;
        
        // Add to our active notifications
        this.notifications.push(notification);
        
        // Manage max notifications (remove oldest if too many)
        if (this.notifications.length > this.maxNotifications) {
            const oldest = this.notifications.shift();
            if (oldest && oldest.element && oldest.element.parentNode) {
                this.animateOut(oldest.element);
                clearTimeout(oldest.timeoutId);
            }
        }
        
        // Add to DOM with animation
        this.container.appendChild(element);
        
        // Trigger enter animation
        setTimeout(() => {
            element.classList.add("notification-show");
        }, 10);
        
        return notification;
    }
    
    /**
     * Dismiss a notification by its ID
     * @param {string} id - The notification's ID
     */
    dismiss(id) {
        const index = this.notifications.findIndex(n => n.id === id);
        if (index !== -1) {
            const notification = this.notifications[index];
            
            // Clear timeout if exists
            if (notification.timeoutId) {
                clearTimeout(notification.timeoutId);
            }
            
            // Remove from DOM with animation
            this.animateOut(notification.element);
            
            // Remove from our array
            this.notifications.splice(index, 1);
        }
    }
    
    /**
     * Clear all notifications
     */
    clearAll() {
        // Clear all timeouts
        this.notifications.forEach(notification => {
            if (notification.timeoutId) {
                clearTimeout(notification.timeoutId);
            }
            this.animateOut(notification.element);
        });
        
        // Clear the array
        this.notifications = [];
    }
    
    /**
     * Animate out a notification element
     * @param {HTMLElement} element - The notification element to animate out
     */
    animateOut(element) {
        element.classList.add("notification-hide");
        
        // Remove element after animation completes
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }, this.animationDuration);
    }
    
    /**
     * Show an information notification
     * @param {string} message - The notification message
     * @param {string} title - The notification title (optional) 
     * @param {number} duration - Duration in milliseconds (optional)
     */
    info(message, title, duration) {
        return this.show({ title, message, type: 'info', duration });
    }
    
    /**
     * Show a success notification
     * @param {string} message - The notification message 
     * @param {string} title - The notification title (optional)
     * @param {number} duration - Duration in milliseconds (optional) 
     */
    success(message, title, duration) {
        return this.show({ title, message, type: 'success', duration });
    }
    
    /**
     * Show a warning notification
     * @param {string} message - The notification message
     * @param {string} title - The notification title (optional)
     * @param {number} duration - Duration in milliseconds (optional)
     */
    warning(message, title, duration) {
        return this.show({ title, message, type: 'warning', duration });
    }
    
    /**
     * Show an error notification
     * @param {string} message - The notification message
     * @param {string} title - The notification title (optional)
     * @param {number} duration - Duration in milliseconds (optional)
     */
    error(message, title, duration) {
        return this.show({ title, message, type: 'error', duration });
    }
    
    /**
     * Change the position of the notification container
     * @param {string} position - One of: 'top-left', 'top-right', 'bottom-left', 'bottom-right'
     */
    setPosition(position) {
        if (!this.container) return;
        
        const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
        if (!validPositions.includes(position)) return;
        
        // Remove old position class
        this.container.classList.remove(this.position);
        
        // Add new position class
        this.position = position;
        this.container.classList.add(position);
    }
    
    /**
     * Set the maximum number of notifications shown at once
     * @param {number} max - Maximum number of notifications
     */
    setMaxNotifications(max) {
        if (typeof max === 'number' && max > 0) {
            this.maxNotifications = max;
        }
    }
    
    /**
     * Set the default duration for notifications
     * @param {number} duration - Duration in milliseconds
     */
    setDefaultDuration(duration) {
        if (typeof duration === 'number' && duration >= 0) {
            this.defaultDuration = duration;
        }
    }
}

// Export singleton instance
const notificationManager = new NotificationManager();
export default notificationManager; 