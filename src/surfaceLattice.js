/**
 * Created by Li on 12/19/2016.
 */




var surfaceLattice = function(input){


    var view = this;


    view.app = input.app;

    view.input = input;

    if(input.surface) view.surface = input.surface;

    // initialising attractors

    if(input.attractors){

        view.attractors = [];

        for(var i=0; i<input.attractors.length ;i++){

            view.attractors.push(new Attractor(input.attractors[i]));

        }

    }




    // loading scaffold mesh and morphing components
    var loader = new THREE.PLYLoader();

    if(input.scaffoldMesh1 instanceof THREE.Mesh){

        view.scaffoldMesh1 = input.scaffoldMesh1;

        view.generateScaffold();

        // var gui = new dat.GUI();
        // gui.add(view,'applyComp').name('GENERATE FINAL BRACE!');

    }else{

        loader.load(input.scaffoldMesh1,function (object) {

            view.scaffoldMesh1 = new THREE.Mesh(object,new THREE.MeshPhongMaterial());

            view.scaffoldMesh1.material.vertexColors = THREE.VertexColors;
            view.scaffoldMesh1.material.side = THREE.DoubleSide;

            if(scene) scene.add( view.scaffoldMesh1 );

            //view.generateScaffold();

        });
    }




    loader = new THREE.OBJLoader();

    loader.load(input.componentA,function (object) {

        view.compA = object.children[0].geometry;
        view.reparameterise(view.compA);

    });

    if(input.componentB) loader.load(input.componentB,function (object) {

        view.compB = object.children[0].geometry;
        view.reparameterise(view.compB);

    });



};


// generate Scaffold to array and morph components
surfaceLattice.prototype.generateScaffold = function(){


    var view = this;

    var geometry = view.scaffoldMesh1.geometry;

    view.scaffold = [];

    var height = view.input.height || 5;

    for(var i=0; i<geometry.faces_quad.length;i++){

        var thisFace = geometry.faces_quad[i];

        var box = [];

        box[0] = geometry.vertices_quad[thisFace[0]];
        box[1] = geometry.vertices_quad[thisFace[1]];
        box[2] = geometry.vertices_quad[thisFace[2]];
        box[3] = geometry.vertices_quad[thisFace[3]];



        if(view.surface){



            var normal;
            normal = view.surface.normal(geometry.vertices[thisFace[0]].u,geometry.vertices[thisFace[0]].v).normalise();
            box[4] = [].add(geometry.vertices_quad[thisFace[0]],normal.mult(height));

            normal = view.surface.normal(geometry.vertices[thisFace[1]].u,geometry.vertices[thisFace[1]].v).normalise();
            box[5] = [].add(geometry.vertices_quad[thisFace[1]],normal.mult(height));

            normal = view.surface.normal(geometry.vertices[thisFace[2]].u,geometry.vertices[thisFace[2]].v).normalise();
            box[6] = [].add(geometry.vertices_quad[thisFace[2]],normal.mult(height));

            normal = view.surface.normal(geometry.vertices[thisFace[3]].u,geometry.vertices[thisFace[3]].v).normalise();
            box[7] = [].add(geometry.vertices_quad[thisFace[3]],normal.mult(height));




        }else{

            box[4] = [].add(geometry.vertices_quad[thisFace[0]],[].mult(geometry.normals_quad[thisFace[0]],height));
            box[5] = [].add(geometry.vertices_quad[thisFace[1]],[].mult(geometry.normals_quad[thisFace[1]],height));
            box[6] = [].add(geometry.vertices_quad[thisFace[2]],[].mult(geometry.normals_quad[thisFace[2]],height));
            box[7] = [].add(geometry.vertices_quad[thisFace[3]],[].mult(geometry.normals_quad[thisFace[3]],height));

        }

        view.scaffold.push(box);


    }


};


// array and morph components on scaffold
surfaceLattice.prototype.applyComp = function () {



    var view = this;

    view.generateScaffold();

    var scaffold  = view.scaffold;

    var flatArray = [];
    var arrCount = 0;


    var colorArray = [];


    for(var i=0;i<scaffold.length;i++){


        for(var j=0;j<view.compA.attributes.position.array.length;j+=3){

            var u1 = view.compA.attributes.position.array[j];
            var v1 = view.compA.attributes.position.array[j+1];
            var w1 = view.compA.attributes.position.array[j+2];

            var p1 = view.BoxLerp.getVertex(u1,v1,w1,scaffold[i]);



            if(view.compB){

                // blend between compA and compB using attractors, array them on the scaffold

                var u2 = view.compB.attributes.position.array[j];
                var v2 = view.compB.attributes.position.array[j+1];
                var w2 = view.compB.attributes.position.array[j+2];

                var p2 = view.BoxLerp.getVertex(u2,v2,w2,scaffold[i]);

                if(!view.input.vertexColor) var blendValue = view.getBlendingValue(p1[0],p1[1],p1[2]);
                else  blendValue = (1-view.getValueFromQuad(u1,v1,view.scaffoldMesh1.geometry.faces_quad[i]));


                var p = view.BoxLerp.lerpV3(p1,p2,blendValue);

            }else{

                // if compB is not in input, array compA on the scaffold without blending.
                p = p1;

            }





            flatArray[arrCount] = p[0];
            colorArray[arrCount] = blendValue;
            arrCount++;
            flatArray[arrCount] = p[1];
            colorArray[arrCount] = blendValue;
            arrCount++;
            flatArray[arrCount] = p[2];
            colorArray[arrCount] = blendValue;
            arrCount++;



        }


    }



    var Geometry = new THREE.BufferGeometry();



    var vertices = new Float32Array( flatArray );
    var colors = new Float32Array( colorArray );



    Geometry.addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );
    Geometry.addAttribute( 'color', new THREE.BufferAttribute( colors, 3 ) );
    Geometry.computeVertexNormals();

    var material = new THREE.MeshPhongMaterial( { side: THREE.DoubleSide } );
    view.latticeMesh = new THREE.Mesh( Geometry, material );

    if(scene) {
        scene.remove(view.scaffoldMesh1);
        scene.add(view.latticeMesh);
    }


    console.log(view.latticeMesh);
};


// get blend value from quad colors
surfaceLattice.prototype.getValueFromQuad = function (x,y,face_quad) {

    var view = this;

    var colors = [

        view.scaffoldMesh1.geometry.colors_quad[face_quad[0]][0],
        view.scaffoldMesh1.geometry.colors_quad[face_quad[1]][0],
        view.scaffoldMesh1.geometry.colors_quad[face_quad[2]][0],
        view.scaffoldMesh1.geometry.colors_quad[face_quad[3]][0]

    ];


    var A = colors[0];
    var B = colors[3];
    var C = colors[1];
    var D = colors[2];




    var E = A + (B-A)*x;
    var F = C + (D-C)*x;

    var G = E + (F-E)*y;


    return G;

};


// get blend values from attractors
surfaceLattice.prototype.getBlendingValue = function (x,y,z) {

    var view = this;

    var blendValue = 0;

    if(view.attractors){

        for(var i=0; i<view.attractors.length;i++){

            blendValue += view.attractors[i].fallOff(x,y,z);
        }
    }



    return blendValue;

};


// export stl file
surfaceLattice.prototype.export = function () {

    var exporter = new THREE.STLBinaryExporter();
    var result = exporter.parse (this.latticeMesh.geometry);
    var blob = new Blob([result], {type: "text/plain"});
    saveAs(blob, "surfaceLattice.stl");

    return blob;

};


// return position in box by giving u,v,w parameter
surfaceLattice.prototype.BoxLerp = {

    lerp: function(a, b, t){
        return a + (b-a) * t;
    },

    lerpV3: function(p0, p1, t){
        return  [this.lerp(p0[0],p1[0],t), this.lerp(p0[1],p1[1],t), this.lerp(p0[2],p1[2],t)];
    },

    lerpEdges: function(e0a, e0b, e1a, e1b, u, v){
        return this.lerpV3( this.lerpV3( e0a, e0b, v), this.lerpV3( e1a, e1b, v), u );
    },

    lerpQuads: function(q0a, q0b, q0c, q0d, q1a, q1b, q1c, q1d, u, v, w){
        return this.lerpV3( this.lerpEdges(q1a, q1b, q1d, q1c, u, v), this.lerpEdges(q0a, q0b, q0d, q0c, u, v), w);
    },

    getPoint: function( u, v, w, f0, f1 )
    {
        return this.lerpQuads( f0.a, f0.b, f0.c, f0.d, f1.a, f1.b, f1.c, f1.d, u, v, w);
    },

    getVertex: function( u, v, w, lattice )
    {
        return this.lerpQuads( lattice[4], lattice[5], lattice[6], lattice[7], lattice[0], lattice[1], lattice[2], lattice[3], u, v, w);
    }
};


// unitize the component
surfaceLattice.prototype.reparameterise = function (geometry) {

    geometry.computeBoundingBox();

    var posFlatArray = geometry.attributes.position.array;

    for(var i=0; i<posFlatArray.length; i+=3){

        posFlatArray[i] -= geometry.boundingBox.min.x;
        posFlatArray[i+1] -= geometry.boundingBox.min.y;
        posFlatArray[i+2] -= geometry.boundingBox.min.z;

        posFlatArray[i] /= geometry.boundingBox.max.x - geometry.boundingBox.min.x;
        posFlatArray[i+1] /= geometry.boundingBox.max.y - geometry.boundingBox.min.y;
        posFlatArray[i+2] /= geometry.boundingBox.max.z - geometry.boundingBox.min.z;

    }

    geometry.attributes.position.needsUpdate = true;

};

