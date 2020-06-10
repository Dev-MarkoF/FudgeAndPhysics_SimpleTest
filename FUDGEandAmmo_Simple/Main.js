"use strict";
///<reference types="./Libraries/FudgeCore.js"/>
///<reference types="./Libraries/ammo.js"/>
Ammo().then(function (AmmoLib) {
    Ammo = AmmoLib;
});
var FudgePhysics_Communication;
(function (FudgePhysics_Communication) {
    var f = FudgeCore;
    window.addEventListener("load", init);
    const app = document.querySelector("canvas");
    let viewPort;
    let hierarchy;
    let fps;
    const times = [];
    let cubes = new Array();
    let fpsDisplay = document.querySelector("h2#FPS");
    let bodies = new Array();
    let world;
    let collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(), dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration), overlappingPairCache = new Ammo.btDbvtBroadphase(), solver = new Ammo.btSequentialImpulseConstraintSolver();
    world = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    world.setGravity(new Ammo.btVector3(0, -10, 0));
    function init(_event) {
        f.Debug.log(app);
        f.RenderManager.initialize();
        hierarchy = new f.Node("Scene");
        let ground = createCompleteMeshNode("Ground", new f.Material("Ground", f.ShaderFlat, new f.CoatColored(new f.Color(0.2, 0.2, 0.2, 1))), new f.MeshCube());
        let cmpGroundMesh = ground.getComponent(f.ComponentTransform);
        cmpGroundMesh.local.scale(new f.Vector3(20, 0.3, 20));
        hierarchy.appendChild(ground);
        cubes[0] = createCompleteMeshNode("Cube_1", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
        let cmpCubeTransform = cubes[0].getComponent(f.ComponentTransform);
        cmpCubeTransform.local.translate(new f.Vector3(0, 2, 0));
        cubes[0].mtxWorld.rotateX(45);
        hierarchy.appendChild(cubes[0]);
        cubes[1] = createCompleteMeshNode("Cube_2", new f.Material("Cube", f.ShaderFlat, new f.CoatColored(new f.Color(1, 0, 0, 1))), new f.MeshCube());
        let cmpCubeTransform2 = cubes[1].getComponent(f.ComponentTransform);
        cmpCubeTransform2.local.translate(new f.Vector3(0, 3.5, 0.4));
        hierarchy.appendChild(cubes[1]);
        let cmpLight = new f.ComponentLight(new f.LightDirectional(f.Color.CSS("WHITE")));
        cmpLight.pivot.lookAt(new f.Vector3(0.5, -1, -0.8));
        hierarchy.addComponent(cmpLight);
        let cmpCamera = new f.ComponentCamera();
        cmpCamera.backgroundColor = f.Color.CSS("GREY");
        cmpCamera.pivot.translate(new f.Vector3(2, 2, 10));
        cmpCamera.pivot.lookAt(f.Vector3.ZERO());
        //Physics Ammo
        world.setGravity(new Ammo.btVector3(0, -10, 0));
        initializePhysicsBody(ground.getComponent(f.ComponentTransform), 0, 0);
        initializePhysicsBody(cmpCubeTransform, 10, 1);
        initializePhysicsBody(cmpCubeTransform2, 10, 2);
        //EndPhysics
        viewPort = new f.Viewport();
        viewPort.initialize("Viewport", hierarchy, cmpCamera, app);
        viewPort.showSceneGraph();
        f.Loop.addEventListener("loopFrame" /* LOOP_FRAME */, update);
        f.Loop.start(f.LOOP_MODE.TIME_GAME, 60);
    }
    function update() {
        //Physics Ammo
        //world.stepSimulation(f.Loop.timeFrameGame / 1000, 10);
        world.stepSimulation(1 / 60, 1 / 60);
        applyPhysicsBody(cubes[0].getComponent(f.ComponentTransform), 1);
        applyPhysicsBody(cubes[1].getComponent(f.ComponentTransform), 2);
        //EndPhysics
        viewPort.draw();
        measureFPS();
    }
    function measureFPS() {
        window.requestAnimationFrame(() => {
            const now = performance.now();
            while (times.length > 0 && times[0] <= now - 1000) {
                times.shift();
            }
            times.push(now);
            fps = times.length;
            fpsDisplay.textContent = "FPS: " + fps.toString();
        });
    }
    function createCompleteMeshNode(_name, _material, _mesh) {
        let node = new f.Node(_name);
        let cmpMesh = new f.ComponentMesh(_mesh);
        let cmpMaterial = new f.ComponentMaterial(_material);
        let cmpTransform = new f.ComponentTransform();
        node.addComponent(cmpMesh);
        node.addComponent(cmpMaterial);
        node.addComponent(cmpTransform);
        return node;
    }
    function initializePhysicsBody(_cmpTransform, massVal, no) {
        let node = _cmpTransform.getContainer();
        let scale = new Ammo.btVector3(_cmpTransform.local.scaling.x, _cmpTransform.local.scaling.y, _cmpTransform.local.scaling.z);
        let pos = new Ammo.btVector3(_cmpTransform.local.translation.x, _cmpTransform.local.translation.y, _cmpTransform.local.translation.z);
        let transform = new Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(pos);
        transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
        let shape = new Ammo.btBoxShape(scale);
        let mass = massVal;
        let localInertia = new Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(mass, localInertia);
        let myMotionState = new Ammo.btDefaultMotionState(transform);
        let rbInfo = new Ammo.btRigidBodyConstructionInfo(0, myMotionState, shape, localInertia);
        let body = new Ammo.btRigidBody(rbInfo);
        bodies[no] = body;
        world.addRigidBody(body);
    }
    let transform = new Ammo.btTransform();
    function applyPhysicsBody(_cmpTransform, no) {
        let node = _cmpTransform.getContainer();
        let body = bodies[no];
        body.getMotionState().getWorldTransform(transform);
        //body.setLinearVelocity(new Ammo.btVector3(1, 0, 0));
        let origin = transform.getOrigin();
        let tmpPosition = new f.Vector3(origin.x(), origin.y(), origin.z());
        let rotation = transform.getRotation();
        let rotQuat = new Array();
        rotQuat.x = rotation.x();
        rotQuat.y = rotation.y();
        rotQuat.z = rotation.z();
        rotQuat.w = rotation.w();
        let mutator = {};
        let tmpRotation = makeRotationFromQuaternion(rotQuat, node.mtxLocal.rotation);
        if (no == 1)
            f.Debug.log(tmpPosition.y);
        mutator["rotation"] = tmpRotation;
        node.mtxLocal.mutate(mutator);
        mutator["translation"] = tmpPosition;
        node.mtxLocal.mutate(mutator);
    }
    function makeRotationFromQuaternion(q, targetAxis = new f.Vector3(1, 1, 1)) {
        let angles = new f.Vector3();
        // roll (x-axis rotation)
        let sinr_cosp = 2 * (q.w * q.x + q.y * q.z);
        let cosr_cosp = 1 - 2 * (q.x * q.x + q.y * q.y);
        angles.x = Math.atan2(sinr_cosp, cosr_cosp) * 60; //*Framerate? //* 180;
        // pitch (y-axis rotation)
        let sinp = 2 * (q.w * q.y - q.z * q.x);
        if (Math.abs(sinp) >= 1)
            angles.y = copysign(Math.PI / 2, sinp) * 60; // use 90 degrees if out of range
        else
            angles.y = Math.asin(sinp) * 60;
        // yaw (z-axis rotation)
        let siny_cosp = 2 * (q.w * q.z + q.x * q.y);
        let cosy_cosp = 1 - 2 * (q.y * q.y + q.z * q.z);
        angles.z = Math.atan2(siny_cosp, cosy_cosp) * 60;
        //f.Debug.log(angles);
        return angles;
    }
    function copysign(a, b) {
        return b < 0 ? -Math.abs(a) : Math.abs(a);
    }
})(FudgePhysics_Communication || (FudgePhysics_Communication = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTWFpbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIk1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGdEQUFnRDtBQUNoRCwyQ0FBMkM7QUFFM0MsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsT0FBTztJQUUzQixJQUFJLEdBQUcsT0FBTyxDQUFDO0FBQ2pCLENBQUMsQ0FBQyxDQUFDO0FBR0gsSUFBVSwwQkFBMEIsQ0EwTG5DO0FBMUxELFdBQVUsMEJBQTBCO0lBQ2xDLElBQU8sQ0FBQyxHQUFHLFNBQVMsQ0FBQztJQUVyQixNQUFNLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQ3RDLE1BQU0sR0FBRyxHQUFzQixRQUFRLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ2hFLElBQUksUUFBb0IsQ0FBQztJQUN6QixJQUFJLFNBQWlCLENBQUM7SUFDdEIsSUFBSSxHQUFXLENBQUM7SUFDaEIsTUFBTSxLQUFLLEdBQWEsRUFBRSxDQUFDO0lBQzNCLElBQUksS0FBSyxHQUFhLElBQUksS0FBSyxFQUFFLENBQUM7SUFDbEMsSUFBSSxVQUFVLEdBQWdCLFFBQVEsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDLENBQUM7SUFDL0QsSUFBSSxNQUFNLEdBQUcsSUFBSSxLQUFLLEVBQUUsQ0FBQztJQUV6QixJQUFJLEtBQUssQ0FBQztJQUNWLElBQUksc0JBQXNCLEdBQUcsSUFBSSxJQUFJLENBQUMsK0JBQStCLEVBQUUsRUFDckUsVUFBVSxHQUFHLElBQUksSUFBSSxDQUFDLHFCQUFxQixDQUFDLHNCQUFzQixDQUFDLEVBQ25FLG9CQUFvQixHQUFHLElBQUksSUFBSSxDQUFDLGdCQUFnQixFQUFFLEVBQ2xELE1BQU0sR0FBRyxJQUFJLElBQUksQ0FBQyxtQ0FBbUMsRUFBRSxDQUFDO0lBRTFELEtBQUssR0FBRyxJQUFJLElBQUksQ0FBQyx1QkFBdUIsQ0FBQyxVQUFVLEVBQUUsb0JBQW9C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QixNQUFNLENBQUMsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxpQ0FBaUM7O1lBRTlFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7UUFFbEMsd0JBQXdCO1FBQ3hCLElBQUksU0FBUyxHQUFXLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNwRCxJQUFJLFNBQVMsR0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsU0FBUyxDQUFDLEdBQUcsRUFBRSxDQUFDO1FBQ2pELHNCQUFzQjtRQUN0QixPQUFPLE1BQU0sQ0FBQztJQUNoQixDQUFDO0lBR0QsU0FBUyxRQUFRLENBQUMsQ0FBUyxFQUFFLENBQVM7UUFDcEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDNUMsQ0FBQztBQUVILENBQUMsRUExTFMsMEJBQTBCLEtBQTFCLDBCQUEwQixRQTBMbkMiLCJzb3VyY2VzQ29udGVudCI6WyIvLy88cmVmZXJlbmNlIHR5cGVzPVwiLi9MaWJyYXJpZXMvRnVkZ2VDb3JlLmpzXCIvPlxyXG4vLy88cmVmZXJlbmNlIHR5cGVzPVwiLi9MaWJyYXJpZXMvYW1tby5qc1wiLz5cclxuXHJcbkFtbW8oKS50aGVuKGZ1bmN0aW9uIChBbW1vTGliKSB7XHJcblxyXG4gIEFtbW8gPSBBbW1vTGliO1xyXG59KTtcclxuXHJcblxyXG5uYW1lc3BhY2UgRnVkZ2VQaHlzaWNzX0NvbW11bmljYXRpb24ge1xyXG4gIGltcG9ydCBmID0gRnVkZ2VDb3JlO1xyXG5cclxuICB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgaW5pdCk7XHJcbiAgY29uc3QgYXBwOiBIVE1MQ2FudmFzRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJjYW52YXNcIik7XHJcbiAgbGV0IHZpZXdQb3J0OiBmLlZpZXdwb3J0O1xyXG4gIGxldCBoaWVyYXJjaHk6IGYuTm9kZTtcclxuICBsZXQgZnBzOiBudW1iZXI7XHJcbiAgY29uc3QgdGltZXM6IG51bWJlcltdID0gW107XHJcbiAgbGV0IGN1YmVzOiBmLk5vZGVbXSA9IG5ldyBBcnJheSgpO1xyXG4gIGxldCBmcHNEaXNwbGF5OiBIVE1MRWxlbWVudCA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoXCJoMiNGUFNcIik7XHJcbiAgbGV0IGJvZGllcyA9IG5ldyBBcnJheSgpO1xyXG5cclxuICBsZXQgd29ybGQ7XHJcbiAgbGV0IGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24gPSBuZXcgQW1tby5idERlZmF1bHRDb2xsaXNpb25Db25maWd1cmF0aW9uKCksXHJcbiAgICBkaXNwYXRjaGVyID0gbmV3IEFtbW8uYnRDb2xsaXNpb25EaXNwYXRjaGVyKGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pLFxyXG4gICAgb3ZlcmxhcHBpbmdQYWlyQ2FjaGUgPSBuZXcgQW1tby5idERidnRCcm9hZHBoYXNlKCksXHJcbiAgICBzb2x2ZXIgPSBuZXcgQW1tby5idFNlcXVlbnRpYWxJbXB1bHNlQ29uc3RyYWludFNvbHZlcigpO1xyXG5cclxuICB3b3JsZCA9IG5ldyBBbW1vLmJ0RGlzY3JldGVEeW5hbWljc1dvcmxkKGRpc3BhdGNoZXIsIG92ZXJsYXBwaW5nUGFpckNhY2hlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pO1xyXG4gIHdvcmxkLnNldEdyYXZpdHkobmV3IEFtbW8uYnRWZWN0b3IzKDAsIC0xMCwgMCkpO1xyXG5cclxuICBmdW5jdGlvbiBpbml0KF9ldmVudDogRXZlbnQpOiB2b2lkIHtcclxuICAgIGYuRGVidWcubG9nKGFwcCk7XHJcbiAgICBmLlJlbmRlck1hbmFnZXIuaW5pdGlhbGl6ZSgpO1xyXG4gICAgaGllcmFyY2h5ID0gbmV3IGYuTm9kZShcIlNjZW5lXCIpO1xyXG5cclxuICAgIGxldCBncm91bmQ6IGYuTm9kZSA9IGNyZWF0ZUNvbXBsZXRlTWVzaE5vZGUoXCJHcm91bmRcIiwgbmV3IGYuTWF0ZXJpYWwoXCJHcm91bmRcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigwLjIsIDAuMiwgMC4yLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpKTtcclxuICAgIGxldCBjbXBHcm91bmRNZXNoOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IGdyb3VuZC5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pO1xyXG5cclxuICAgIGNtcEdyb3VuZE1lc2gubG9jYWwuc2NhbGUobmV3IGYuVmVjdG9yMygyMCwgMC4zLCAyMCkpO1xyXG4gICAgaGllcmFyY2h5LmFwcGVuZENoaWxkKGdyb3VuZCk7XHJcblxyXG4gICAgY3ViZXNbMF0gPSBjcmVhdGVDb21wbGV0ZU1lc2hOb2RlKFwiQ3ViZV8xXCIsIG5ldyBmLk1hdGVyaWFsKFwiQ3ViZVwiLCBmLlNoYWRlckZsYXQsIG5ldyBmLkNvYXRDb2xvcmVkKG5ldyBmLkNvbG9yKDEsIDAsIDAsIDEpKSksIG5ldyBmLk1lc2hDdWJlKCkpO1xyXG4gICAgbGV0IGNtcEN1YmVUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtID0gY3ViZXNbMF0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKTtcclxuICAgIGNtcEN1YmVUcmFuc2Zvcm0ubG9jYWwudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMCwgMiwgMCkpO1xyXG4gICAgY3ViZXNbMF0ubXR4V29ybGQucm90YXRlWCg0NSk7XHJcbiAgICBoaWVyYXJjaHkuYXBwZW5kQ2hpbGQoY3ViZXNbMF0pO1xyXG5cclxuICAgIGN1YmVzWzFdID0gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShcIkN1YmVfMlwiLCBuZXcgZi5NYXRlcmlhbChcIkN1YmVcIiwgZi5TaGFkZXJGbGF0LCBuZXcgZi5Db2F0Q29sb3JlZChuZXcgZi5Db2xvcigxLCAwLCAwLCAxKSkpLCBuZXcgZi5NZXNoQ3ViZSgpKTtcclxuICAgIGxldCBjbXBDdWJlVHJhbnNmb3JtMjogZi5Db21wb25lbnRUcmFuc2Zvcm0gPSBjdWJlc1sxXS5nZXRDb21wb25lbnQoZi5Db21wb25lbnRUcmFuc2Zvcm0pO1xyXG4gICAgY21wQ3ViZVRyYW5zZm9ybTIubG9jYWwudHJhbnNsYXRlKG5ldyBmLlZlY3RvcjMoMCwgMy41LCAwLjQpKTtcclxuICAgIGhpZXJhcmNoeS5hcHBlbmRDaGlsZChjdWJlc1sxXSk7XHJcblxyXG4gICAgbGV0IGNtcExpZ2h0OiBmLkNvbXBvbmVudExpZ2h0ID0gbmV3IGYuQ29tcG9uZW50TGlnaHQobmV3IGYuTGlnaHREaXJlY3Rpb25hbChmLkNvbG9yLkNTUyhcIldISVRFXCIpKSk7XHJcbiAgICBjbXBMaWdodC5waXZvdC5sb29rQXQobmV3IGYuVmVjdG9yMygwLjUsIC0xLCAtMC44KSk7XHJcbiAgICBoaWVyYXJjaHkuYWRkQ29tcG9uZW50KGNtcExpZ2h0KTtcclxuXHJcbiAgICBsZXQgY21wQ2FtZXJhOiBmLkNvbXBvbmVudENhbWVyYSA9IG5ldyBmLkNvbXBvbmVudENhbWVyYSgpO1xyXG4gICAgY21wQ2FtZXJhLmJhY2tncm91bmRDb2xvciA9IGYuQ29sb3IuQ1NTKFwiR1JFWVwiKTtcclxuICAgIGNtcENhbWVyYS5waXZvdC50cmFuc2xhdGUobmV3IGYuVmVjdG9yMygyLCAyLCAxMCkpO1xyXG4gICAgY21wQ2FtZXJhLnBpdm90Lmxvb2tBdChmLlZlY3RvcjMuWkVSTygpKTtcclxuXHJcbiAgICAvL1BoeXNpY3MgQW1tb1xyXG4gICAgd29ybGQuc2V0R3Jhdml0eShuZXcgQW1tby5idFZlY3RvcjMoMCwgLTEwLCAwKSk7XHJcbiAgICBpbml0aWFsaXplUGh5c2ljc0JvZHkoZ3JvdW5kLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSksIDAsIDApO1xyXG4gICAgaW5pdGlhbGl6ZVBoeXNpY3NCb2R5KGNtcEN1YmVUcmFuc2Zvcm0sIDEwLCAxKTtcclxuICAgIGluaXRpYWxpemVQaHlzaWNzQm9keShjbXBDdWJlVHJhbnNmb3JtMiwgMTAsIDIpO1xyXG4gICAgLy9FbmRQaHlzaWNzXHJcblxyXG4gICAgdmlld1BvcnQgPSBuZXcgZi5WaWV3cG9ydCgpO1xyXG4gICAgdmlld1BvcnQuaW5pdGlhbGl6ZShcIlZpZXdwb3J0XCIsIGhpZXJhcmNoeSwgY21wQ2FtZXJhLCBhcHApO1xyXG5cclxuICAgIHZpZXdQb3J0LnNob3dTY2VuZUdyYXBoKCk7XHJcblxyXG4gICAgZi5Mb29wLmFkZEV2ZW50TGlzdGVuZXIoZi5FVkVOVC5MT09QX0ZSQU1FLCB1cGRhdGUpO1xyXG4gICAgZi5Mb29wLnN0YXJ0KGYuTE9PUF9NT0RFLlRJTUVfR0FNRSwgNjApO1xyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIHVwZGF0ZSgpOiB2b2lkIHtcclxuXHJcbiAgICAvL1BoeXNpY3MgQW1tb1xyXG4gICAgLy93b3JsZC5zdGVwU2ltdWxhdGlvbihmLkxvb3AudGltZUZyYW1lR2FtZSAvIDEwMDAsIDEwKTtcclxuICAgIHdvcmxkLnN0ZXBTaW11bGF0aW9uKDEgLyA2MCwgMSAvIDYwKTtcclxuICAgIGFwcGx5UGh5c2ljc0JvZHkoY3ViZXNbMF0uZ2V0Q29tcG9uZW50KGYuQ29tcG9uZW50VHJhbnNmb3JtKSwgMSk7XHJcbiAgICBhcHBseVBoeXNpY3NCb2R5KGN1YmVzWzFdLmdldENvbXBvbmVudChmLkNvbXBvbmVudFRyYW5zZm9ybSksIDIpO1xyXG4gICAgLy9FbmRQaHlzaWNzXHJcblxyXG4gICAgdmlld1BvcnQuZHJhdygpO1xyXG4gICAgbWVhc3VyZUZQUygpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gbWVhc3VyZUZQUygpOiB2b2lkIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUoKCkgPT4ge1xyXG4gICAgICBjb25zdCBub3cgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgd2hpbGUgKHRpbWVzLmxlbmd0aCA+IDAgJiYgdGltZXNbMF0gPD0gbm93IC0gMTAwMCkge1xyXG4gICAgICAgIHRpbWVzLnNoaWZ0KCk7XHJcbiAgICAgIH1cclxuICAgICAgdGltZXMucHVzaChub3cpO1xyXG4gICAgICBmcHMgPSB0aW1lcy5sZW5ndGg7XHJcbiAgICAgIGZwc0Rpc3BsYXkudGV4dENvbnRlbnQgPSBcIkZQUzogXCIgKyBmcHMudG9TdHJpbmcoKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gY3JlYXRlQ29tcGxldGVNZXNoTm9kZShfbmFtZTogc3RyaW5nLCBfbWF0ZXJpYWw6IGYuTWF0ZXJpYWwsIF9tZXNoOiBmLk1lc2gpOiBmLk5vZGUge1xyXG4gICAgbGV0IG5vZGU6IGYuTm9kZSA9IG5ldyBmLk5vZGUoX25hbWUpO1xyXG4gICAgbGV0IGNtcE1lc2g6IGYuQ29tcG9uZW50TWVzaCA9IG5ldyBmLkNvbXBvbmVudE1lc2goX21lc2gpO1xyXG4gICAgbGV0IGNtcE1hdGVyaWFsOiBmLkNvbXBvbmVudE1hdGVyaWFsID0gbmV3IGYuQ29tcG9uZW50TWF0ZXJpYWwoX21hdGVyaWFsKTtcclxuXHJcbiAgICBsZXQgY21wVHJhbnNmb3JtOiBmLkNvbXBvbmVudFRyYW5zZm9ybSA9IG5ldyBmLkNvbXBvbmVudFRyYW5zZm9ybSgpO1xyXG4gICAgbm9kZS5hZGRDb21wb25lbnQoY21wTWVzaCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBNYXRlcmlhbCk7XHJcbiAgICBub2RlLmFkZENvbXBvbmVudChjbXBUcmFuc2Zvcm0pO1xyXG5cclxuICAgIHJldHVybiBub2RlO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaW5pdGlhbGl6ZVBoeXNpY3NCb2R5KF9jbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtLCBtYXNzVmFsOiBudW1iZXIsIG5vOiBudW1iZXIpIHtcclxuICAgIGxldCBub2RlOiBmLk5vZGUgPSBfY21wVHJhbnNmb3JtLmdldENvbnRhaW5lcigpO1xyXG4gICAgbGV0IHNjYWxlOiBBbW1vLmJ0VmVjdG9yMyA9IG5ldyBBbW1vLmJ0VmVjdG9yMyhfY21wVHJhbnNmb3JtLmxvY2FsLnNjYWxpbmcueCwgX2NtcFRyYW5zZm9ybS5sb2NhbC5zY2FsaW5nLnksIF9jbXBUcmFuc2Zvcm0ubG9jYWwuc2NhbGluZy56KTtcclxuICAgIGxldCBwb3M6IEFtbW8uYnRWZWN0b3IzID0gbmV3IEFtbW8uYnRWZWN0b3IzKF9jbXBUcmFuc2Zvcm0ubG9jYWwudHJhbnNsYXRpb24ueCwgX2NtcFRyYW5zZm9ybS5sb2NhbC50cmFuc2xhdGlvbi55LCBfY21wVHJhbnNmb3JtLmxvY2FsLnRyYW5zbGF0aW9uLnopO1xyXG4gICAgbGV0IHRyYW5zZm9ybTogQW1tby5idFRyYW5zZm9ybSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XHJcbiAgICB0cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcclxuICAgIHRyYW5zZm9ybS5zZXRPcmlnaW4ocG9zKTtcclxuICAgIHRyYW5zZm9ybS5zZXRSb3RhdGlvbihuZXcgQW1tby5idFF1YXRlcm5pb24oMCwgMCwgMCwgMSkpO1xyXG4gICAgbGV0IHNoYXBlOiBBbW1vLmJ0Qm94U2hhcGUgPSBuZXcgQW1tby5idEJveFNoYXBlKHNjYWxlKTtcclxuICAgIGxldCBtYXNzOiBudW1iZXIgPSBtYXNzVmFsO1xyXG4gICAgbGV0IGxvY2FsSW5lcnRpYTogQW1tby5idFZlY3RvcjMgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XHJcbiAgICBzaGFwZS5jYWxjdWxhdGVMb2NhbEluZXJ0aWEobWFzcywgbG9jYWxJbmVydGlhKTtcclxuICAgIGxldCBteU1vdGlvblN0YXRlOiBBbW1vLmJ0RGVmYXVsdE1vdGlvblN0YXRlID0gbmV3IEFtbW8uYnREZWZhdWx0TW90aW9uU3RhdGUodHJhbnNmb3JtKTtcclxuICAgIGxldCByYkluZm86IEFtbW8uYnRSaWdpZEJvZHlDb25zdHJ1Y3Rpb25JbmZvID0gbmV3IEFtbW8uYnRSaWdpZEJvZHlDb25zdHJ1Y3Rpb25JbmZvKDAsIG15TW90aW9uU3RhdGUsIHNoYXBlLCBsb2NhbEluZXJ0aWEpO1xyXG4gICAgbGV0IGJvZHk6IEFtbW8uYnRSaWdpZEJvZHkgPSBuZXcgQW1tby5idFJpZ2lkQm9keShyYkluZm8pO1xyXG4gICAgYm9kaWVzW25vXSA9IGJvZHk7XHJcbiAgICB3b3JsZC5hZGRSaWdpZEJvZHkoYm9keSk7XHJcbiAgfVxyXG5cclxuICBsZXQgdHJhbnNmb3JtOiBBbW1vLmJ0VHJhbnNmb3JtID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcclxuICBmdW5jdGlvbiBhcHBseVBoeXNpY3NCb2R5KF9jbXBUcmFuc2Zvcm06IGYuQ29tcG9uZW50VHJhbnNmb3JtLCBubzogbnVtYmVyKTogdm9pZCB7XHJcbiAgICBsZXQgbm9kZTogZi5Ob2RlID0gX2NtcFRyYW5zZm9ybS5nZXRDb250YWluZXIoKTtcclxuXHJcbiAgICBsZXQgYm9keSA9IGJvZGllc1tub107XHJcbiAgICBib2R5LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0odHJhbnNmb3JtKTtcclxuICAgIC8vYm9keS5zZXRMaW5lYXJWZWxvY2l0eShuZXcgQW1tby5idFZlY3RvcjMoMSwgMCwgMCkpO1xyXG5cclxuICAgIGxldCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XHJcbiAgICBsZXQgdG1wUG9zaXRpb246IGYuVmVjdG9yMyA9IG5ldyBmLlZlY3RvcjMob3JpZ2luLngoKSwgb3JpZ2luLnkoKSwgb3JpZ2luLnooKSk7XHJcbiAgICBsZXQgcm90YXRpb24gPSB0cmFuc2Zvcm0uZ2V0Um90YXRpb24oKTtcclxuICAgIGxldCByb3RRdWF0ID0gbmV3IEFycmF5KCk7XHJcbiAgICByb3RRdWF0LnggPSByb3RhdGlvbi54KCk7XHJcbiAgICByb3RRdWF0LnkgPSByb3RhdGlvbi55KCk7XHJcbiAgICByb3RRdWF0LnogPSByb3RhdGlvbi56KCk7XHJcbiAgICByb3RRdWF0LncgPSByb3RhdGlvbi53KCk7XHJcblxyXG4gICAgbGV0IG11dGF0b3I6IGYuTXV0YXRvciA9IHt9O1xyXG4gICAgbGV0IHRtcFJvdGF0aW9uOiBmLlZlY3RvcjMgPSBtYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbihyb3RRdWF0LCBub2RlLm10eExvY2FsLnJvdGF0aW9uKTtcclxuXHJcbiAgICBpZiAobm8gPT0gMSlcclxuICAgICAgZi5EZWJ1Zy5sb2codG1wUG9zaXRpb24ueSk7XHJcblxyXG4gICAgbXV0YXRvcltcInJvdGF0aW9uXCJdID0gdG1wUm90YXRpb247XHJcbiAgICBub2RlLm10eExvY2FsLm11dGF0ZShtdXRhdG9yKTtcclxuICAgIG11dGF0b3JbXCJ0cmFuc2xhdGlvblwiXSA9IHRtcFBvc2l0aW9uO1xyXG4gICAgbm9kZS5tdHhMb2NhbC5tdXRhdGUobXV0YXRvcik7XHJcblxyXG4gIH1cclxuXHJcblxyXG4gIGZ1bmN0aW9uIG1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uKHE6IGFueSwgdGFyZ2V0QXhpczogZi5WZWN0b3IzID0gbmV3IGYuVmVjdG9yMygxLCAxLCAxKSk6IGYuVmVjdG9yMyB7XHJcbiAgICBsZXQgYW5nbGVzOiBmLlZlY3RvcjMgPSBuZXcgZi5WZWN0b3IzKCk7XHJcblxyXG4gICAgLy8gcm9sbCAoeC1heGlzIHJvdGF0aW9uKVxyXG4gICAgbGV0IHNpbnJfY29zcDogbnVtYmVyID0gMiAqIChxLncgKiBxLnggKyBxLnkgKiBxLnopO1xyXG4gICAgbGV0IGNvc3JfY29zcDogbnVtYmVyID0gMSAtIDIgKiAocS54ICogcS54ICsgcS55ICogcS55KTtcclxuICAgIGFuZ2xlcy54ID0gTWF0aC5hdGFuMihzaW5yX2Nvc3AsIGNvc3JfY29zcCkgKiA2MDsgLy8qRnJhbWVyYXRlPyAvLyogMTgwO1xyXG5cclxuICAgIC8vIHBpdGNoICh5LWF4aXMgcm90YXRpb24pXHJcbiAgICBsZXQgc2lucDogbnVtYmVyID0gMiAqIChxLncgKiBxLnkgLSBxLnogKiBxLngpO1xyXG4gICAgaWYgKE1hdGguYWJzKHNpbnApID49IDEpXHJcbiAgICAgIGFuZ2xlcy55ID0gY29weXNpZ24oTWF0aC5QSSAvIDIsIHNpbnApICogNjA7IC8vIHVzZSA5MCBkZWdyZWVzIGlmIG91dCBvZiByYW5nZVxyXG4gICAgZWxzZVxyXG4gICAgICBhbmdsZXMueSA9IE1hdGguYXNpbihzaW5wKSAqIDYwO1xyXG5cclxuICAgIC8vIHlhdyAoei1heGlzIHJvdGF0aW9uKVxyXG4gICAgbGV0IHNpbnlfY29zcDogbnVtYmVyID0gMiAqIChxLncgKiBxLnogKyBxLnggKiBxLnkpO1xyXG4gICAgbGV0IGNvc3lfY29zcDogbnVtYmVyID0gMSAtIDIgKiAocS55ICogcS55ICsgcS56ICogcS56KTtcclxuICAgIGFuZ2xlcy56ID0gTWF0aC5hdGFuMihzaW55X2Nvc3AsIGNvc3lfY29zcCkgKiA2MDtcclxuICAgIC8vZi5EZWJ1Zy5sb2coYW5nbGVzKTtcclxuICAgIHJldHVybiBhbmdsZXM7XHJcbiAgfVxyXG5cclxuXHJcbiAgZnVuY3Rpb24gY29weXNpZ24oYTogbnVtYmVyLCBiOiBudW1iZXIpOiBudW1iZXIge1xyXG4gICAgcmV0dXJuIGIgPCAwID8gLU1hdGguYWJzKGEpIDogTWF0aC5hYnMoYSk7XHJcbiAgfVxyXG5cclxufSJdfQ==