/**
 * Created by Pater on 12/29/2016.
 *
 * need modules: threejs, vectorFunctions.js
 *
 */

var wrapSurface = function (input) {

    var view = this;

    view.input = input;

    view.mapOffset = input.mapOffset || {u:0,v:0};

    view.controlPoints = [];

    if(input.wrapTartgetMesh instanceof THREE.Mesh){

        var wrapTartgetMesh = input.wrapTartgetMesh;

        view.wrapTartgetMesh = wrapTartgetMesh;

        if(view.wrapTartgetMesh.geometry instanceof THREE.Geometry) {

            view.wrapTartgetMesh = view.wrapTartgetMesh.clone(); // prevent changing the geometry type of input mesh
            view.wrapTartgetMesh.geometry = new THREE.BufferGeometry().fromGeometry(view.wrapTartgetMesh.geometry);
        }

        view.constructNurbsSurface();

        if(input.UVWMesh) view.mapUVWGeometry(input.UVWMesh);

    }else{

        //view.importWrapTartgetMesh(); // load from URL

    }


    if(input.mesh) view.setupMesh();



};

wrapSurface.prototype.start = function (wrapTartgetMesh) {

    var view = this;

    view.wrapTartgetMesh = wrapTartgetMesh;

    if(view.wrapTartgetMesh.geometry instanceof THREE.Geometry) {

        view.wrapTartgetMesh = view.wrapTartgetMesh.clone(); // prevent changing the geometry type of input mesh
        view.wrapTartgetMesh.geometry = new THREE.BufferGeometry().fromGeometry(view.wrapTartgetMesh.geometry);
    }


    view.constructNurbsSurface();

};

wrapSurface.prototype.loadSurface = function (verbControlPoints,knots1,knots2) {

    this.verbSurface = verb.geom.NurbsSurface.byKnotsControlPointsWeights( 3, 3, knots1, knots2, verbControlPoints );

};

wrapSurface.prototype.importWrapTartgetMesh = function () {

    var view = this;

    var loader = new THREE.OBJLoader();
    loader.load(view.input.wrapTartgetMesh,function (object) {


        var wrapTartgetMesh = object.children[0];

        wrapTartgetMesh.material.color.setHex(0x1e1e1e);

        wrapTartgetMesh.material.wireframe = true;

        if(scene) scene.add(wrapTartgetMesh);

        view.wrapTartgetMesh = wrapTartgetMesh;

        view.constructNurbsSurface();

        if(view.input.UVWMesh) view.mapUVWGeometry(view.input.UVWMesh);

    });

};

wrapSurface.prototype.setupMesh = function () {

    var view = this;

    var loader = new THREE.OBJLoader();
    loader.load(view.input.mesh,function (object) {


        var mesh = object.children[0];

        mesh.material.color.setHex(0xbcbcbc);
        mesh.material.side = THREE.DoubleSide;

        mesh.geometry = new THREE.Geometry().fromBufferGeometry( mesh.geometry );

        if(scene) scene.add(mesh);

        view.mesh = mesh;

        view.meshUV = [];

        mesh.geometry.mergeVertices();


    });

};


// construct a nurbs surface around the wrap target
wrapSurface.prototype.constructNurbsSurface = function () {


    var view = this;

    console.log('constructing Nurbs surface');

    var divisionU = view.input.nurbsSurfaceSetting.U || 80;
    var divisionV = view.input.nurbsSurfaceSetting.V || 30;
    var offset = view.input.nurbsSurfaceSetting.offset || 0;
    var height = view.input.nurbsSurfaceSetting.height || 0;
    var center = view.input.nurbsSurfaceSetting.center || [0,0,0];


    var o = new THREE.Vector3(0,0.12,0.2);
    var dir = new THREE.Vector3(0,1,0);
    var thisRay = new THREE.Ray(o,dir);
    var a = new THREE.Vector3(100,0,0);
    var b = new THREE.Vector3(100,1,0);
    var c = new THREE.Vector3(100,0,1);


    var pointsArray = [];

    var nsControlPoints = [];
    var verbControlPoints = []

    view.UV = [];

    for(var u =0;u<divisionU;u++){
        view.UV[u] = [];
        for(var v=0;v<divisionV;v++){
            view.UV[u][v] = 0;
        }
    }



    for(var v=0;v<divisionV;v++) {

        nsControlPoints[v] = [];
        verbControlPoints[v] = [];

        for (var u = 0; u < divisionU; u++) {

            o.set(center[0],center[1]-height/2+height * v / (divisionV-1),center[2]);

            dir.set(Math.sin(Math.PI+u * Math.PI * 2 / (divisionU-1)), 0, Math.cos(Math.PI+u * Math.PI * 2 / (divisionU-1)));



            var posFlatArray = view.wrapTartgetMesh.geometry.attributes.position.array;
            for(var i = 0; i<posFlatArray.length; i+=9){


                a.set(posFlatArray[i],posFlatArray[i+1],posFlatArray[i+2]);
                b.set(posFlatArray[i+3],posFlatArray[i+4],posFlatArray[i+5]);
                c.set(posFlatArray[i+6],posFlatArray[i+7],posFlatArray[i+8]);

                var intersect = thisRay.intersectTriangle(a,b,c,false);
                if(intersect) {

                    dir = dir.normalize();

                    pointsArray.push([
                        intersect.x + dir.x * offset,
                        intersect.y + dir.y * offset,
                        intersect.z + dir.z * offset
                    ]);

                    nsControlPoints[v][u] = new THREE.Vector4(intersect.x + dir.x * offset,intersect.y + dir.y * offset,intersect.z + dir.z * offset,1);
                    verbControlPoints[v][u] = [intersect.x + dir.x * offset,intersect.y + dir.y * offset,intersect.z + dir.z * offset];

                    view.UV[u][v] = [intersect.x,intersect.y,intersect.z];

                    break;
                }

            }

        }
    }


    //if(scene) view.samplePoints = createParticleSystem(pointsArray,0.1);


    var knots1 = [0,0,0];
    for(var i = 0;i<divisionV-3;i++){

        knots1.push(i/(divisionV-3));

    }
    knots1.push(1,1,1,1);


    var knots2 = [0,0,0];
    for(var i = 0;i<divisionU-3;i++){

        knots2.push(i/(divisionU-3));

    }
    knots2.push(1,1,1,1);


    var nurbsSurface = new THREE.NURBSSurface(3, 3, knots1, knots2, nsControlPoints);
    var verbSurface = verb.geom.NurbsSurface.byKnotsControlPointsWeights( 3, 3, knots1, knots2, verbControlPoints );


    console.log('ray trace finished, converting nurbs to mesh');

    view.nurbsSurface = nurbsSurface;
    view.verbSurface = verbSurface;

    var getSurfacePoint = function(u, v) {
        return nurbsSurface.getPoint(1-u, v);

        // var p = verbSurface.point(1-u, v);
        //
        // p = new THREE.Vector3(p[0],p[1],p[2]);
        //
        // return p;
    };

    var geometry = new THREE.ParametricGeometry( getSurfacePoint, divisionU, divisionV );



    var material = new THREE.MeshPhongMaterial( { color: new THREE.Color(0xffffff), wireframe:true } );
    var object = new THREE.Mesh( geometry, material );

    console.log('UVMesh created');

    //scene.add(object);

    view.UVMesh = object;

};


// map the mesh on the UV coordinate of nurbs surface
wrapSurface.prototype.wrapGeometry = function () {

    var view = this;

    var fakeCamera = new THREE.PerspectiveCamera( 70, 1, 1, 10000 );
    var fakeMouse = new THREE.Vector2(0,0);


    var braceInput = view.mesh;

    var thisRay = new THREE.Raycaster();

    var toDraw = [];

    for(var i = 0; i<braceInput.geometry.vertices.length;i++){

        var thisVertex = braceInput.geometry.vertices[i];

        fakeCamera.position.set(thisVertex.x*2,thisVertex.y,thisVertex.z*2);

        fakeCamera.lookAt(new THREE.Vector3(0,thisVertex.y,0));
        fakeCamera.position.set(thisVertex.x*2,thisVertex.y,thisVertex.z*2); //Moves camera to view each vertex
        fakeCamera.lookAt(thisVertex);
        fakeCamera.updateMatrix();
        fakeCamera.updateProjectionMatrix();
        fakeCamera.updateMatrixWorld();
        thisRay.setFromCamera(fakeMouse,fakeCamera); //Draws vector from camera to origin

        var intersects = thisRay.intersectObject(view.UVMesh);

        if(intersects.length>0){

            var pt = view.nurbsSurface.getPoint(1-intersects[0].uv.x,intersects[0].uv.y);
            toDraw.push([pt.x,pt.y,pt.z]);

            thisVertex.UV = [1-intersects[0].uv.x,intersects[0].uv.y];
            thisVertex.set(pt.x,pt.y,pt.z);

        }


        if(intersects.length<=0) console.log('mesh falls out of wrap target!');


    }


    view.mesh.geometry.dynamic = true;
    view.mesh.geometry.verticesNeedUpdate = true;
    view.updateVertices();


};


// pull mesh vertices position according to its UV on nurbs
wrapSurface.prototype.updateVertices = function () {

    var pts = [];

    var view = this;
    for(var i = 0; i<view.mesh.geometry.vertices.length; i++){

        var thisVertex = view.mesh.geometry.vertices[i];
        var newUV = [0,0];

        newUV = [].add(newUV,thisVertex.UV);

        for(var j = 0 ; j<view.controlPoints.length;j++){

            var thisControlPoint = view.controlPoints[j];

            newUV = [].add(newUV,[].mult([].sub(thisControlPoint.newUV,thisControlPoint.UV),thisVertex.weights[j]));

        }



        var pt = view.nurbsSurface.getPoint(newUV[0],newUV[1]);



        pts.push([pt.x,pt.y,pt.z]);

        thisVertex.set(pt.x,pt.y,pt.z);


    }

    view.mesh.geometry.dynamic = true;
    view.mesh.geometry.verticesNeedUpdate = true;

    //createParticleSystem(pts,0.2,new THREE.Color(yellow));

};


// map geometry using its xyz as uvw on surface
wrapSurface.prototype.mapUVWGeometry = function (URL) {

    var view = this;



    var loader = new THREE.OBJLoader().load(URL,function (object) {

        var mesh = object.children[0];

        var pos = mesh.geometry.attributes.position.array;

        mesh.geometry.uvw = [];

        view.mesh = mesh;

        for(var i=0;i<pos.length;i+=3){

            var u = pos[i];
            var v = pos[i+1];
            var w = pos[i+2];

            view.mesh.geometry.uvw[i] = u;
            view.mesh.geometry.uvw[i+1] = v;
            view.mesh.geometry.uvw[i+2] = w;

            // var pt = view.verbSurface.point(u,v);
            //
            // var normal = vectorNormalise([pt[0],0,pt[2]]);
            // normal = vectorMult(normal,w);
            // pt = vectorAdd(pt,normal);
            //
            // pos[i] = pt[0];
            // pos[i+1] = pt[1];
            // pos[i+2] = pt[2];



        }

        // mesh.geometry.attributes.position.needsUpdate = true;

        if(scene) scene.add(mesh);

        view.updateFromUVW();

        //console.log(mesh);

    });




};


// update mesh vertices using uvw coordinates
wrapSurface.prototype.updateFromUVW = function () {

    var view = this;


    var pos = view.mesh.geometry.attributes.position.array;

    for(var i=0;i<view.mesh.geometry.uvw.length;i+=3){

        var u = view.mesh.geometry.uvw[i];
        var v = view.mesh.geometry.uvw[i+1];
        var w = view.mesh.geometry.uvw[i+2];

        u+=view.mapOffset.u;
        v+=view.mapOffset.v;


        if(view.gradient) {
            u = view.gradient.getValueAt(u);
        }

        if(view.weights){


            var newUV = [0,0,0];

            newUV = [u,v,0];

            for(var j = 0 ; j<view.controlPoints.length;j++){

                var thisControlPoint = view.controlPoints[j];

                newUV = [].add(newUV,[].mult([].sub(thisControlPoint.newUV,thisControlPoint.UV),view.weights[i/3 + j*pos.length/3]));

            }

            u = newUV[0];
            v = newUV[1];


        }




        u = u<0 ? u+1 : u;
        u = u>1 ? u-1 : u;

        v = v<0 ? v+1 : v;
        v = v>1 ? v-1 : v;


        var pt = view.verbSurface.point(u,v);
        //var normal = vectorNormalise(view.verbSurface.normal(u,v));
        //normal = vectorMult(normal,-w);
        var normal = [].normalise([pt[0],0,pt[2]]);
        normal = [].mult(normal,w);

        pt = [].add(pt,normal);

        pos[i] = pt[0];
        pos[i+1] = pt[1];
        pos[i+2] = pt[2];



    }

    //view.mesh.geometry.computeVertexNormals();
    view.mesh.geometry.attributes.position.needsUpdate = true;


};


wrapSurface.prototype.addControlPlane = function (levels) {

    var view = this;

    view.controlPlanes = [];

    view.gradient = new gradientMap({

        mapFrom: levels,
        mapTo: levels.copy()

    });

    var controlPlaneGUI = new dat.GUI();

    for(var i = 0; i<levels.length;i++){

        var geometry = new THREE.PlaneBufferGeometry(500,300);
        var mesh = new THREE.Mesh(geometry,new THREE.MeshNormalMaterial({wireframe: true ,side:THREE.DoubleSide}));
        mesh.rotation.x = Math.PI/2;
        mesh.position.y = view.verbSurface.point(levels[i],0)[1];

        mesh.u = levels[i];

        view.controlPlanes.push(mesh);


        if(scene && i!= 0 && i!=levels.length-1) {
            scene.add(mesh);
            controlPlaneGUI.add(mesh,'u',0,1).step(0.01).onChange(updatePlane);
        }

    }



    function updatePlane() {

        for(var i = 0; i<view.controlPlanes.length;i++){

            var thisPlane = view.controlPlanes[i];

            thisPlane.position.y = view.verbSurface.point(thisPlane.u ,0)[1];

            view.gradient.mapTo[i] = thisPlane.u;

        }


    }


};


wrapSurface.prototype.createControlPoint = function (u,v) {

    var view = this;

    u = u || 0.5;
    v = v || 0.5;

    var geometry = new THREE.SphereBufferGeometry( 20, 32, 32 );
    var material = new THREE.MeshPhongMaterial( {color: 0xffffff} );
    var sphere = new THREE.Mesh( geometry, material );

    var pt = view.nurbsSurface.getPoint(u,v);

    sphere.position.set(pt.x,pt.y,pt.z);

    sphere.UV = [u,v,0];
    sphere.newUV = [u,v,0];

    view.controlPoints.push(sphere);

    scene.add( sphere );



};


wrapSurface.prototype.setupControlPoint = function () {

    var view = this;


    var pos = view.mesh.geometry.attributes.position.array;

    view.weights = [];

    for(var i=0;i< pos.length;i+=3){


    }

    var pts = [];
    var sizes = [];

    for(var i = 0 ; i<view.controlPoints.length; i++){



        var thisControlPoint = view.controlPoints[i];

        thisControlPoint.UV = [thisControlPoint.newUV[0],thisControlPoint.newUV[1]];


        for(var j=0;j< pos.length;j+=3){

            var thisVertex = [pos[j],pos[j+1],pos[j+2]];

            var thisWeight = [].dis([thisControlPoint.UV[0],thisControlPoint.UV[1],0],[view.mesh.geometry.uvw[j],view.mesh.geometry.uvw[j+1],0]);
            thisWeight = plotOnBell(thisWeight+0.5);

            view.weights.push(thisWeight);

            pts.push(thisVertex);
            sizes.push(thisWeight*10);
        }




    }

    view.controlPointsLocked = true;
    //view.mesh.material.wireframe = true;


    //createParticleSystem(pts,sizes,red);

    function plotOnBell(x,scale){
        scale = scale || false;
        var stdD = .125;
        var mean = .5;
        if(scale){
            return  1 / (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2))));
        }else{
            return (( 1/( stdD * Math.sqrt(2 * Math.PI) ) ) * Math.pow(Math.E , -1 * Math.pow(x - mean, 2) / (2 * Math.pow(stdD,2)))) * plotOnBell(.5,true);
        }
    }

};


wrapSurface.prototype.interactive = function () {

    var view = this;

    var raycaster = new THREE.Raycaster();

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );

    var controlPtOn = false;
    var selected;

    function onDocumentMouseMove( event ) {

        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        if(controlPtOn){

            raycaster.setFromCamera( mouse, camera );
            var intersects = raycaster.intersectObject( view.UVMesh );
            if ( intersects.length > 0 ) {

                var pt = view.nurbsSurface.getPoint(1-intersects[0].uv.x,intersects[0].uv.y);
                selected.newUV = [1-intersects[0].uv.x,intersects[0].uv.y,0];
                selected.position.set(pt.x,pt.y,pt.z);

            }


        }
    }


    function onDocumentMouseDown() {

        raycaster.setFromCamera( mouse, camera );

        var intersects = raycaster.intersectObjects( view.controlPoints );
        if ( intersects.length > 0 ) {

            selected = intersects[0].object;

            selected.material.color.setHex(0xffff00);
            controlPtOn = true;
            controls.enabled = false;



        } else {


        }

    }

    function onDocumentMouseUp(  ) {

        if(controlPtOn) {

            if(view.controlPointsLocked){
                //view.updateVertices();

                console.log('updateShape');

                selected.material.color.setHex(0xffffff);
            }else{

                selected.material.color.setHex(0xffffff);
            }


        }

        controlPtOn = false;
        controls.enabled = true;

    }



};
// export stl
wrapSurface.prototype.export = function () {

    var exporter = new THREE.STLBinaryExporter();
    var result = exporter.parse (this.mesh.geometry);
    var blob = new Blob([result], {type: "text/plain"});

    if(scene) saveAs(blob, "wrapSurface.stl");

    return blob;

};


//module.exports = wrapSurface;