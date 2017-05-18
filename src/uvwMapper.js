/**
 * Created by LI on 4/5/2017.
 */

var uvwMapper = function (input) {

    var view = this;

    view.input = input;

    view.includeW = input.includeW || false;

    view.quad = input.quad || false;

    view.load();

};


uvwMapper.prototype.load = function () {

    var view = this;

    if(view.quad){

        console.log('load ply');

        new THREE.PLYLoader().load(view.input.mesh,function (object) {

            console.log(object);

            var mesh = new THREE.Mesh(object, new THREE.MeshPhongMaterial());

            mesh.material.vertexColors = THREE.VertexColors;
            mesh.material.side = THREE.DoubleSide;

            view.brace = mesh;


            scene.add(mesh);



        });


    }else{

        new THREE.OBJLoader().load(view.input.mesh,function (object) {


            var mesh = object.children[0];

            mesh.geometry = new THREE.Geometry().fromBufferGeometry(mesh.geometry);

            view.brace = mesh;

            if(scene) scene.add(view.brace);

        });

    }




    view.myWrapSurface = new wrapSurface({

        wrapTartgetMesh: view.input.wrapTartgetMesh,


        nurbsSurfaceSetting:view.input.nurbsSurfaceSetting


    });


    if(scene){

        gui = new dat.GUI();

        gui.add(view,'project');
        gui.add(view,'export');


    }



};

uvwMapper.prototype.project = function () {


    var view = this;

    var fakeCamera = new THREE.PerspectiveCamera( 70, 1, 1, 10000 );
    var fakeMouse = new THREE.Vector2(0,0);


    var braceInput = view.brace;

    var thisRay = new THREE.Raycaster();

    var toDraw = [];


    if(view.quad){

        for(var i=0; i<braceInput.geometry.vertices_quad.length;i++){

            var thisVertex = new THREE.Vector3(
                braceInput.geometry.vertices_quad[i][0],
                braceInput.geometry.vertices_quad[i][1],
                braceInput.geometry.vertices_quad[i][2]
            );

            projectVertices(thisVertex);

            braceInput.geometry.vertices_quad[i][0] = thisVertex.x;
            braceInput.geometry.vertices_quad[i][1] = thisVertex.y;
            braceInput.geometry.vertices_quad[i][2] = thisVertex.z;

        }

    }else{

        for(var i = 0; i<braceInput.geometry.vertices.length;i++){

            var thisVertex = braceInput.geometry.vertices[i];

            projectVertices(thisVertex);

        }

        braceInput.geometry.verticesNeedsUpdate = true;

    }


    function projectVertices(thisVertex) {

        fakeCamera.position.set(thisVertex.x*2,thisVertex.y,thisVertex.z*2);

        fakeCamera.lookAt(new THREE.Vector3(0,thisVertex.y,0));
        fakeCamera.position.set(thisVertex.x*2,thisVertex.y,thisVertex.z*2); //Moves camera to view each vertex
        fakeCamera.lookAt(thisVertex);
        fakeCamera.updateMatrix();
        fakeCamera.updateProjectionMatrix();
        fakeCamera.updateMatrixWorld();
        thisRay.setFromCamera(fakeMouse,fakeCamera); //Draws vector from camera to origin

        var intersects = thisRay.intersectObject(view.myWrapSurface.UVMesh);

        if(intersects.length>0){

            // var pt = view.myWrapSurface.nurbsSurface.getPoint(1-intersects[0].uv.x,intersects[0].uv.y);
            // toDraw.push([pt.x,pt.y,pt.z]);


            var pt = view.myWrapSurface.verbSurface.point(1-intersects[0].uv.x,intersects[0].uv.y);

            thisVertex.u = 1-intersects[0].uv.x;

            thisVertex.v = intersects[0].uv.y;

            thisVertex.w = view.includeW ? [].dis(pt,[thisVertex.x,thisVertex.y,thisVertex.z]) : 0;

            if([].dot([].sub(pt,[thisVertex.x,thisVertex.y,thisVertex.z]),[-thisVertex.x,0,-thisVertex.z])<0) thisVertex.w *=-1;

            toDraw.push(pt);

            thisVertex.set(thisVertex.u,thisVertex.v,thisVertex.w);


        }


        if(intersects.length<=0 && console) console.log('mesh falls out of wrap target!');

        return thisVertex;
    }

    createParticleSystem(toDraw,0.2,red);

};

uvwMapper.prototype.export = function () {

    var view = this;
    var result = new THREE.OBJExporter().parse(view.brace);
    var blob = new Blob([result], {type: "text/plain"});
    saveAs(blob, "brace.obj");


};



