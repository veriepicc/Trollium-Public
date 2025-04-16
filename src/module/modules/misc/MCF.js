import Module from "../../module";
import hooks from "../../../hooks";
import gameUtils from "../../../utils/gameUtils";
import notificationManager from "../../../notifications/notificationManager";
import events from "../../../events";

export default class MCF extends Module {
    constructor() {
        super("MCF", "Middle-click on players to add/remove them as friends. Friends won't be targeted by Killaura.", "Misc", {
            "Friends": [],
            "Notification Duration": 2000
        });
        
        this.mouseMiddleListener = this.handleMiddleClick.bind(this);
    }

    onEnable() {
        document.addEventListener("mousedown", this.mouseMiddleListener);
    }

    onDisable() {
        document.removeEventListener("mousedown", this.mouseMiddleListener);
    }

    handleMiddleClick(event) {
        // Middle mouse button is 1
        if (event.button !== 1) return;

        // Make sure we're in game
        if (!hooks.noa || !hooks.noa.playerEntity) return;
        
        // Get the player the user is looking at
        const targetPlayer = this.getTargetedPlayer();
        if (!targetPlayer) return;
        
        const playerName = gameUtils.getPlayerName(targetPlayer);
        if (!playerName) return;
        
        // Add or remove from friends list
        if (this.isFriend(playerName)) {
            this.removeFriend(playerName);
            notificationManager.info(`Removed from friends list`, playerName, this.options["Notification Duration"]);
        } else {
            this.addFriend(playerName);
            notificationManager.success(`Added to friends list`, playerName, this.options["Notification Duration"]);
        }
        
        // Emit setting update event to save friends list
        events.emit("setting.update", this);
    }
    
    getTargetedPlayer() {
        // Get the player the user is looking at, within reasonable distance (10 blocks)
        const localPlayerPos = hooks.noa.ents.getPosition(hooks.noa.playerEntity);
        const playerList = gameUtils.getPlayerList();
        const localPlayerRotation = hooks.noa.camera.heading;
        const localPlayerPitch = hooks.noa.camera.pitch;
        
        let closestPlayer = null;
        let closestAngle = 0.3; // Maximum angle difference to consider (radians)
        
        for (const player of playerList) {
            const targetPos = hooks.noa.ents.getPosition(player);
            if (!targetPos) continue;
            
            // Calculate vector to player
            const dx = targetPos[0] - localPlayerPos[0];
            const dy = targetPos[1] - localPlayerPos[1];
            const dz = targetPos[2] - localPlayerPos[2];
            
            // Calculate distance
            const distance = Math.sqrt(dx*dx + dy*dy + dz*dz);
            if (distance > 10) continue; // Too far away
            
            // Calculate angles
            const horizontalAngle = Math.atan2(dx, dz);
            const verticalAngle = Math.atan2(dy, Math.sqrt(dx*dx + dz*dz));
            
            // Get angle difference
            let headingDiff = Math.abs(horizontalAngle - localPlayerRotation);
            if (headingDiff > Math.PI) headingDiff = 2 * Math.PI - headingDiff;
            
            const pitchDiff = Math.abs(verticalAngle - localPlayerPitch);
            
            // Use the larger angle difference
            const maxDiff = Math.max(headingDiff, pitchDiff);
            
            // Update closest player if this one is closer in angle
            if (maxDiff < closestAngle) {
                closestAngle = maxDiff;
                closestPlayer = player;
            }
        }
        
        return closestPlayer;
    }
    
    isFriend(playerName) {
        return this.options["Friends"] && this.options["Friends"].includes(playerName);
    }
    
    addFriend(playerName) {
        if (!this.options["Friends"]) {
            this.options["Friends"] = [];
        }
        
        if (!this.isFriend(playerName)) {
            this.options["Friends"].push(playerName);
        }
    }
    
    removeFriend(playerName) {
        if (!this.options["Friends"]) return;
        
        const index = this.options["Friends"].indexOf(playerName);
        if (index !== -1) {
            this.options["Friends"].splice(index, 1);
        }
    }
}; 