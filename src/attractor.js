/**
 * Created by Pater on 3/28/2017.
 */

var Attractor = function (input) {

    var view = this;

    view.range = input.range;

    view.position = input.position;

    view.intensity = input.intensity || 1;

    if(input.fallOffType == "linear") view.fallOff = view.linear;
    if(input.fallOffType == "cos") view.fallOff = view.cos;
    if(input.fallOffType == "bellCurve") view.fallOff = view.bellCurve;
    if(input.fallOffType == "power") view.fallOff = view.power;
    if(input.fallOffType == "custom") view.fallOff = input.customFallOff;

    if(input.createSphere) view.createSphere();

};

Attractor.prototype.createSphere = function () {

    var view = this;

    var geometry = new THREE.SphereBufferGeometry(1,32,32);

    var material = new THREE.MeshPhongMaterial({opacity:0.1,transparent:true});

    var mesh = new THREE.Mesh(geometry,material);

    mesh.scale.set(view.range,view.range,view.range);

    scene.add(mesh);

    view.mesh = mesh;

    view.position = mesh.position;



};

Attractor.prototype.linear = function (x,y,z) {

    var view = this;


    if(view.position instanceof THREE.Vector3) var distance = Math.sqrt(Math.pow(x-view.position.x,2)+Math.pow(y-view.position.y,2)+Math.pow(z-view.position.z,2));
    else distance = Math.sqrt(Math.pow(x-view.position[0],2)+Math.pow(y-view.position[1],2)+Math.pow(z-view.position[2],2));

    var blendValue = 1-distance/view.range;

    blendValue = blendValue > 1 ? 1:blendValue;
    blendValue = blendValue < 0 ? 0:blendValue;

    return blendValue * view.intensity;

};


Attractor.prototype.cos = function (x,y,z) {

    var view = this;

    if(view.position instanceof THREE.Vector3) {

        var position = view.position.clone();

        if(view.matrixWorld) position.applyMatrix4(view.matrixWorld);

        var distance = Math.sqrt(Math.pow(x-position.x,2)+Math.pow(y-position.y,2)+Math.pow(z-position.z,2));

    }
    else {


        distance = Math.sqrt(Math.pow(x-view.position[0],2)+Math.pow(y-view.position[1],2)+Math.pow(z-view.position[2],2));
    }

    distance = distance>view.range? view.range : distance;

    var blendValue = (Math.cos(distance/view.range*Math.PI)+1)/2;

    blendValue = blendValue > 1 ? 1:blendValue;
    blendValue = blendValue < 0 ? 0:blendValue;

    return blendValue * view.intensity;
};



Attractor.prototype.bellCurve = function (x,y,z,dev) {

    var view = this;

    if(view.position instanceof THREE.Vector3) var distance = Math.sqrt(Math.pow(x-view.position.x,2)+Math.pow(y-view.position.y,2)+Math.pow(z-view.position.z,2));
    else distance = Math.sqrt(Math.pow(x-view.position[0],2)+Math.pow(y-view.position[1],2)+Math.pow(z-view.position[2],2));

    var blendValue = Math.pow(-1*Math.pow(distance,2)/(2*Math.pow(dev,2)),Math.E)/(dev*Math.pow(2*Math.PI,.5));

    if(distance>dev*3){
        blendValue = 0;
    }

    blendValue = blendValue > 1 ? 1:blendValue;
    blendValue = blendValue < 0 ? 0:blendValue;

    return blendValue * view.intensity;

};


Attractor.prototype.power = function (x,y,z,a) {

    var view = this;

    if(view.position instanceof THREE.Vector3) var distance = Math.sqrt(Math.pow(x-view.position.x,2)+Math.pow(y-view.position.y,2)+Math.pow(z-view.position.z,2));
    else distance = Math.sqrt(Math.pow(x-view.position[0],2)+Math.pow(y-view.position[1],2)+Math.pow(z-view.position[2],2));

    var blendValue = Math.pow(distance/view.range,a);

    blendValue = blendValue > 1 ? 1:blendValue;
    blendValue = blendValue < 0 ? 0:blendValue;

    return blendValue * view.intensity;

};
