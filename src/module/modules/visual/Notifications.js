import Module from "../../module.js";
import notificationManager from "../../../notifications/notificationManager.js";
import events from "../../../events";

export default class Notifications extends Module {
    constructor() {
        super("Notifications", "Shows notifications for various events in the client.", "Visual", {
            "Position": ["bottom-right", "top-right", "top-left", "bottom-left"],
            "Max Notifications": 5,
            "Default Duration": 3000
        });
        
        // Flag to track first-time enable
        this.firstLoad = true;
        
        // Set up event listeners for module notifications
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for module toggle events to show notification
        events.on("module.update", (module) => {
            if (!this.isEnabled) return;
            
            // Don't show notification for the Notifications module itself
            if (module.name !== "Notifications") {
                if (module.isEnabled) {
                    notificationManager.info(`Module enabled`, module.name, 2000);
                } else {
                    notificationManager.info(`Module disabled`, module.name, 2000);
                }
            }
        });
    }
    
    onEnable() {
        // Initialize the notification manager
        notificationManager.initialize();
        
        // Update notification position from options
        notificationManager.setPosition(this.options["Position"]);
        
        // Update max notifications
        notificationManager.setMaxNotifications(this.options["Max Notifications"]);
        
        // Update default duration
        notificationManager.setDefaultDuration(this.options["Default Duration"]);
        
        if (this.firstLoad) {
            // Show first-time launch notification
            notificationManager.info("Injected Successfully!", "Trollium", 2000);
            this.firstLoad = false;
        } else {
            // Show regular notification
            notificationManager.info("Notification system enabled", "Notifications", 2000);
        }
    }
    
    onDisable() {
        // Clear all active notifications
        notificationManager.clearAll();
    }
    
    onSettingUpdate() {
        // Update notification position from options
        notificationManager.setPosition(this.options["Position"]);
        
        // Update max notifications
        notificationManager.setMaxNotifications(this.options["Max Notifications"]);
        
        // Update default duration
        notificationManager.setDefaultDuration(this.options["Default Duration"]);
    }
}; 