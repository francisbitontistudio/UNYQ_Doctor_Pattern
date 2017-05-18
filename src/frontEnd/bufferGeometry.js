/**
 * Created by Li on 3/16/2016.
 */

function createParticleSystem(positionArray,numsArray,color,isFlatArray){


    if(numsArray[0] == undefined){

        var ptSize = numsArray;

        numsArray = [];


        for(var i=0;i<positionArray.length;i++){

            numsArray[i] = ptSize;

        }

    }

    var amount = positionArray.length;
    var radius = 1000;
    var positions = new Float32Array( amount * 3 );
    var colors = new Float32Array( amount * 3 );
    var sizes = new Float32Array( amount );
    var vertex = new THREE.Vector3();
    if(color == undefined) color = new THREE.Color( 0xffffff );
    if(typeof color == 'number' ) color  = new THREE.Color( color );




    if(isFlatArray){

        var colorArray = new Float32Array(positionArray.length);
        for ( var i = 0; i < positionArray.length; i ++ ) {

            colorArray[i] = positionArray[i]/256 +0.5;


        }
    }

        for ( var i = 0; i < amount; i ++ ) {

            if (!isFlatArray){

                vertex.x = positionArray[i][0];
                vertex.y = positionArray[i][1];
                vertex.z = positionArray[i][2];

                vertex.toArray( positions, i * 3 );

            }




            if(color.length != undefined)color[i].toArray( colors, i * 3 );
            else color.toArray( colors, i * 3 );

            sizes[ i ] = numsArray[i];
        }




    var geometry = new THREE.BufferGeometry();

    if(!isFlatArray)  {
        geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
        geometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
    }
    else {
        geometry.addAttribute( 'position', new THREE.BufferAttribute( positionArray, 3 ) );
        geometry.addAttribute( 'customColor', new THREE.BufferAttribute( colorArray, 3 ) );

    }

    geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );
    //
    var material = new THREE.ShaderMaterial( {
        uniforms: {
            amplitude: { type: "f", value: 1.0 },
            color:     { type: "c", value: new THREE.Color( 0xffffff ) },
            texture:   { type: "t", value: new THREE.TextureLoader().load( "src/nonScript/dot.png" ) }
        },
        vertexShader:   document.getElementById( 'vertexshader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        blending:       THREE.AdditiveBlending,
        depthTest:      false,
        transparent:    true
    });
    //
    var sphere = new THREE.Points( geometry, material );
    if(scene) scene.add( sphere );


    var pointer = {
        object: sphere,
        positionArray: positions,
        colorArray: colors,
        sizeArray: sizes,
        length: amount,
        material: material,

        setScale: function (s) {

          sphere.scale.set(s,s,s);

        },

        setPosition_All: function (A) {

            sphere.position.set(A[0],A[1],A[2]);

        },

        setPosition: function(i,position){

            this.positionArray[i*3] = position[0];
            this.positionArray[i*3+1] = position[1];
            this.positionArray[i*3+2] = position[2];

        },

        getPosition: function(i){

            var position = [];

            position[0] = this.positionArray[i*3];
            position[1] = this.positionArray[i*3+1];
            position[2] = this.positionArray[i*3+2];

            return position;

        },

        setColor: function(i,color){

            this.colorArray[i*3] = color[0];
            this.colorArray[i*3+1] = color[1];
            this.colorArray[i*3+2] = color[2];


        },

        setSize: function(i,size){

            this.sizeArray[i] = size;


        },

        visible: function () {

            sphere.visible = !sphere.visible;


        },

        replaceParticles: function (newPos) {


            var amount = newPos.length;
            var positions = new Float32Array( amount * 3 );


            for ( var i = 0; i < amount; i ++ ) {



                positions[i*3] = newPos[i][0];
                positions[i*3+1] = newPos[i][1];
                positions[i*3+2] = newPos[i][2];

                // geometry.attributes.position.array[i*3] = newPos[i][0];
                // geometry.attributes.position.array[i*3+1] = newPos[i][1];
                // geometry.attributes.position.array[i*3+2] = newPos[i][2];

            }

            geometry.removeAttribute( 'position' );
            geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
            geometry.attributes.position.verticesNeedUpdate = true;


        },

        dispose: function () {

            scene.remove(sphere);
            geometry.dispose();

        }


    };

    return pointer;

}

function createLine(lines) {


    var geo = new THREE.Geometry();

    for(var i=0; i<lines.length;i++){

        var p1 = lines[i][0];
        var p2 = lines[i][1];
        geo.vertices.push(new THREE.Vector3(p1[0],p1[1],p1[2]));
        geo.vertices.push(new THREE.Vector3(p2[0],p2[1],p2[2]));
        var randomColor = new THREE.Color(Math.random() * 0xffffff);
        geo.colors.push(randomColor);
        geo.colors.push(randomColor);

    }

    var lineMesh = new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color: 0xffffff, vertexColors: THREE.VertexColors }));

    scene.add(lineMesh);

    console.log(lineMesh);
}

function createBufferLine(lines) {


    var flatPosArray = new Float32Array( lines.length*2 * 3 );
    var flatColorArray = new Float32Array( lines.length*2 * 3 );

    for(var i=0; i<lines.length;i++){

        var p1 = lines[i][0];
        var p2 = lines[i][1];

        flatPosArray[i*2*3] = p1[0];
        flatPosArray[i*2*3+1] = p1[1];
        flatPosArray[i*2*3+2] = p1[2];

        flatPosArray[i*2*3+3] = p2[0];
        flatPosArray[i*2*3+4] = p2[1];
        flatPosArray[i*2*3+5] = p2[2];



        // geo.vertices.push(new THREE.Vector3(p1[0],p1[1],p1[2]));
        // geo.vertices.push(new THREE.Vector3(p2[0],p2[1],p2[2]));
        //var randomColor = new THREE.Color(Math.random() * 0xffffff);
        var randomColor = new THREE.Color(0xffffff);
        // geo.colors.push(randomColor);
        // geo.colors.push(randomColor);

        flatColorArray[i*2*3] = randomColor.r;
        flatColorArray[i*2*3+1] = randomColor.g;
        flatColorArray[i*2*3+2] = randomColor.b;

        flatColorArray[i*2*3+3] = randomColor.r;
        flatColorArray[i*2*3+4] = randomColor.g;
        flatColorArray[i*2*3+5] = randomColor.b;


    }



    var geo = new THREE.BufferGeometry();


    geo.addAttribute( 'position', new THREE.BufferAttribute( flatPosArray, 3 ) );
    geo.addAttribute( 'color', new THREE.BufferAttribute( flatColorArray, 3 ) );

    var lineMesh = new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color: 0xffffff, vertexColors: THREE.VertexColors }));


    scene.add(lineMesh);

    return lineMesh;

}

function centerBufferGeometry(geometry) {

    var pos = geometry.attributes.position.array;

    var x=0, y=0, z=0;

    for(var i=0; i<pos.length;i+=3){

        x += pos[i];
        y += pos[i+1];
        z += pos[i+2];

    }


    x/= pos.length/3;
    y/= pos.length/3;
    z/= pos.length/3;


    for(var i=0; i<pos.length;i+=3){

        pos[i] -= x;
        pos[i+1] -= y;
        pos[i+2] -= z;

    }


    geometry.attributes.position.needsUpdate = true;

}

function alignBufferGeometry(geometry) {

    var pos = geometry.attributes.position.array;

    var x=0, y=0, z=0;

    for(var i=0; i<pos.length;i+=3){

        if(pos[i]<0) continue;

        x += pos[i] * Math.pow(Math.pow(pos[i],2)+Math.pow(pos[i+2],2),2);
        y += pos[i+1];
        z += pos[i+2]* Math.pow(Math.pow(pos[i],2)+Math.pow(pos[i+2],2),2);

    }

    //console.log(new THREE.Vector2(x,z).angle());

    return new THREE.Vector2(x,z).angle();
}

function applyTransformation(mesh) {


    mesh.geometry.applyMatrix(mesh.matrixWorld);


    mesh.position.set(0,0,0);
    mesh.scale.set(1,1,1);
    mesh.rotation.set(0,0,0);

    mesh.updateMatrixWorld();
    mesh.updateMatrix();

    if(mesh.geometry.attributes) mesh.geometry.attributes.position.needsUpdate = true;

}

function addNormal(geometry) {

    geometry.normals = [];

    for(var i=0;i<geometry.faces.length;i++){

        var face = geometry.faces[i];

        geometry.normals[face.a] = face.vertexNormals[0];
        geometry.normals[face.b] = face.vertexNormals[1];
        geometry.normals[face.c] = face.vertexNormals[2];

    }

}

function calculateNormal(geometry) {

    if(!geometry.normals) geometry.normals = [];

    for(var i=0;i<geometry.faces.length;i++){

        var face = geometry.faces[i];

        geometry.normals[face.a] = face.vertexNormals[0];
        geometry.normals[face.b] = face.vertexNormals[1];
        geometry.normals[face.c] = face.vertexNormals[2];

    }

    for(var i=0;i<geometry.normals.length;i++){

        geometry.normals_quad[i][0] = geometry.normals[i].x;
        geometry.normals_quad[i][1] = geometry.normals[i].y;
        geometry.normals_quad[i][2] = geometry.normals[i].z;

    }

    for(var i=0;i<geometry.vertices.length;i++){

        geometry.vertices_quad[i][0] = geometry.vertices[i].x;
        geometry.vertices_quad[i][1] = geometry.vertices[i].y;
        geometry.vertices_quad[i][2] = geometry.vertices[i].z;

    }


}