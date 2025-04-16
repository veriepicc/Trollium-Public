import Module from "../../module";
import hooks from "../../../hooks";

export default class Speed extends Module {
    constructor () {
        super("Speed", "Change your speed.", "Movement", {
            "Strafe amount": 0.5,
            "Speed": 9.5
        })
    }

    getInputDirection() {
        return [
            hooks.noa.inputs.state.right - hooks.noa.inputs.state.left, 
            hooks.noa.inputs.state.backward - hooks.noa.inputs.state.forward
        ];
    }

    getFinalMovement(speed) {
        const yaw = hooks.noa.camera.heading;
        const InputDir = this.getInputDirection();
        const totaldirs = Math.sqrt(Math.abs(InputDir[0]) + Math.abs(InputDir[1]));
        if (totaldirs == 0) {
            return [0, 0];
        }
        const finalx = Math.cos(yaw) * InputDir[0] + Math.cos(yaw + (90*Math.PI/180)) * InputDir[1];
        const finalz = -Math.sin(yaw) * InputDir[0] + -Math.sin(yaw + (90*Math.PI/180)) * InputDir[1];
        return [finalx / totaldirs * speed, finalz / totaldirs * speed];
    }

    beforePhysicsTick() {
        const strength = this.options["Strafe amount"];
        const extraVelo = this.getFinalMovement(this.options["Speed"]);
        hooks.noa.physics.bodies[0].velocity = [
            hooks.noa.physics.bodies[0].velocity[0]*(1-strength)+extraVelo[0]*strength,
            hooks.noa.physics.bodies[0].velocity[1],
            hooks.noa.physics.bodies[0].velocity[2]*(1-strength)+extraVelo[1]*strength
        ];
    }
};