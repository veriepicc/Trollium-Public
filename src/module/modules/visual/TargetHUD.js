import Module from "../../module";
import hooks from "../../../hooks";
import gameUtils from "../../../utils/gameUtils";
import mathUtils from "../../../utils/mathUtils";
import "./styles/targethud.css";

export default class TargetHUD extends Module {
    constructor() {
        super("TargetHUD", "Displays information about your current target.", "Visual", {
            "Scale": 1.0,
            "X Position": 994,
            "Y Position": 516,
            "Enable Animations": true,
            "Display Time": 2000
        });
        
        this.targetHUDElement = null;
        this.currentTarget = null;
        this.lastTargetTime = 0;
        this.fadeOutTimeout = null;
        this.currentDistance = 0;
    }

    onSettingUpdate() {
        if (!this.targetHUDElement) return;
        
        this.targetHUDElement.style.transform = `translateX(-50%) scale(${this.options["Scale"]})`;
        this.targetHUDElement.style.left = `${this.options["X Position"]}px`;
        this.targetHUDElement.style.top = `${this.options["Y Position"]}px`;
        
        const animationsEnabled = this.options["Enable Animations"] === true || this.options["Enable Animations"] === "true";
        this.targetHUDElement.classList.toggle("targethud-no-animations", !animationsEnabled);
    }

    createTargetHUD() {
        this.targetHUDElement = document.createElement("div");
        this.targetHUDElement.className = "targethud-container";
        this.targetHUDElement.style.left = `${this.options["X Position"]}px`;
        this.targetHUDElement.style.top = `${this.options["Y Position"]}px`;
        this.targetHUDElement.style.transform = `translateX(-50%) scale(${this.options["Scale"]})`;
        
        const animationsEnabled = this.options["Enable Animations"] === true || this.options["Enable Animations"] === "true";
        if (!animationsEnabled) {
            this.targetHUDElement.classList.add("targethud-no-animations");
        }
        
        this.setupDragging();
        
        const content = document.createElement("div");
        content.className = "targethud-content";
        
        const playerName = document.createElement("div");
        playerName.className = "targethud-player-name";
        playerName.textContent = "No Target";
        content.appendChild(playerName);
        
        const distanceElement = document.createElement("div");
        distanceElement.className = "targethud-distance";
        distanceElement.textContent = "0.0";
        content.appendChild(distanceElement);
        
        const healthContainer = document.createElement("div");
        healthContainer.className = "targethud-health-container";
        
        const healthBar = document.createElement("div");
        healthBar.className = "targethud-health-bar";
        healthContainer.appendChild(healthBar);
        
        content.appendChild(healthContainer);
        this.targetHUDElement.appendChild(content);
        
        document.body.appendChild(this.targetHUDElement);
        this.targetHUDElement.classList.add("targethud-hidden");
        
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleResize() {
        if (this.options["X Position"] === window.innerWidth / 2 + 150 && this.targetHUDElement) {
            this.options["X Position"] = window.innerWidth / 2 + 150;
            this.targetHUDElement.style.left = `${this.options["X Position"]}px`;
        }
    }

    setupDragging() {
        let isDragging = false;
        let startX, startY;
        let startLeft, startTop;
        
        this.targetHUDElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            startLeft = parseInt(this.targetHUDElement.style.left) || this.options["X Position"];
            startTop = parseInt(this.targetHUDElement.style.top) || this.options["Y Position"];
            
            e.preventDefault();
            
            this.targetHUDElement.classList.add('dragging');
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const newLeft = startLeft + (e.clientX - startX);
            const newTop = startTop + (e.clientY - startY);
            
            this.targetHUDElement.style.left = `${newLeft}px`;
            this.targetHUDElement.style.top = `${newTop}px`;
            
            this.options["X Position"] = newLeft;
            this.options["Y Position"] = newTop;
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                this.targetHUDElement.classList.remove('dragging');
            }
        });
        
        document.addEventListener('mouseleave', () => {
            if (isDragging) {
                isDragging = false;
                this.targetHUDElement.classList.remove('dragging');
            }
        });
    }

    updateTargetInfo(target, distance) {
        if (!this.targetHUDElement) return;
        
        const playerName = this.targetHUDElement.querySelector('.targethud-player-name');
        const distanceElement = this.targetHUDElement.querySelector('.targethud-distance');
        const healthBar = this.targetHUDElement.querySelector('.targethud-health-bar');
        
        if (target) {
            const targetName = gameUtils.getPlayerName(target);
            playerName.textContent = targetName || "Unknown";
            
            const formattedDistance = distance.toFixed(1);
            distanceElement.textContent = formattedDistance;
            
            healthBar.style.width = "100%";
            
            this.targetHUDElement.classList.remove("targethud-hidden");
            this.lastTargetTime = Date.now();
            
            if (this.fadeOutTimeout) {
                clearTimeout(this.fadeOutTimeout);
                this.fadeOutTimeout = null;
            }
        } else {
            this.hideTargetHUD();
        }
    }
    
    hideTargetHUD() {
        if (!this.fadeOutTimeout && this.targetHUDElement && !this.targetHUDElement.classList.contains("targethud-hidden")) {
            this.fadeOutTimeout = setTimeout(() => {
                if (this.targetHUDElement) {
                    this.targetHUDElement.classList.add("targethud-hidden");
                    this.fadeOutTimeout = null;
                }
            }, 300);
        }
    }

    getClosestTarget() {
        let localPlayerPos = hooks.noa.ents.getPosition(hooks.noa.playerEntity);
        let playerList = gameUtils.getPlayerList();
        let closestPlayer = null;
        let closestDistance = Infinity;
        
        playerList.forEach((player) => {
            let targetPosition = hooks.noa.ents.getPosition(player);
            if (!targetPosition) return;
            
            let distance = parseFloat(mathUtils.distanceBetweenSqrt(localPlayerPos, targetPosition));
            let isAlive = gameUtils.isPlayerAlive(player);
            let canAttack = gameUtils.canAttackPlayer(player);
            let isBlacklisted = gameUtils.getPlayerName(player).toLowerCase().includes("faze_");
            
            if (distance <= 7 && isAlive && canAttack && !isBlacklisted && distance < closestDistance) {
                closestPlayer = player;
                closestDistance = distance;
            }
        });
        
        return { target: closestPlayer, distance: closestDistance };
    }

    onGameTick() {
        if (!this.targetHUDElement) return;
        
        const { target, distance } = this.getClosestTarget();
        
        if (target !== this.currentTarget || Math.abs(distance - this.currentDistance) > 0.1) {
            this.currentTarget = target;
            this.currentDistance = distance;
            
            if (target) {
                this.updateTargetInfo(target, distance);
            } else {
                this.hideTargetHUD();
            }
        }
    }

    onEnable() {
        this.createTargetHUD();
    }

    onDisable() {
        if (this.targetHUDElement && this.targetHUDElement.parentNode) {
            this.targetHUDElement.parentNode.removeChild(this.targetHUDElement);
            this.targetHUDElement = null;
        }
        
        if (this.fadeOutTimeout) {
            clearTimeout(this.fadeOutTimeout);
            this.fadeOutTimeout = null;
        }
        
        window.removeEventListener('resize', this.handleResize.bind(this));
    }
}; 