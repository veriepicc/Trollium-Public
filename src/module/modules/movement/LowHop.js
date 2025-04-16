import Module from "../../module";
import hooks from "../../../hooks";
import gameUtils from "../../../utils/gameUtils";

export default class LowHop extends Module {
    constructor () {
        super("LowHop", "Hop low.", "Movement", {
            "Height": 0.5
        })
    }

    get playerMovement () {
        return hooks.noa.ents.getMovement(hooks.noa.playerEntity);
    }

    onGameTick () {
        gameUtils.freezeValue(this.playerMovement, "_beenOnSolidGroundSinceBhopBounce", () => false);
        gameUtils.freezeValue(this.playerMovement, "_hadJumpInputPrevTick", () => false);
        gameUtils.freezeValue(this.playerMovement, "_flying", () => false);
        gameUtils.freezeValue(hooks.noa.inputs.state, "sprint", () => true);
        gameUtils.freezeValue(hooks.noa.inputs.state, "jump", () => true);
    }

    beforePhysicsTick() {
        if(hooks.noa.physics.bodies[0].velocity[1] >= parseFloat(this.options["Height"])) {
            hooks.noa.physics.bodies[0].velocity[1] = 0;
        }
    }

    onDisable () {
        gameUtils.unfreezeValue(this.playerMovement, "_beenOnSolidGroundSinceBhopBounce", false);
        gameUtils.unfreezeValue(this.playerMovement, "_hadJumpInputPrevTick", false);
        gameUtils.unfreezeValue(this.playerMovement, "_flying", false);
        gameUtils.unfreezeValue(hooks.noa.inputs.state, "sprint", false);
        gameUtils.unfreezeValue(hooks.noa.inputs.state, "jump", false);
    }
} 