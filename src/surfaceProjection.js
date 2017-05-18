/**
 * Created by Pater on 3/31/2017.
 */

var nurbsProjection = function (input) {

    var view = this;

    view.input = input;




    var texture = new THREE.TextureLoader().load( 'face.png',function() {

        var loader = new THREE.OBJLoader();
        loader.load(input.targetMesh,function (object) {


            var targetMesh = object.children[0];

            targetMesh.material.color.setHex(0x1e1e1e);

            targetMesh.material.wireframe = true;

            if(scene) scene.add(targetMesh);

            view.targetMesh = targetMesh;

            view.colorMesh = new THREE.Mesh(targetMesh.geometry,new THREE.MeshBasicMaterial({map:texture,opacity:0.9,transparent:false}));

            scene.add(view.colorMesh);

            gui.add(view.colorMesh,'visible');


            // var posFlatArray = view.targetMesh.geometry.attributes.position.array;
            //
            // view.targetMesh.geometry.computeBoundingBox();
            //
            // if(view.targetMesh.geometry.boundingBox.max.z - view.targetMesh.geometry.boundingBox.min.z<=1){
            //
            //
            //     for(var i = 0; i<posFlatArray.length; i++){
            //
            //         posFlatArray[i]*=1000;
            //
            //     }
            //
            //     view.targetMesh.geometry.verticesNeedUpdate = true;
            //
            // }




        });



    });

};


nurbsProjection.prototype.constructNurbsSurface = function () {


    var view = this;

    var divisionU = view.input.nurbsSurfaceSetting.U || 80;
    var divisionV = view.input.nurbsSurfaceSetting.V || 30;
    var offset = view.input.nurbsSurfaceSetting.offset || 0;
    var width = view.input.nurbsSurfaceSetting.width || 100;
    var height = view.input.nurbsSurfaceSetting.height || 100;
    var center = view.input.nurbsSurfaceSetting.center || [0,0,0];


    var o = new THREE.Vector3(0,0.12,0.2);
    var dir = new THREE.Vector3(0,1,0);
    var thisRay = new THREE.Ray(o,dir);
    var a = new THREE.Vector3(100,0,0);
    var b = new THREE.Vector3(100,1,0);
    var c = new THREE.Vector3(100,0,1);

    if(view.input.projectionDirection) dir.set(view.input.projectionDirection[0],view.input.projectionDirection[1],view.input.projectionDirection[2]);

    var pointsArray = [];

    var nsControlPoints = [];


    for(var v=0;v<divisionV;v++) {

        nsControlPoints[v] = [];

        for (var u = 0; u <divisionU; u++) {

            o.set(center[0]-width/2 + u/divisionU*width,center[1],center[2]-height/2+v/divisionV*height);

            o.sub(dir.multiplyScalar(10));


            var posFlatArray = view.targetMesh.geometry.attributes.position.array;
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

                    //view.UV[u][v] = [intersect.x,intersect.y,intersect.z];

                    break;
                }

            }

        }
    }


    if(scene) view.samplePoints = createParticleSystem(pointsArray,0.1);


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

    view.nurbsSurface = nurbsSurface;

    return nurbsSurface;


    // var getSurfacePoint = function(u, v) {
    //     return nurbsSurface.getPoint(1-u, v);
    // };
    //
    // var geometry = new THREE.ParametricGeometry( getSurfacePoint, divisionU, divisionV );
    //
    //
    //
    // var material = new THREE.MeshPhongMaterial( { color: new THREE.Color(0xff0000), wireframe:true } );
    // var object = new THREE.Mesh( geometry, material );
    //
    // view.UVMesh = object;


};