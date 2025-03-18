import Module from "../../module.js";
import hooks from "../../../hooks.js";
import gameUtils from "../../../utils/gameUtils.js";
import notificationManager from "../../../notifications/notificationManager.js";

export default class Scaffold extends Module {
    constructor() {
        super("Scaffold", "Places blocks under you while walking or running.", "Movement", {
            "Y Lock": false,
            "Smart Diagonal": true,
            "Jump Assist": true,
            "Conservative Mode": true
        }, "KeyC")
        this.yPosOnEnable = 0;
        this.noBlocksNotified = false;
        this.placedPositions = new Set();
        this.lastVelocity = [0, 0, 0];
        this.lookAheadFactor = 0.3;
        this.edgeThreshold = 0.2;
        this.blockPlacementCooldown = 100;
        this.lastPlayerPos = null;
        this.movementHistory = [];
    }

    get inventory() {
        return hooks.noa.ents.getInventoryState(hooks.noa.playerEntity);
    }

    get heldItem() {
        return this.inventory.inventory.items.find(item => item?.typeObj.type == "CubeBlock") || null;
    }

    place(blockPos) {
        let placementPos = [...blockPos];
        
        if (this.options["Y Lock"] === true || this.options["Y Lock"] === "true") {
            placementPos[1] = this.yPosOnEnable;
        }
        
        const posKey = placementPos.join(',');
        
        if (this.placedPositions.has(posKey) || 
            hooks.noa.registry.getBlockSolidity(hooks.noa.bloxd.getBlock(...placementPos))) {
            return false;
        }

        if (!this.heldItem) {
            if (!this.noBlocksNotified) {
                notificationManager.warning("Out of blocks", "Scaffold", 2000);
                this.noBlocksNotified = true;
            }
            return false;
        }
        
        this.noBlocksNotified = false;

        let heldItemIndex = this.inventory.inventory.items.findIndex(item => item?.typeObj.type == "CubeBlock");
        gameUtils.selectInventorySlot(heldItemIndex);

        if (!this.heldItem?.typeObj.id) return false;
        
        gameUtils.placeBlock(placementPos, this.heldItem);
        this.placedPositions.add(posKey);
        
        setTimeout(() => {
            this.placedPositions.delete(posKey);
        }, this.blockPlacementCooldown);

        return true;
    }

    onEnable() {
        let physicsBody = hooks.noa.entities.getPhysicsBody(hooks.noa.playerEntity);
        gameUtils.freezeValue(physicsBody, "preventFallOffEdge", true);
        
        const playerPos = hooks.noa.ents.getPositionData(hooks.noa.playerEntity).position;
        this.yPosOnEnable = Math.floor(playerPos[1]) - 1;
        
        this.noBlocksNotified = false;
        this.placedPositions.clear();
        this.lastPlayerPos = null;
        this.movementHistory = [];
        
        if (this.options["Y Lock"] === true || this.options["Y Lock"] === "true") {
            notificationManager.info(`Y-Lock enabled at level ${this.yPosOnEnable}`, "Scaffold", 2000);
        }
    }

    onSettingUpdate() {
        if (this.options["Y Lock"] === true || this.options["Y Lock"] === "true") {
            const playerPos = hooks.noa.ents.getPositionData(hooks.noa.playerEntity).position;
            this.yPosOnEnable = Math.floor(playerPos[1]) - 1;
            notificationManager.info(`Y-Lock enabled at level ${this.yPosOnEnable}`, "Scaffold", 2000);
        }
    }

    onGameTick() {
        const physicsBody = hooks.noa.entities.getPhysicsBody(hooks.noa.playerEntity);
        const playerPos = hooks.noa.ents.getPositionData(hooks.noa.playerEntity).position;
        const velocity = physicsBody.velocity;
        
        this.updateMovementHistory(playerPos);
        
        const avgVelocity = this.calculateAverageVelocity();
        
        const inputState = hooks.noa.inputs.state;
        const isMovingX = Math.abs(avgVelocity[0]) > 0.01 || inputState.left || inputState.right;
        const isMovingZ = Math.abs(avgVelocity[2]) > 0.01 || inputState.forward || inputState.backward;
        const isMoving = isMovingX || isMovingZ;
        const isJumping = inputState.jump;
        
        const baseBlockPos = [
            Math.floor(playerPos[0]), 
            Math.floor(playerPos[1]) - 1, 
            Math.floor(playerPos[2])
        ];
        
        this.place(baseBlockPos);
        
        if (!isMoving) {
            const yLockEnabled = this.options["Y Lock"] === true || this.options["Y Lock"] === "true";
            const jumpAssistEnabled = this.options["Jump Assist"] === true || this.options["Jump Assist"] === "true";
            
            if (isJumping && !yLockEnabled && jumpAssistEnabled) {
                this.place(baseBlockPos);
                physicsBody.velocity[1] = hooks.noa.serverSettings.jumpAmount;
            }
            return;
        }
        
        this.placeBlocksInMovementDirection(playerPos, avgVelocity, baseBlockPos, isJumping);
        
        this.lastVelocity = [...velocity];
    }
    
    updateMovementHistory(playerPos) {
        if (this.lastPlayerPos) {
            const movement = [
                playerPos[0] - this.lastPlayerPos[0],
                playerPos[1] - this.lastPlayerPos[1],
                playerPos[2] - this.lastPlayerPos[2]
            ];
            this.movementHistory.unshift(movement);
            if (this.movementHistory.length > 5) this.movementHistory.pop();
        }
        this.lastPlayerPos = [...playerPos];
    }
    
    calculateAverageVelocity() {
        const avgVelocity = [0, 0, 0];
        if (this.movementHistory.length > 0) {
            for (const move of this.movementHistory) {
                avgVelocity[0] += move[0];
                avgVelocity[1] += move[1];
                avgVelocity[2] += move[2];
            }
            avgVelocity[0] /= this.movementHistory.length;
            avgVelocity[1] /= this.movementHistory.length;
            avgVelocity[2] /= this.movementHistory.length;
        }
        return avgVelocity;
    }
    
    placeBlocksInMovementDirection(playerPos, avgVelocity, baseBlockPos, isJumping) {
        const lookAheadX = avgVelocity[0] * this.lookAheadFactor;
        const lookAheadZ = avgVelocity[2] * this.lookAheadFactor;
        
        const predictedX = playerPos[0] + lookAheadX;
        const predictedZ = playerPos[2] + lookAheadZ;
        
        const dirX = Math.sign(avgVelocity[0] || 
            (hooks.noa.inputs.state.right ? 1 : hooks.noa.inputs.state.left ? -1 : 0));
        const dirZ = Math.sign(avgVelocity[2] || 
            (hooks.noa.inputs.state.backward ? 1 : hooks.noa.inputs.state.forward ? -1 : 0));
        
        const fracX = predictedX - Math.floor(predictedX);
        const fracZ = predictedZ - Math.floor(predictedZ);
        
        const nearEdgeX = (dirX > 0 && fracX > (1 - this.edgeThreshold)) || 
                          (dirX < 0 && fracX < this.edgeThreshold);
        const nearEdgeZ = (dirZ > 0 && fracZ > (1 - this.edgeThreshold)) || 
                          (dirZ < 0 && fracZ < this.edgeThreshold);
        
        const lookAheadBlockPos = [
            Math.floor(predictedX),
            baseBlockPos[1],
            Math.floor(predictedZ)
        ];
        
        const isDifferentBlock = lookAheadBlockPos[0] !== baseBlockPos[0] || lookAheadBlockPos[2] !== baseBlockPos[2];
        const conservativeModeEnabled = this.options["Conservative Mode"] === true || this.options["Conservative Mode"] === "true";
        
        if (isDifferentBlock) {
            if (!conservativeModeEnabled || (nearEdgeX || nearEdgeZ)) {
                this.place(lookAheadBlockPos);
            }
        }
        
        const smartDiagonalEnabled = this.options["Smart Diagonal"] === true || this.options["Smart Diagonal"] === "true";
        const jumpAssistEnabled = this.options["Jump Assist"] === true || this.options["Jump Assist"] === "true";
        const yLockEnabled = this.options["Y Lock"] === true || this.options["Y Lock"] === "true";
        
        if (Math.abs(dirX) > 0 && Math.abs(dirZ) > 0 && smartDiagonalEnabled) {
            if (conservativeModeEnabled) {
                if (nearEdgeX) {
                    this.place([baseBlockPos[0] + dirX, baseBlockPos[1], baseBlockPos[2]]);
                }
                
                if (nearEdgeZ) {
                    this.place([baseBlockPos[0], baseBlockPos[1], baseBlockPos[2] + dirZ]);
                }
                
                if (nearEdgeX && nearEdgeZ) {
                    this.place([baseBlockPos[0] + dirX, baseBlockPos[1], baseBlockPos[2] + dirZ]);
                    
                    if (isJumping && jumpAssistEnabled && !yLockEnabled) {
                        this.place([baseBlockPos[0] + dirX * 2, baseBlockPos[1], baseBlockPos[2] + dirZ]);
                    }
                }
            } else {
                this.place([baseBlockPos[0] + dirX, baseBlockPos[1], baseBlockPos[2]]);
                this.place([baseBlockPos[0], baseBlockPos[1], baseBlockPos[2] + dirZ]);
                this.place([baseBlockPos[0] + dirX, baseBlockPos[1], baseBlockPos[2] + dirZ]);
                
                if (isJumping && jumpAssistEnabled && !yLockEnabled) {
                    this.place([baseBlockPos[0] + dirX * 2, baseBlockPos[1], baseBlockPos[2] + dirZ]);
                    this.place([baseBlockPos[0] + dirX, baseBlockPos[1], baseBlockPos[2] + dirZ * 2]);
                }
            }
        } else {
            if (nearEdgeX) {
                this.place([baseBlockPos[0] + dirX, baseBlockPos[1], baseBlockPos[2]]);
            }
            
            if (nearEdgeZ) {
                this.place([baseBlockPos[0], baseBlockPos[1], baseBlockPos[2] + dirZ]);
            }
        }
    }

    onDisable() {
        let physicsBody = hooks.noa.entities.getPhysicsBody(hooks.noa.playerEntity);
        gameUtils.unfreezeValue(physicsBody, "preventFallOffEdge");
        this.noBlocksNotified = false;
        this.placedPositions.clear();
    }
}