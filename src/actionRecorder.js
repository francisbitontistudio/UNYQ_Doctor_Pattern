/**
 * Created by Li on 4/25/2017.
 */

var actionRecorder = function (app) {

    var view = this;

    view.list = [];

    view.names = [];

    view.selected = '';

    view.currentStep = 0;

    view.app = app; // get access to the app

    view.meshClones = [];

    view.mileStones = [];

    //view.fileGUI = new dat.GUI();



    //view.guiAction = new dat.GUI();
    //view.guiList = view.app.guiScan.add(view,'selected',view.names).name('command history');


    view.guiList = view.app.guiScan.add(view,'selected',view.names).name('command history').listen().onChange(function () {

        for(var i=0;i<view.names.length;i++){

            if(view.names[i] == view.selected) {

                view.rollBackCheck(i);

            }

        }

    });

    view.app.guiScan.add(view,'save');
    //view.app.guiScan.add(view,'load');

};


actionRecorder.prototype.addAction = function (name,stage,command,execute) {


    var view = this;



    view.list = view.list.slice(0,view.currentStep);
    view.names = view.names.slice(0,view.currentStep);

    // view.list.splice(view.currentStep,view.list.length - view.currentStep);
    // view.names.splice(view.currentStep,view.list.length - view.currentStep);

    view.currentStep++;

    var action = {

        name: name,

        stage: stage,

        command: command,

        execute:execute

    };

    view.names.push(view.list.length+': '+name);
    view.list.push(action);

    //view.app.guiScan.remove(view.guiList);


    view.selected = view.names[view.names.length-1];


    view.guiList = view.guiList.options(view.names).onChange(function () {

        for(var i=0;i<view.names.length;i++){

            if(view.names[i] == view.selected) {

                view.rollBackCheck(i);

            }

        }

    });

    view.guiList.name('command history');


    //view.guiList.setValue(view.selected);


    // view.guiList = view.app.guiScan.add(view,'selected',view.names).name('command history').onChange(function () {
    //
    //     for(var i=0;i<view.names.length;i++){
    //
    //         if(view.names[i] == view.selected) {
    //
    //             view.rollBackCheck(i);
    //
    //         }
    //
    //     }
    //
    // });
};

actionRecorder.prototype.recordTransform = function (content) {

    var view = this;


    var mesh = view.app.scan;




    // detect the kind of transform: translate,rotate or scale
    if(!mesh.positionOld){

        mesh.positionOld = mesh.position.clone();
        mesh.rotationOld = {x:mesh.rotation.x,y:mesh.rotation.y,z:mesh.rotation.z};

    }

    var name ='load the file';
    if(mesh.positionOld.distanceTo(mesh.position)!=0) name = 'translate';
    if(!(mesh.rotationOld.x == mesh.rotation.x && mesh.rotationOld.y == mesh.rotation.y && mesh.rotationOld.z == mesh.rotation.z)) name = 'rotation';

    mesh.positionOld = mesh.position.clone();
    mesh.rotationOld = mesh.rotation.clone();

    content = content || {

            name: name,
            position: mesh.position.clone(),
            rotation: mesh.rotation.clone(),
            type:'recordTransform'
            //mesh: mesh.clone()

        };


    view.addAction(content.name,0,content,function () {

        mesh.position.copy(content.position);
        mesh.rotation.copy(content.rotation);
        mesh.updateMatrixWorld();
        mesh.matrixWorldOld.copy(mesh.matrixWorld);

        // mesh.copy(content.mesh);
        // mesh.matrixWorldOld.copy(mesh.matrixWorld);

    });

};

actionRecorder.prototype.startPlane = function () {

    var view = this;

    var mesh = view.app.scan;

    var content = {

        type: 'startPlane'

    };

    view.saveMesh(mesh,1); // store the mesh for stage 1


    view.addAction('--- start edit plane ---',1,content,function () {


        view.loadMesh(mesh,1); // read the mesh from beginning of stage 1
        view.app.meshModifier.reset(); // reset to add first plane
        view.app.guild.visible = false; // hide guild planes

    });


    // record mile stone, need to be after view.addAction which updates view.currentStep
    view.recordMileStone(0);

};

actionRecorder.prototype.recordPlane = function (name,content) {

    var view = this;

    var heights = [];
    var names = [];

    var modifier = view.app.meshModifier;

    if(!content){

        for(var i=0;i<modifier.planes.children.length;i++){

            heights.push(modifier.planes.children[i].height);
            names.push(modifier.planes.children[i].name);

        }

    }

    // console.log('record plane');
    // console.log(heights);

    content = content||{

        type:'recordPlane',
        heights: heights,
        names: names,
        name:name

    };

    view.addAction(content.name,1,content,function () {


        modifier.disposePlanes();

        for(var i =0; i<content.heights.length;i++){

            modifier.addControlPlane(content.heights[i],content.names[i],true);

        }

        view.app.guild.visible = false; // hide guild planes

    });




};

actionRecorder.prototype.recordMeshEdit = function (name,mileStone,content) {

    // var view = this;
    //
    // var modifier = view.app.meshModifier;
    //
    // var curves = modifier.curves;
    //
    //
    // ///////////////////////////
    //
    // var curveGeos = [];
    // var positions = [];
    // var rotations = [];
    // var controlPts = [];
    //
    // for(var i=0; i<curves.length;i++){
    //
    //     curves[i].traverse( function(child) {
    //
    //         curveGeos.push(child.geometry ? child.geometry.clone() : undefined);
    //         positions.push(child.position.clone());
    //         rotations.push(child.rotation.clone());
    //
    //     });
    //
    //
    //     var pts = [];
    //
    //     for(var j=0;j<curves[i].controlPts.length;j++){
    //
    //         pts.push(curves[i].controlPts[j].clone());
    //
    //     }
    //
    //     controlPts.push(pts);
    // }
    //
    //
    // var content = {
    //
    //     curveGeos: curveGeos,
    //     positions: positions,
    //     rotations: rotations,
    //     controlPts: controlPts
    //
    // };
    //
    //
    //
    //
    // ////////////////////////
    //
    //
    // name = name || 'edit scan';
    //
    // view.addAction(name,2,content,function () {
    //
    //
    //
    //     var count = 0;
    //
    //     for(var i=0; i<curves.length;i++){
    //
    //         curves[i].traverse( function(child) {
    //
    //             if(child.geometry instanceof THREE.Geometry) {
    //
    //                 for(var j=0; j<child.geometry.vertices.length;j++){
    //                     child.geometry.vertices[j].copy(content.curveGeos[count].vertices[j]);
    //                 }
    //
    //             }
    //
    //             child.position.copy(content.positions[count]);
    //             child.rotation.copy(content.rotations[count]);
    //             child.updateMatrixWorld();
    //             child.updateMatrix();
    //             count++;
    //
    //         });
    //
    //         for(var j=0;j<curves[i].controlPts.length;j++){
    //
    //             curves[i].controlPts[j].copy(content.controlPts[i][j]);
    //
    //         }
    //
    //         curves[i].updateCurve();
    //
    //     }
    //
    //     modifier.closeTransform(); // prevent double updating
    //     modifier.updateFromCurve();
    //
    //
    // });
    //
    //
    // // record mile stone, need to be after view.addAction which updates view.currentStep
    // if(mileStone!= undefined) view.recordMileStone(mileStone);


    var view = this;

    var modifier = view.app.meshModifier;


    if(!content){

        var curves = [];

        for(var i=0; i<modifier.curves.length;i++){

            var controlPts = [];

            for(var j=0; j<modifier.curves[i].controlPts.length;j++){

                controlPts[j] = modifier.curves[i].controlPts[j].clone();

            }


            curves[i] = {

                position: modifier.curves[i].position.clone(),
                rotation: modifier.curves[i].rotation.clone(),
                controlPts: controlPts

            }

        }

    }


    name = name || 'edit scan';

    content = content||{

            name: name,

            type: 'recordMeshEdit',

            curves: curves

    };


    view.addAction(content.name,2,content,function () {


        for(var i=0; i<modifier.curves.length;i++){

            modifier.curves[i].position.copy(content.curves[i].position);
            modifier.curves[i].rotation.copy(content.curves[i].rotation);
            modifier.curves[i].updateMatrixWorld();

            for(var j=0; j<modifier.curves[i].controlPts.length;j++){

                modifier.curves[i].controlPts[j].copy(content.curves[i].controlPts[j]);

            }

            modifier.curves[i].updateCurve();

        }

        modifier.closeTransform(); // prevent double updating
        modifier.updateFromCurve();

    });


    // record mile stone, need to be after view.addAction which updates view.currentStep
    if(mileStone!= undefined) view.recordMileStone(mileStone);

};

actionRecorder.prototype.startBrush = function (mileStone,content) {

    var view = this;

    view.saveMesh(view.app.scan,2);


    content = content||{

            name: '-- start Brush --',

            type: 'startBrush'

        };


    view.addAction(content.name,3,content,function () {

        view.app.meshModifier.openBrush();

        // load mesh from beginning of sculpting
        view.loadMesh(view.app.scan,2);

        // reset brush step list
        view.app.meshModifier.brushSteps = [];

    });


    // record mile stone, need to be after view.addAction which updates view.currentStep
    if(mileStone!= undefined) view.recordMileStone(mileStone);

};

actionRecorder.prototype.recordBrush = function (mileStone,content) {

    var view = this;


    view.addAction(content.name,3,content,function () {

        view.app.meshModifier.openBrush();

        // load mesh from beginning of sculpting
        view.loadMesh(view.app.scan,2);

        // execute all previous steps

        for(var i=0;i<content.previous.length;i++){

            content.previous[i].toExecute();

        }

        content.toExecute();

        // rewrite the brush steps;
        view.app.meshModifier.brushSteps = content.previous;
        view.app.meshModifier.brushSteps.push(content);

        //console.log(view.app.meshModifier.brushSteps);

    });


    // record mile stone, need to be after view.addAction which updates view.currentStep
    if(mileStone!= undefined) view.recordMileStone(mileStone);

};

actionRecorder.prototype.recordBraceEdit = function (name,mileStone,content) {

    var view = this;


    // save control points UV
    var curves = view.app.surfaceMorph.curves;

    if(!content){

        var UVs = [];
        for(var i=0; i<curves.length;i++){

            UVs[i] = [];

            for(var j=0; j<curves[i].controlPts.length;j++){

                UVs[i][j] = curves[i].controlPts[j].clone();
                UVs[i][j].u = curves[i].controlPts[j].u;
                UVs[i][j].v = curves[i].controlPts[j].v;
                UVs[i][j].w = curves[i].controlPts[j].w;

            }

        }


        if(mileStone) var surface = {

            knots1: view.app.wrapSurface.verbSurface._data.knotsU,
            knots2: view.app.wrapSurface.verbSurface._data.knotsV,
            controlPts: view.app.wrapSurface.verbSurface._data.controlPoints

        }

    }




    content = content || {


            surface: surface,
            UVs: UVs,
            name: name,
            type: 'recordBraceEdit'

    };



    view.addAction(content.name || 'edit brace',4,content,function () {

        //console.log('just check');

        for(var i=0; i<curves.length;i++){


            for(var j=0; j<curves[i].controlPts.length;j++){

                curves[i].controlPts[j].copy(content.UVs[i][j]);
                curves[i].controlPts[j].u = content.UVs[i][j].u;
                curves[i].controlPts[j].v = content.UVs[i][j].v;
                curves[i].controlPts[j].w = content.UVs[i][j].w;

            }

            curves[i].updateCurve();

        }


    });



    // record mile stone, need to be after view.addAction which updates view.currentStep
    if(mileStone!= undefined) view.recordMileStone(mileStone);


};

actionRecorder.prototype.saveMesh = function (mesh, index) {

    var view = this;

    console.log('saving mesh');

    var clone = mesh.clone();
    clone.geometry = mesh.geometry.clone();

    view.meshClones[index] = clone;

    console.log('mesh saved');

};

actionRecorder.prototype.loadMesh = function (mesh, index) {

    var view = this;

    // update matrix
    mesh.copy(view.meshClones[index]);

    // update vertices
    for(var i=0; i<mesh.geometry.vertices.length;i++){
        mesh.geometry.vertices[i].copy(view.meshClones[index].geometry.vertices[i]);
    }
    mesh.geometry.computeVertexNormals();
    mesh.geometry.verticesNeedUpdate = true;



};

actionRecorder.prototype.rollBackCheck = function (index) {

    var view = this;

    console.log('current stage: ' + view.app.stage);
    console.log('go to stage: ' + view.list[index].stage);
    console.log('current step:' + view.currentStep);
    console.log('go back to step '+index);



    // when rolling back to scan placement , stage 0
    if(view.app.stage > 0 && view.list[index].stage == 0){

        if(!window.confirm("are you sure to go back?")) return;

        view.app.meshModifier.disposeBrush();
        view.app.meshModifier.disposeCurves();
        view.app.meshModifier.disposePlanes();
        view.loadMesh(view.app.scan,0); // restore mesh to stage 0

        $('#text').text('Please orientate 3D scan to the center of grid');

    }

    // // when going forward from stage 0 to 1 or later
    // if(view.app.stage == 0 && view.list[index].stage > 0){
    //
    //     view.loadMesh(view.app.scan,1); // restore mesh to stage 1
    //     view.app.guild.visible = true; // show guild planes
    //
    // }


    // when rolling back from control pt editing to plane editing
    if(view.app.stage > 1 && view.list[index].stage == 1){

        if(!window.confirm("are you sure to go back?")) return;

        // the brush is created before this stage, so we should hide the brush rather than dispose it
        view.app.meshModifier.closeBrush();
        //view.app.meshModifier.disposeBrush();
        view.app.meshModifier.disposeCurves();
        view.loadMesh(view.app.scan,1); // restore mesh to stage 1

        $('#text').text('Please use menu to insert control planes');

    }

    // // if going from other stages to 3
    // if(view.app.stage != 3 && view.list[index].stage == 3){
    //
    //     view.loadMesh(view.app.scan,3); // restore mesh to stage 3
    //
    //
    // }

    // if going back to control curve editing stage
    if(view.app.stage > 2 && view.list[index].stage == 2){

        if(!window.confirm("are you sure to go back?")) return;

        view.loadMesh(view.app.scan,1); // restore mesh to stage 1

        view.app.meshModifier.show();
        view.app.meshModifier.closeBrush();

        $('#text').text('Please move the curve or point to edit scan');

    }

    // if going back to brushing stage
    if(view.app.stage > 3 && view.list[index].stage == 3){

        if(!window.confirm("are you sure to go back?")) return;

        view.loadMesh(view.app.scan,2); // restore mesh to stage 2 after control curve editting
        view.app.meshModifier.show();
        view.app.meshModifier.openBrush();

        $('#text').text('Please click on the scan to sculpt or smooth');
    }

    // going from stage 4 to others
    if(view.app.stage == 4 && view.list[index].stage < 4){

        view.app.surfaceMorph.dispose();

        $('#text').text('Please move control points to edit brace');

    }




    // execute the history command
    view.currentStep = index+1;



    // update gui accordingly
    if(view.app.next){
        view.app.guiScan.remove(view.app.next);
        view.app.next = null;
    }
    if(view.list[index].stage ==0)view.app.next = view.app.guiScan.add(view.app,'editScan');
    if(view.list[index].stage ==1)view.app.next = view.app.guiScan.add(view.app,'confirmPlanes');
    if(view.list[index].stage ==2)view.app.next = view.app.guiScan.add(view.app,'confirmControlCurves');
    if(view.list[index].stage ==3)view.app.next = view.app.guiScan.add(view.app,'confirmScan');
    if(view.list[index].stage ==4)view.app.next = view.app.guiScan.add(view.app.surfaceMorph,'generateLattice');


    // if going from later stage, delete latest stage
    if(view.app.stage > view.list[index].stage){

        console.log('show mile stones');
        console.log(view.mileStones);

        var mileStone = view.mileStones[view.list[index].stage];

        // this will be adjusted according to brush operation history
        //if(view.list[index].stage==2) mileStone = view.mileStones[3];

        view.deleteActionFrom(mileStone);


    }

    // need to be after delete history, cuz sometimes execute will modify history
    view.list[index].execute();


    //update stage of app after all operations done
    view.app.stage = view.list[index].stage;

};

actionRecorder.prototype.recordMileStone = function (mileStone) {

    var view = this;

    view.mileStones[mileStone] = view.currentStep-1;

    console.log('register mile stone!');

    console.log(view.mileStones);

};

actionRecorder.prototype.deleteActionFrom = function (mileStone) {

    var view = this;

    view.list = view.list.slice(0,mileStone);
    view.names = view.names.slice(0,mileStone);



    //view.app.guiScan.remove(view.guiList);

    view.selected = view.names[view.currentStep-1];

    view.guiList = view.guiList.options(view.names);

    view.guiList.setValue(view.selected); // set value before adding on change event

    view.guiList.name('command history');

    view.guiList.onChange(function () {

        for(var i=0;i<view.names.length;i++){

            if(view.names[i] == view.selected) {

                view.rollBackCheck(i);

            }

        }

    });

    // console.log(view.currentStep);
    // console.log(view.selected);
    // console.log(mileStone);
    // console.log(view.names);

    // view.guiList = view.app.guiScan.add(view,'selected',view.names).name('command history').onChange(function () {
    //
    //     for(var i=0;i<view.names.length;i++){
    //
    //         if(view.names[i] == view.selected) {
    //
    //             view.rollBackCheck(i);
    //
    //         }
    //
    //     }
    //
    // });

};

actionRecorder.prototype.save = function () {

    var view = this;

    var contents = [];

    for(var i=0; i<view.list.length;i++){

        contents[i] = view.list[i].command;

    }


    var geometries = [];

    for(var i=0; i<view.meshClones.length;i++){

        if(view.meshClones[i]) geometries[i] = view.meshClones[i].toJSON();

    }


    var file = { "history": contents, "geometries": geometries,"stage": view.app.stage };

    file = JSON.stringify(file);

    var blob = new Blob([file], {type: "text/plain"});

    var name = prompt('please input the file name');

    if(name) saveAs(blob, name+".json");

};

actionRecorder.prototype.load = function (URL) {

    var view = this;

    $.getJSON(URL, function(data) {

        console.log(data);
        //data is the JSON string

        var parsed = 0;
        var total = 0;

        // count total number
        for(var i=0; i<data.geometries.length;i++){

            if(data.geometries[i]) total++;

        }

        var parsedGeometries = [];
        // load meshes for each stage
        for(var i=0; i<data.geometries.length;i++){

            data.geometries[i].index = i;

            if(data.geometries[i]) new THREE.ObjectLoader().parse(  data.geometries[i], function ( mesh ) {


                //data.geometries[i] = mesh;

                parsedGeometries.push(mesh);

                parsed++;

                if(parsed == total)  {

                    data.geometries = parsedGeometries;
                    startApp(data);

                }

            });

        }





    });


    function startApp(data){

        console.log('loading finished, starting the app!');

        // STAGE 0 //

        // initialise the scan mesh


        view.app.loadScanMesh(data.geometries[0]);

        // read command list
        for(var i=0; i<data.history.length;i++){

            var thisCommand = data.history[i];

            if(thisCommand.type == 'recordTransform') {

                view.recordTransform(thisCommand);
                if(i == data.history.length-1){

                    endLoading();
                    return;
                }

            }

        }

        // END //


        // STAGE 1 //

        // update the scan mesh
        view.saveMesh(data.geometries[1],1);
        view.loadMesh(view.app.scan,1);

        view.app.meshModifier.start();

        // read command list
        for(var i=0; i<data.history.length;i++){

            var thisCommand = data.history[i];

            if(thisCommand.type == 'startPlane') view.startPlane(thisCommand);

            if(thisCommand.type == 'recordPlane') {
                view.recordPlane(undefined,thisCommand);

                if(i == data.history.length-1){

                    endLoading();
                    return;
                }


            }



        }

        // END //




        // STAGE 2 //

        // execute latest command , apply planes
        var index = view.list.length-1;
        view.list[index].execute();
        view.app.stage = view.list[index].stage;

        // setup control curves
        view.app.meshModifier.setupCurveMorph();

        // read command list
        var mileStone = 1;
        for(var i=0; i<data.history.length;i++){

            var thisCommand = data.history[i];

            if(thisCommand.type == 'recordMeshEdit') {

                view.recordMeshEdit(undefined,mileStone,thisCommand);

                mileStone = undefined;  // register mile stone 1 for the first recordMeshEdit command

                if(i == data.history.length-1){

                    endLoading();
                    return;
                }

            }


        }

        // END //




        // STAGE 3 //

        // load the mesh
        view.saveMesh(data.geometries[2],2);
        view.loadMesh(view.app.scan,2);

        // read command list
        var mileStone = 2;
        for(var i=0; i<data.history.length;i++){

            var thisCommand = data.history[i];

            if(thisCommand.type == 'startBrush') {

                view.startBrush(mileStone,thisCommand);

                mileStone = undefined;  // register mile stone 1 for the first recordMeshEdit command



                view.app.meshModifier.openBrush();

                // load mesh from beginning of sculpting
                view.loadMesh(view.app.scan,2);

                // reset brush step list
                view.app.meshModifier.brushSteps = [];





                if(i == data.history.length-1){

                    endLoading();
                    return;
                }

            }

            if(thisCommand.type == 'sculpt' || thisCommand.type == 'smooth') {

                console.log(thisCommand);

                view.app.meshModifier.applyBrush(thisCommand);

                if(i == data.history.length-1){

                    endLoading();
                    return;
                }

            }

            if(thisCommand.type == 'smooth all') {


                view.app.meshModifier.meshSmooth.smooth();

                if(i == data.history.length-1){

                    endLoading();
                    return;
                }

            }

        }

        // END //





        // STAGE 4 //

        // execute latest command , apply scan vertices changes
        // var index = view.list.length-1;
        // view.list[index].execute();
        // view.app.stage = view.list[index].stage;

        view.saveMesh(data.geometries[3],3);
        view.loadMesh(view.app.scan,3);

        var mileStone = 3;
        // read command list
        for(var i=0; i<data.history.length;i++){

            var thisCommand = data.history[i];


            if(thisCommand.type == 'recordBraceEdit') {

                // load the surface
                if(thisCommand.surface != undefined) {

                    view.app.wrapSurface.loadSurface(thisCommand.surface.controlPts,thisCommand.surface.knots1,thisCommand.surface.knots2); // load the nurbs surface

                    view.app.confirmScan(true); // ASYNCHRONOUS setup up brace on nurbs without recording the action

                }

                view.recordBraceEdit(undefined,mileStone,thisCommand);


                mileStone = undefined; // register mile stone 3 for the first recordBraceEdit command

            }



        }

        // END //


        endLoading();





    }


    function endLoading() {


        // execute latest command
        var index = view.list.length-1;
        view.app.stage = view.list[index].stage;
        view.list[index].execute();


        // update gui accordingly
        if(view.app.next){
            view.app.guiScan.remove(view.app.next);
            view.app.next = null;
        }
        if(view.list[index].stage ==0)view.app.next = view.app.guiScan.add(view.app,'editScan');
        if(view.list[index].stage ==1)view.app.next = view.app.guiScan.add(view.app,'confirmPlanes');
        if(view.list[index].stage ==2)view.app.next = view.app.guiScan.add(view.app,'confirmControlCurves');
        if(view.list[index].stage ==3)view.app.next = view.app.guiScan.add(view.app,'confirmScan');
        //if(view.list[index].stage ==4)view.app.next = view.app.guiScan.add(view.app.surfaceMorph,'generateLattice');



    }



};