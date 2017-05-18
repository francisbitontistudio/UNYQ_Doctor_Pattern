/**
 * Created by Pater on 3/30/2017.
 */

var curveMorph = function (input) {

    var view = this;

    view.controlPoints = [];

    view.nurbsSurface = input.nurbsSurface;

    view.controlPointsLocked = false;


    var getSurfacePoint = function(u, v) {
        return view.nurbsSurface.getPoint(u, v);
    };

    var geometry = new THREE.ParametricBufferGeometry( getSurfacePoint, 20, 20 );
    var material = new THREE.MeshLambertMaterial( { side: THREE.DoubleSide,wireframe:true } );
    var object = new THREE.Mesh( geometry, material );

    //scene.add( object );
    view.UVMesh = object;


    for(var i=0;i<input.controlPoints.length;i++){

        view.createControlPoint(input.controlPoints[i][0],input.controlPoints[i][1]);


    }


    view.interact();


    view.points = [];
    view.attractors = [];

    for(var i=0; i< view.controlPoints.length; i++){

        view.points.push(view.controlPoints[i].position);

    }

    view.curve = new closedCurve(view.points);






};

curveMorph.prototype.loadGeo = function () {

    var view = this;

    var loader = new THREE.OBJLoader();
    loader.load('plug2.obj',function (object) {


        var mesh = object.children[0];

        mesh.material.transparent =true;
        mesh.material.opacity = 0.5;

        //mesh.material.color.setHex(0xffffff);

        //mesh.material.wireframe = true;

        mesh.geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);

        if(scene) scene.add(mesh);

        view.mesh = mesh;

        // view.lockGeometry();

        gui.add(view.mesh,'visible');
        gui.add(view,'lockGeometry');
    });




};


curveMorph.prototype.createControlPoint = function (u, v) {


    var view = this;

    var geometry = new THREE.SphereBufferGeometry( 0.5, 32, 32 );
    var material = new THREE.MeshPhongMaterial();
    var sphere = new THREE.Mesh( geometry, material );

    var pt = view.nurbsSurface.getPoint(u,v);

    sphere.position.set(pt.x,pt.y,pt.z);

    sphere.UV = [u,v];
    sphere.newUV = [u,v];
    sphere.oldPosition = sphere.position.clone();

    view.controlPoints.push(sphere);

    if(scene) scene.add( sphere );


};


curveMorph.prototype.interact = function () {


    var view = this;

    var controlPtOn = false;

    var selected;

    var raycaster = new THREE.Raycaster();

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );

    function onDocumentMouseDown() {

        raycaster.setFromCamera( mouse, camera );


        var intersects = raycaster.intersectObjects( view.controlPoints );
        if ( intersects.length > 0 ) {

            selected = intersects[0].object;

            selected.material.color.setHex(0xffff00);
            controlPtOn = true;
            controls.enabled = false;

            //selected.oldPosition.copy(selected.position);



        } else {


        }

    }


    function onDocumentMouseUp(  ) {

        if(controlPtOn) {

            if(view.controlPointsLocked){
                view.updateGeometry();
                selected.material.color.setHex(0xffffff);

            }else{

                selected.material.color.setHex(0xffffff);
            }


        }

        controlPtOn = false;
        controls.enabled = true;

    }


    function onDocumentMouseMove( event ) {

        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        if(controlPtOn){

            raycaster.setFromCamera( mouse, camera );
            var intersects = raycaster.intersectObject( view.UVMesh );
            if ( intersects.length > 0 ) {

                var pt = view.nurbsSurface.getPoint(intersects[0].uv.x,intersects[0].uv.y);
                selected.newUV = [intersects[0].uv.x,intersects[0].uv.y];
                selected.position.set(pt.x,pt.y,pt.z);

                console.log(intersects[0].uv.x +' , ' + intersects[0].uv.y);

                view.curve.updateCurve();


            }


        }
    }


};

curveMorph.prototype.lockGeometry = function () {

    var view = this;

    var vertices = view.mesh.geometry.vertices;

    for(var i=0; i<vertices.length; i++){


        var closestIndex = -1, closestDis = 1000000000;

        for(var j=0;j<view.curve.geometry.vertices.length;j++){

            var distance = view.curve.geometry.vertices[j].distanceTo(vertices[i]);

            if( distance < closestDis){

                closestIndex = j;
                closestDis = distance;

            }

        }


        vertices[i].attractor = new Attractor({

            position: view.curve.geometry.vertices[closestIndex],

            fallOffType: 'linear',

            range: 10

        });

        vertices[i].attractor.weight = vertices[i].attractor.linear( vertices[i].x, vertices[i].y, vertices[i].z);


    }


    for(var j=0;j<view.curve.geometry.vertices.length;j++){

        view.curve.geometry.vertices[j].oldPosition = view.curve.geometry.vertices[j].clone();


    }


    view.controlPointsLocked = true;


    view.mesh.geometry.verticesNeedsUpdate = true;

};


curveMorph.prototype.updateGeometry = function () {

    var view = this;

    var vertices = view.mesh.geometry.vertices;

    for(var i=0; i<vertices.length; i++){


        vertices[i].add(new THREE.Vector3().subVectors( vertices[i].attractor.position , vertices[i].attractor.position.oldPosition ).multiplyScalar( vertices[i].attractor.weight ));

    }


    for(var j=0;j<view.curve.geometry.vertices.length;j++){


        view.curve.geometry.vertices[j].oldPosition.copy(view.curve.geometry.vertices[j]);
          
    }



    view.mesh.geometry.verticesNeedUpdate = true;


};





