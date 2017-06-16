/**
 * Created by Pater on 4/10/2017.
 */

var meshModifier = function (app) {

    var view = this;

    view.app = app;

    view.on = false;


    view.mesh = null;
    view.originalMesh = null;
    view.actionRecorder = null;

    view.curves = [];
    view.controlPoints = [];

    view.brushSteps = [];


    view.brushOn = false;
    view.editCurve = false;
    view.brushType = 'sculpt';

    view.setupTransformControl();
    view.interactive();

    view.meshSmooth = new meshSmooth({

        app:view.app

    });

};

meshModifier.prototype.start = function () {

    var view = this;

    view.on = true;
    //view.editCurve = true;
    view.actionRecorder = view.app.actionRecorder;
    view.mesh = view.app.scan;

    // create brush and hide it
    view.createBrush();
    view.closeBrush();

    // show original mesh
    if(view.originalMesh) {scene.remove(view.originalMesh);view.originalMesh = null;}
    view.originalMesh = view.mesh.clone();
    view.originalMesh.geometry = view.mesh.geometry.clone();
    view.originalMesh.material = view.mesh.material.clone();
    scene.add(view.originalMesh);

    if(view.originalMeshGUI) {view.app.guiScan.removeFolder('Original Scan');view.originalMeshGUI = null;}
    view.originalMeshGUI = view.app.guiScan.addFolder('Original Scan');

    view.originalMesh.material.color.setRGB(255,0,0);
    view.originalMesh.material.opacity = 0.25;
    view.originalMesh.visible = false;



    //register neighbors for smooth brush
    view.meshSmooth.registerNeighbors();


    var param = {

        color: new THREE.Color(),


        update: function () {

            view.originalMesh.material.color.r = param.color.r / 255;
            view.originalMesh.material.color.g = param.color.g / 255;
            view.originalMesh.material.color.b = param.color.b / 255;


        }

    };


    view.originalMeshGUI.add(view.originalMesh,'visible');
    view.originalMeshGUI.add(view.originalMesh.material,'opacity',0,1);
    // view.originalMeshGUI.add(view.originalMesh.material,'wireframe');
    // view.originalMeshGUI.addColor(param,'color').onChange(param.update);


};

meshModifier.prototype.setupPlanes = function () {

    var view = this;

    view.planes = new THREE.Group();
    scene.add(view.planes);

    view.startUI = new dat.GUI();

    alert('Please adjust the waist line height');
    view.addControlPlane(0);



};

meshModifier.prototype.addControlPlane = function (height,name,goBack) {

    var view = this;

    // ADD PLANE //

    if(height == undefined) {

        var name = prompt('Please specify the name of the control Plane');

        if(name == null) return;

        height = Number(prompt('please specify the height of '+name+' relative to waist line','100'));

    }


    //var geometry = new THREE.PlaneBufferGeometry(500,500);
    var geometry = new THREE.BoxBufferGeometry(500,500,4);
    var material = new THREE.MeshPhongMaterial( { depthWrite:false,transparent: false, opacity:1 , side: THREE.DoubleSide } );
    var mesh = new THREE.Mesh( geometry, material );
    mesh.rotation.x = -Math.PI/2;
    mesh.height = height;
    mesh.material.color.setHex(0x4D789C);

    var grid = new THREE.GridHelper( 250, 50 );
    grid.rotation.x = -Math.PI/2;
    grid.material.color.setHex(0x4D789C);


    mesh.add( grid );

    //initialize planes
    if(!view.planes){
        view.planes = new THREE.Group();
        scene.add(view.planes);
    }

    // add the brace frame
    if(view.planes.children.length ==0){

        //var geometry = new THREE.CylinderBufferGeometry( 200, 200, 480, 32 );
        var geometry = new THREE.BoxBufferGeometry(500,480,500);
        var material = new THREE.MeshPhongMaterial( { depthWrite:false,transparent: true, opacity:0.3 , side: THREE.DoubleSide } );
        var frame = new THREE.Mesh( geometry, material );
        frame.rotation.x = -Math.PI/2;
        frame.position.z = -view.app.waistOffset;
        mesh.add(frame);

        var boxHelper = new THREE.BoxHelper( frame );
        boxHelper.material.color.set( 0xff0000 );
        mesh.add( boxHelper );
    }


    view.planes.add(mesh);

    updatePlanes();
    mesh.oldPosition = mesh.position.clone();

    // END //


    // ADD GUI FOR PLANES //

    if(!view.startUI) view.startUI = new dat.GUI();

    if(view.planes.children.length == 1) {

        view.startUI.add(mesh,'height').name('waist line height(mm)').step(1).onChange(updatePlanes);
        mesh.name = 'waist line';

        if(view.addPlane) view.startUI.remove(view.addPlane);
        view.addPlane = view.startUI.add(view,'addControlPlane');

        //if triggered by history commend, do not record
        if(!goBack) view.app.actionRecorder.recordPlane('add plane');


    }
    else {

        view.startUI.add(mesh,'height').name(name + ' height(mm)').step(1).onChange(updatePlanes);
        mesh.name = name;

        if(view.addPlane) view.startUI.remove(view.addPlane);
        view.addPlane = view.startUI.add(view,'addControlPlane');


        // if(view.confirm) view.startUI.remove(view.confirm);
        // view.confirm = view.startUI.add(view,'setupCurveMorph').name('confirm planes!');

        //if triggered by history commend, do not record
        if(!goBack) view.app.actionRecorder.recordPlane('add plane');


    }

    // END //


    // update the plane according to relative height to waist line
    function updatePlanes() {

        view.planes.children[0].position.y =  view.planes.children[0].height;
        view.waistHeight = view.planes.children[0].height;

       for(var i=1;i<view.planes.children.length;i++){

           view.planes.children[i].position.y =  view.planes.children[i].height + view.planes.children[0].height;

       }

    }




};

meshModifier.prototype.createBrush = function () {


    var view = this;

    view.attractor = new Attractor({

        position:[0,0,0],

        fallOffType: 'cos',

        range:50,

        intensity: 2,

        createSphere: true

    });

    view.attractor.mesh.visible = false;

    view.brushUI = new dat.GUI();

    var folder = view.brushUI.addFolder('Brush');

    // switch to open/close brush
    // folder.add(view,'brushOn').onChange(function () {
    //
    //     view.attractor.mesh.visible = view.brushOn;
    //     view.editCurve = !view.brushOn;
    //
    //     for(var i = 0; i<view.curves.length;i++){
    //
    //         view.curves[i].visible = view.editCurve;
    //
    //     }
    //
    //     if(!view.editCurve) view.closeTransform();
    //
    // });

    folder.add(view,'brushType',['sculpt','smooth']).listen();

    folder.add(view.attractor,'range',0,200).onChange(function () {

        view.attractor.mesh.scale.set(view.attractor.range,view.attractor.range,view.attractor.range);

    }).listen();

    folder.add(view.attractor,'intensity',-4,4).listen();

    view.brushUI.add(view.meshSmooth,'smooth').name('Smooth All');

    folder.open();



};

meshModifier.prototype.openBrush = function () {

    var view = this;

    view.on = true;
    view.brushOn = true;

    view.attractor.mesh.visible = view.brushOn;
    view.editCurve = !view.brushOn;

    for(var i = 0; i<view.curves.length;i++){

        view.curves[i].visible = view.editCurve;

    }

    if(!view.editCurve) view.closeTransform();

    if(view.brushUI) $(view.brushUI.domElement).attr("hidden", !view.brushOn);

};

meshModifier.prototype.closeBrush = function () {

    var view = this;

    view.brushOn = false;

    view.attractor.mesh.visible = view.brushOn;
    view.editCurve = !view.brushOn;

    for(var i = 0; i<view.curves.length;i++){

        view.curves[i].visible = view.editCurve;

    }

    if(!view.editCurve) view.closeTransform();

    if(view.brushUI) $(view.brushUI.domElement).attr("hidden", !view.brushOn);

};

meshModifier.prototype.interactive = function () {

    var view = this;

    // EVENT LISTENERS FOR PLANES //

    window.addEventListener("mouseup", recordPlane);
    window.addEventListener("keyup", recordPlane);

    function recordPlane() {

        //if(!view.planes) return; //terminate when went back from stage 3,2,1 to 0

        if(view.app.stage !=1) return;

        if(view.planes.visible){


            for(var i=0;i<view.planes.children.length;i++){

                var thisPlane = view.planes.children[i];
                if(thisPlane.position.distanceTo(thisPlane.oldPosition)!=0){

                    view.app.actionRecorder.recordPlane('edit plane '+ i);
                    break;

                }
            }


            for(var i=0;i<view.planes.children.length;i++){

                var thisPlane = view.planes.children[i];
                thisPlane.oldPosition.copy(thisPlane.position);

            }

        }

    }

    // END //



    // EVENT LISTENERS FOR BRUSH //

    var raycaster = new THREE.Raycaster();

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );


    function onDocumentMouseMove( event ) {

        if(!view.on) return;
        if(!view.brushOn) return;

        event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;



        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObject( view.mesh );
        if ( intersects.length > 0 ) {

            view.attractor.mesh.visible= true;
            view.attractor.position.copy(intersects[0].point);

        }else{

            view.attractor.mesh.visible= false;

        }



    }


    function onDocumentMouseDown() {

        if(!view.on) return;
        if(!view.brushOn) return;

        raycaster.setFromCamera( mouse, camera );
        var intersects = raycaster.intersectObject( view.mesh );
        if ( intersects.length > 0 ) {

            controls.enabled = false;

            view.applyBrush();

        }

    }

    function onDocumentMouseUp(  ) {

        if(!view.on) return;
        if(!view.brushOn) return;

        controls.enabled = true;

    }

    // END //

};

meshModifier.prototype.applyBrush = function (content) {

    var view = this;

    view.currentBrush = {};

    view.currentBrush.brushType = view.brushType;

    view.currentBrush.position = view.attractor.position.clone();

    view.currentBrush.range = view.attractor.range;

    view.currentBrush.intensity = view.attractor.intensity;

    console.log(view.currentBrush);

    if(content){

        view.brushType = content.type;

        view.attractor.position.copy(content.position);

        view.attractor.range = content.range;

        view.attractor.intensity = content.intensity;

    }

    console.log(view.brushType);

    var vertices = [];

    for(var i=0;i<view.mesh.geometry.vertices.length;i++){

        var vertex = view.mesh.geometry.vertices[i];
        var normal = view.mesh.geometry.normals[i];

        if(vertex.distanceTo(view.attractor.position)<view.attractor.range){

            if(view.brushType == 'sculpt'){

                var value = view.attractor.cos(vertex.x,vertex.y,vertex.z);
                vertex.add(normal.multiplyScalar(value));

            }


            vertices.push(vertex);

        }
    }


    if(view.brushType == 'smooth') view.meshSmooth.smooth(vertices);


    view.mesh.geometry.verticesNeedUpdate = true;

    view.mesh.geometry.computeVertexNormals();


    // record step



    var content = {

        name: view.brushType,

        type: view.brushType,

        position: view.attractor.position.clone(),

        range: view.attractor.range,

        intensity: view.attractor.intensity,

        toExecute: function () {

            view.brushType = content.type;

            view.attractor.position.copy(content.position);

            view.attractor.range = content.range;

            view.attractor.intensity = content.intensity;

            var vertices = [];

            for(var i=0;i<view.mesh.geometry.vertices.length;i++){

                var vertex = view.mesh.geometry.vertices[i];
                var normal = view.mesh.geometry.normals[i];

                if(vertex.distanceTo(view.attractor.position)<view.attractor.range){

                    if(view.brushType == 'sculpt'){

                        var value = view.attractor.cos(vertex.x,vertex.y,vertex.z);
                        vertex.add(normal.multiplyScalar(value));

                    }


                    vertices.push(vertex);

                }
            }

            if(view.brushType == 'smooth') view.meshSmooth.smooth(vertices);

            view.mesh.geometry.verticesNeedUpdate = true;

            view.mesh.geometry.computeVertexNormals();

        },

        previous: view.brushSteps.slice(0) // this is the clone of brush history list

    };

    view.brushSteps.push(content);

    console.log(content);

    view.app.actionRecorder.recordBrush(undefined,content);




    // recover current Brush

    view.brushType = view.currentBrush.brushType;

    view.attractor.position.copy(view.currentBrush.position);

    view.attractor.range = view.currentBrush.range;

    view.attractor.intensity = view.currentBrush.intensity;


    // console.log('recovered');
    // console.log(view.brushType);


};

meshModifier.prototype.setupCurveMorph = function () {

    var view = this;

    view.on = true; // enable setupTransformControl
    view.editCurve = true;

    view.controlPoints = [];
    view.curves = [];

    view.planes.visible = false;


    if(view.startUI) {
        view.startUI.destroy();
        view.startUI = null;
    }


    view.app.wrapSurface.input.nurbsSurfaceSetting.center[1] = view.waistHeight - view.app.waistOffset; // wrap surface according to waistline



    for(var i=0; i<view.planes.children.length; i++){

        view.createCurve(view.planes.children[i].position.y);

    }

    // keep transform control on top
    if(view.transformControl) scene.remove(view.transformControl);
    scene.add(view.transformControl);

    //  ASSIGN CURVE WEIGHTS //

    var vertices = view.mesh.geometry.vertices;

    // create attractors & calculate attractor weights
    for(var i=0; i<vertices.length; i++){

        var totalWeight = 0;

        vertices[i].attractors = [];

        for(var k = 0; k<view.curves.length;k++){

            // use the closest point on curve as attractor
            var closestIndex = -1, closestDis = 1000000000;

            for(var j=0;j<view.curves[k].geometry.vertices.length;j++){

                var vertexOnCurve = view.curves[k].geometry.vertices[j].clone().applyMatrix4( view.curves[k].matrixWorld );

                var distance = vertexOnCurve.distanceTo(vertices[i]);

                if( distance < closestDis){

                    closestIndex = j;
                    closestDis = distance;

                }

            }

            var attractor = new Attractor({

                position: view.curves[k].geometry.vertices[closestIndex],

                range: 100

            });

            attractor.matrixWorld = view.curves[k].matrixWorld.clone();

            attractor.weight = attractor.cos( vertices[i].x, vertices[i].y, vertices[i].z);

            totalWeight+=attractor.weight;


            vertices[i].attractors[k] = {curve: k, vertex: closestIndex, weight: attractor.weight}; // store the curve index and vertices index on this curve


        }

        // average out the weights in between curve attractors
        if(totalWeight>1){

            for(var k = 0; k<vertices[i].attractors.length;k++){

                vertices[i].attractors[k].weight /= Math.pow(totalWeight,1/2);

                //vertices[i].attractors[k].weight = (1-(totalWeight-1))*vertices[i].attractors[k].weight;

            }
        }



    }


    for(var i=0; i<view.curves.length; i++) {

        view.curves[i].oldMatrixWorld = view.curves[i].matrixWorld.clone();

        for (var j = 0; j < view.curves[i].geometry.vertices.length; j++) {

            view.curves[i].geometry.vertices[j].oldPosition = view.curves[i].geometry.vertices[j].clone();

        }
    }

    // END //

};

meshModifier.prototype.setupTransformControl = function () {


    var view = this;

    var transformControl;

    var raycaster = new THREE.Raycaster();

    transformControl = new THREE.TransformControls( camera, renderer.domElement );
    transformControl.setTranslationSnap( 1 );
    transformControl.setRotationSnap( THREE.Math.degToRad( 1 ) );
    transformControl.space = "local";
    view.transformControl = transformControl;

    if(view.editCurve) scene.add( transformControl );

    transformControl.addEventListener( 'change', function () {

        for(var i=0;i<view.curves.length;i++){

            view.curves[i].updateCurve();

        }

    } );



    var highlight,highlight2;
    var raycaster = new THREE.Raycaster();
    var SELECTED = null;
    var CHANGED = null;

    var selected;


    var param = {x: 0, y: 0, z:0 , update:function () {

        if(selected) {

            selected.rotation.x = param.x * Math.PI / 180;
            selected.rotation.y = param.y * Math.PI / 180;
            selected.rotation.z = param.z * Math.PI / 180;

        }


    }};

    function updateAll() {

        view.transformControl.update();

        for(var i=0;i<view.curves.length;i++){

            view.curves[i].updateCurve();

        }

        view.updateFromCurve();

    }



    // EVENT FUNCTIONS //
    view.controlsChange = function () {

        if(transformControl) transformControl.update();

    };
    view.transformControlChange = function () {

        if(selected) {

            param.x = selected.rotation.x * 180 / Math.PI;
            param.y = selected.rotation.y * 180 / Math.PI;
            param.z = selected.rotation.z * 180 / Math.PI;

        }

        console.log('transformControl change, update the scan geometry');

        view.updateFromCurve();

    };
    view.keydown = function ( event ) {

        if(!view.on) return;

        switch ( event.keyCode ) {
            // case 81: // Q
            //     transformControl.setSpace( transformControl.space === "local" ? "world" : "local" );
            //     break;
            // case 17: // Ctrl
            //     transformControl.setTranslationSnap( 10 );
            //     transformControl.setRotationSnap( THREE.Math.degToRad( 15 ) );
            //     break;
            case 87: // W
                transformControl.setMode( "translate" );
                break;
            case 69: // E
                transformControl.setMode( "rotate" );
                break;
            // case 82: // R
            //     transformControl.setMode( "scale" );
            //     break;
            case 187:
            case 107: // +, =, num+
                transformControl.setSize( transformControl.size + 0.1 );
                break;
            case 189:
            case 109: // -, _, num-
                transformControl.setSize( Math.max( transformControl.size - 0.1, 0.1 ) );
                break;
        }
    };
    view.keyup = function ( event ) {

        if(!view.on) return;

        // switch ( event.keyCode ) {
        //     case 17: // Ctrl
        //         transformControl.setTranslationSnap( null );
        //         transformControl.setRotationSnap( null );
        //         break;
        // }


        if(transformControl.visible && SELECTED) {

            if(!SELECTED.matrixWorld.equals(CHANGED.matrixWorld)){

                console.log('update Scan Vertices, record scan editing');

                view.updateFromCurve();
                SELECTED = CHANGED.clone();

                view.app.actionRecorder.recordMeshEdit();

            }

        }

    };
    // view.mousedown = function (event) {
    //
    //     if(!view.on) return;
    //     if(!view.editCurve) return;
    //
    //     event.preventDefault();
    //     mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    //     mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    //     raycaster.setFromCamera( mouse, camera );
    //     var intersects = raycaster.intersectObjects( view.controlPoints );
    //     if ( intersects.length > 0 ) {
    //
    //         //transformControl.attach( intersects[0].object );
    //         view.attachTransform();
    //         transformControl.visible = true;
    //         SELECTED = intersects[0].object.clone();
    //         CHANGED = intersects[0].object;
    //     }
    //
    //     intersects = raycaster.intersectObjects( view.curves );
    //     if ( intersects.length > 0 ) {
    //         view.attachTransform();
    //         //transformControl.attach( intersects[0].object );
    //         transformControl.visible = true;
    //         SELECTED = intersects[0].object.clone();
    //         CHANGED = intersects[0].object;
    //
    //     }
    //
    //
    //
    // };



    view.mousedown = function (event) {

        if(!view.on) return;
        if(!view.editCurve) return;

        //event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

        raycaster.setFromCamera( mouse, camera );

       var coverGroup = [view.app.scan].concat(view.controlPoints); // create this group on the go to prevent scan asynchronous loading problem
        //var intersects = raycaster.intersectObjects( view.controlPoints );
        var intersects = raycaster.intersectObjects( coverGroup );
        if ( intersects.length > 0 ) {

            if(intersects[0].object != view.app.scan) { // cover the back points by the scan geometry

                if(selected!=intersects[0].object && intersects[0].object != view.app.scan){


                    selected = intersects[0].object;

                    transformControl.attach( intersects[0].object );
                    transformControl.visible = true;


                    if(view.transformGUI) {view.transformGUI.destroy();view.transformGUI = null;}

                    view.transformGUI = new dat.GUI();

                    var position = view.transformGUI.addFolder('position');
                    position.add(intersects[0].object.position,'x').listen().onChange(updateAll);
                    position.add(intersects[0].object.position,'y').listen().onChange(updateAll);
                    position.add(intersects[0].object.position,'z').listen().onChange(updateAll);
                    position.open();


                }


                SELECTED = intersects[0].object.clone();
                CHANGED = intersects[0].object;

            }



        }

        var coverGroup = [view.app.scan].concat(view.curves); // create this group on the go to prevent scan asynchronous loading problem
        //var intersects = raycaster.intersectObjects( view.curves );
        var intersects = raycaster.intersectObjects( coverGroup );
        if ( intersects.length > 0 && intersects[0].object!=view.app.scan) {

            if(selected!=intersects[0].object){


                selected = intersects[0].object;

                transformControl.attach( intersects[0].object );
                transformControl.visible = true;


                if(view.transformGUI) {view.transformGUI.destroy();view.transformGUI = null;}

                view.transformGUI = new dat.GUI();

                var position = view.transformGUI.addFolder('position');
                position.add(intersects[0].object.position,'x').listen().onChange(updateAll);
                position.add(intersects[0].object.position,'y').listen().onChange(updateAll);
                position.add(intersects[0].object.position,'z').listen().onChange(updateAll);
                position.open();

                var rotation = view.transformGUI.addFolder('rotation');
                rotation.add(param,'x').listen().onChange(param.update);
                rotation.add(param,'y').listen().onChange(param.update);
                rotation.add(param,'z').listen().onChange(param.update);
                rotation.open();

            }

            SELECTED = intersects[0].object.clone();
            CHANGED = intersects[0].object;

        }

    };
    view.dblclick = function () {

        if(!view.on) return;

        view.closeTransform();
        selected = null;

    };
    view.mouseup = function () {

        if(!view.on) return;

        if(transformControl.visible && SELECTED) {

            if(!SELECTED.matrixWorld.equals(CHANGED.matrixWorld)){

                console.log('update Scan Vertices, record scan editing');

                view.updateFromCurve();
                SELECTED = CHANGED.clone();

                view.app.actionRecorder.recordMeshEdit();

            }

        }

    };
    view.mousemove =  function (event) {


        if(!view.on) return;
        if(!view.editCurve) return;



        //event.preventDefault();
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;



        raycaster.setFromCamera( mouse, camera );

        var coverGroup = [view.app.scan].concat(view.controlPoints); // create this group on the go to prevent scan asynchronous loading problem
        //var intersects = raycaster.intersectObjects( view.controlPoints );
        var intersects = raycaster.intersectObjects( coverGroup );
        if ( intersects.length > 0 && intersects[0].object != view.app.scan) {


            if( highlight && highlight != intersects[0].object) highlight.material.color.set(0xffffff);
            highlight = intersects[0].object;
            highlight.material.color.set(0xffff00);


        }else{

            if(highlight){
                highlight.material.color.set(0xffffff);
                highlight = null;

            }

        }

        var coverGroup = [view.app.scan].concat(view.curves); // create this group on the go to prevent scan asynchronous loading problem
        //var intersects = raycaster.intersectObjects( view.curves );
        var intersects = raycaster.intersectObjects( coverGroup );

        if ( intersects.length > 0 && intersects[0].object != view.app.scan) {

            if( highlight2 && highlight2 != intersects[0].object) highlight2.material.color.set(0xffffff);
            highlight2 = intersects[0].object;
            highlight2.material.color.set(0xffff00);

        }else{

            if(highlight2){
                highlight2.material.color.set(0x909090);
                highlight2 = null;

            }

        }



        // if(transformControl.visible && SELECTED) {
        //
        //     console.log('updating scan mesh');
        //     view.updateFromCurve();
        //
        // }



    };

    controls.addEventListener( 'change', view.controlsChange );
    transformControl.addEventListener( 'change', view.transformControlChange );
    document.addEventListener( 'keydown', view.keydown);
    document.addEventListener( 'keyup', view.keyup );
    container.addEventListener( 'mousedown', view.mousedown , false );
    container.addEventListener("dblclick",  view.dblclick );
    container.addEventListener("mouseup", view.mouseup );
    container.addEventListener( 'mousemove', view.mousemove , false );

    // END //


};

meshModifier.prototype.diposeTranformControl = function () {

    var view = this;

    controls.removeEventListener( 'change', view.controlsChange );
    document.removeEventListener( 'keydown', view.keydown);
    document.removeEventListener( 'keyup', view.keyup );
    container.removeEventListener( 'mousedown', view.mousedown , false );
    container.removeEventListener("dblclick",  view.dblclick );
    container.removeEventListener("mouseup", view.mouseup );
    container.removeEventListener( 'mousemove', view.mousemove , false );


    if(view.transformGUI) {view.transformGUI.destroy();view.transformGUI = null;}

    view.closeTransform();

    if(view.transromControl) {
        scene.remove(view.transromControl);
        view.transromControl.dispose();
    }

};

meshModifier.prototype.closeTransform = function () {

    var view = this;

    view.transformControl.detach();
    if(view.transformGUI) {view.transformGUI.destroy();view.transformGUI = null;}

};

meshModifier.prototype.createCurve = function (height) {


    var view = this;

    var divisionU = 10;
    var center = [0,0,0];


    var o = new THREE.Vector3(0,0.12,0.2);
    var dir = new THREE.Vector3(0,1,0);
    var thisRay = new THREE.Ray(o,dir);
    var a = new THREE.Vector3(100,0,0);
    var b = new THREE.Vector3(100,1,0);
    var c = new THREE.Vector3(100,0,1);



    var points = [];

    var controlPointGroup = new THREE.Group();

    for (var u = 0; u < divisionU; u++) {

        o.set(center[0],height,center[2]);

        dir.set(Math.sin(Math.PI+u * Math.PI * 2 / (divisionU)), 0, Math.cos(Math.PI+u * Math.PI * 2 / (divisionU)));

        for(var i=0;i<view.mesh.geometry.faces.length;i++){

            var face = view.mesh.geometry.faces[i];

            a = view.mesh.geometry.vertices[face.a];
            b = view.mesh.geometry.vertices[face.b];
            c = view.mesh.geometry.vertices[face.c];

            var intersect = thisRay.intersectTriangle(a,b,c,false);
            if(intersect) {


                var geometry = new THREE.SphereBufferGeometry(1,32,32);

                var material = new THREE.MeshPhongMaterial({color: 0xffffff});

                var mesh = new THREE.Mesh(geometry,material);

                mesh.scale.set(10,10,10);

                var offset = dir.clone().multiplyScalar(5);

                intersect.add(offset);

                mesh.position.copy(intersect);

                points.push(mesh.position);

                view.controlPoints.push(mesh);

                controlPointGroup.add(mesh);

            }

        }

    }


    //scene.add(controlPointGroup);
    var curve = new closedCurve({

        controlPoints:controlPointGroup,

        closed: true,

        centerGeometry: true

    });
    view.curves.push(curve);

};

meshModifier.prototype.updateFromCurve = function () {

    // UPDATE FROM ORIGINAL MESH VERTICES //
    var view = this;

    var vertices = view.mesh.geometry.vertices;

    // initialise vertices of current mesh
    for(var i=0; i<vertices.length; i++){

        vertices[i].copy(view.originalMesh.geometry.vertices[i]);

    }

    // add affection from attractors to each vertices
    for(var i=0; i<vertices.length; i++){
        for(var j=0; j<vertices[i].attractors.length;j++){

            var attractor = vertices[i].attractors[j];
            var vertex = view.curves[attractor.curve].geometry.vertices[attractor.vertex];
            var curve = view.curves[attractor.curve];

            var oldPos =  vertex.oldPosition.clone().applyMatrix4(curve.oldMatrixWorld);
            var currentPos =  vertex.clone().applyMatrix4(curve.matrixWorld);
            vertices[i].add( currentPos.sub( oldPos ).multiplyScalar( attractor.weight ));

        }
    }

    view.mesh.geometry.computeVertexNormals();
    view.mesh.geometry.verticesNeedUpdate = true;

    // END //

};

meshModifier.prototype.disposeCurves = function () {

    var view = this;

    view.editCurve = false;

    if(!view.curves) return;

    // view.transformControl.dispose();
    // scene.remove(view.transformControl);
    // view.transformControl = null;

    view.closeTransform();


    for(var i=0; i<view.curves.length;i++){

        view.curves[i].traverse( function(child) {

            scene.remove(child);

        });

    }


    view.controlPoints = [];
    view.curves = [];

};

meshModifier.prototype.disposePlanes = function () {

    var view = this;


    // dispose gui for planes
    if(view.startUI) {
        view.startUI.destroy();
        view.startUI = null;
    }
    if(view.addPlane) view.addPlane = null;
    if(view.confirm ) view.confirm = null;

    // dispose old planes
    if(view.planes){
        scene.remove(view.planes);
        view.planes = null;
    }



};

meshModifier.prototype.disposeBrush = function () {

    var view = this;

    // dispose gui for brush
    if(view.brushUI) {
        view.brushUI.destroy();
        view.brushUI = null;
    }

    // dispose brush mesh
    scene.remove(view.attractor);
    view.attractor = null;

    // restore flags
    view.brushOn = false;
    view.editCurve = true;

};

meshModifier.prototype.hide = function () {

    var view = this;
    view.on = false;

    view.closeBrush();


    if(view.curves) for(var i = 0; i<view.curves.length;i++){

        view.curves[i].visible = false;

    }

    if(view.closeTransform) view.closeTransform();
    //if(view.brushUI) view.brushUI.close();
    if(view.brushUI) $(view.brushUI.domElement).attr("hidden", true);
    if(view.startUI) {
        //view.startUI.close();
        $(view.startUI.domElement).attr("hidden", true);
        view.planes.visible = false;
    }

};

meshModifier.prototype.show = function () {

    var view = this;
    view.on = true;

    if(view.curves) for(var i = 0; i<view.curves.length;i++){

        view.curves[i].visible = true;

    }

    //if(view.brushUI) view.brushUI.open();
    if(view.brushUI) $(view.brushUI.domElement).attr("hidden", false);
    if(view.startUI) {
        //view.startUI.open();
        $(view.startUI.domElement).attr("hidden", false);
        view.planes.visible = true;
    }
};

meshModifier.prototype.reset = function () {

    var view = this;

    view.disposeCurves();
    view.disposePlanes();


    view.startUI = new dat.GUI();

    alert('Please adjust the waist line height');
    view.addControlPlane(0);

};