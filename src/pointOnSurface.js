/**
 * Created by Li on 4/11/2017.
 */


var pointOnSurface = function (input) {

    var view = this;

    view.app = input.app;

    view.actionRecorder = input.actionRecorder;

    view.surface = input.surface;

    view.points = input.points;

    view.toUpdate = input.toUpdate;

    view.constructUVMesh();

    view.setupPoints();

    view.interactive();

    view.controlPoints = view.controlPtsGroup;



    // view.controlPtsGroup.dispose = view.dispose();
    //
    // return view.controlPtsGroup;

};

pointOnSurface.prototype.constructUVMesh = function () {

    var view = this;


    var getSurfacePoint = function(u, v) {
        //return nurbsSurface.getPoint(1-u, v);

        var p = view.surface.point(1-u, v);

        p = new THREE.Vector3(p[0],p[1],p[2]);

        return p;
    };

    var geometry = new THREE.ParametricGeometry( getSurfacePoint, view.surface._data.knotsU.length, view.surface._data.knotsV.length );

    var material = new THREE.MeshPhongMaterial( { color: new THREE.Color(0xffffff), wireframe:true } );
    var object = new THREE.Mesh( geometry, material );

    //scene.add(object);

    view.UVMesh = object;

};

pointOnSurface.prototype.setupPoints = function () {

    var view = this;

    view.controlPtsGroup = new THREE.Group();

    for(var i=0;i<view.points.length;i++){

        view.createControlPoint(view.points[i][0],view.points[i][1]);

    }

    scene.add(view.controlPtsGroup);

};

pointOnSurface.prototype.createControlPoint = function (u,v) {

    var view = this;

    u = u || 0.5;
    v = v || 0.5;

    var geometry = new THREE.SphereBufferGeometry( 8, 32, 32 );
    var material = new THREE.MeshPhongMaterial( {color: 0xffffff} );
    var sphere = new THREE.Mesh( geometry, material );

    var pt = view.surface.point(u,v);

    sphere.position.set(pt[0],pt[1],pt[2]);

    sphere.position.u = u;

    sphere.position.v = v;

    sphere.position.w = 0;

    view.controlPtsGroup.add( sphere );


};

pointOnSurface.prototype.interactive = function () {

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


                var pt = view.surface.point(1-intersects[0].uv.x,intersects[0].uv.y);

                selected.newUV = [1-intersects[0].uv.x,intersects[0].uv.y,0];
                selected.position.set(pt[0],pt[1],pt[2]);

                selected.position.u = 1-intersects[0].uv.x;
                selected.position.v = intersects[0].uv.y;

            }

        }
    }

    view.onDocumentMouseMove = onDocumentMouseMove;

    function onDocumentMouseDown( event ) {

        raycaster.setFromCamera( mouse, camera );

        //var intersects = raycaster.intersectObjects( view.controlPtsGroup.children );

        view.coverGroup = [view.app.scan].concat(view.controlPtsGroup.children); // create this group on the go to prevent scan asynchronous loading problem

        var intersects = raycaster.intersectObjects( view.coverGroup ); // to prevent selecting points from the back
        if ( intersects.length > 0 ) {

            if (intersects[0].object == view.app.scan) return;

            selected = intersects[0].object;

            selected.material.color.setHex(0xffff00);
            controlPtOn = true;
            controls.enabled = false;



        } else {


        }

    }

    view.onDocumentMouseDown = onDocumentMouseDown;

    function onDocumentMouseUp( event ) {

        if(controlPtOn) {


            //view.updateVertices();


            // prevent event to be triggers repeatedly in 0.05s
            var current = new Date();

            if( current - view.app.timer < 50) return;

            view.app.timer = current;
            //

            view.controlPtsGroup.update();

            view.actionRecorder.recordBraceEdit();

            if(view.toUpdate) view.toUpdate();

            console.log('updateShape');

            selected.material.color.setHex(0xffffff);



        }

        controlPtOn = false;
        controls.enabled = true;

    }

    view.onDocumentMouseUp = onDocumentMouseUp;

};


pointOnSurface.prototype.dispose = function () {

    var view = this;

    document.removeEventListener( 'mousemove', view.onDocumentMouseMove, false );
    document.removeEventListener( 'mousedown', view.onDocumentMouseDown, false );
    document.removeEventListener( 'mouseup', view.onDocumentMouseUp, false );

    scene.remove(view.controlPtsGroup);

    view.actionRecorder = null;

    view.surface = null;

    view.points = null;

    view.toUpdate = null;

    view.UVMesh = null;

};