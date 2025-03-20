import configManager from "../config/manager";
import eventListener from "../events"

export default class Module {
    constructor(name, description, category, options, keybind, modes = {}) {
        this.name = name;
        this.description = description;
        this.category = category;
        this.options = options;
        this.keybind = configManager.config?.modules?.[name]?.keybind || keybind;
        this.waitingForBind = false;
        this.modes = modes; // Store available modes for each setting
        this.isEnabled = false;
        this.toggle = this.toggle.bind(this);
    }

    onEnable() {}
    onDisable() {}
    onGameTick() {}
    onRender() {}
    onGameEntered() {}
    onGameExited() {}
    onSettingUpdate() {}

    enable() {
        this.isEnabled = true;
        eventListener.emit("module.update", this);
        this.onEnable();
    }

    disable() {
        this.isEnabled = false;
        eventListener.emit("module.update", this);
        this.onDisable();
    }

    toggle() {
        if (this.isEnabled) {
            this.disable();
        } else {
            this.enable();
        }
    };
    
    // Set a specific mode for a setting
    setMode(setting, mode) {
        if (this.modes[setting] && this.modes[setting].includes(mode)) {
            this.options[setting] = mode;
            this.onSettingUpdate();
            eventListener.emit("setting.update", this);
            return true;
        }
        return false;
    }
    
    // Get current mode for a setting
    getMode(setting) {
        return this.options[setting];
    }
    
    // Get all available modes for a setting
    getModes(setting) {
        return this.modes[setting] || [];
    }
};