/**
 * Created by Pater on 3/30/2017.
 */

var closedCurve = function (input) {


    var view = this;

    view.surface = input.surface;

    view.closed = input.closed || false;

    view.resolution = input.resolution || 50; // was 50

    view.geometry = new THREE.Geometry();


    var starsMaterial = new THREE.PointsMaterial( { color: 0x909090 , size: 8 } );

    // starsMaterial.depthTest = false;
    // starsMaterial.depthWrite = false;
    //
    // var stars = new THREE.Points(  view.geometry, starsMaterial );

    var mesh = new THREE.Points(view.geometry, starsMaterial);

    // mesh.material.depthTest = false;
    // mesh.material.depthWrite = false;


    //mesh.add(stars);

    scene.add( mesh );

    if(input.controlPoints instanceof THREE.Group) {

        input.controlPoints.update = function(){console.log('dsf');view.updateCurve()};

        view.controlPts = [];
        for(var i=0;i<input.controlPoints.children.length;i++){

            view.controlPts[i] = input.controlPoints.children[i].position;

        }

        mesh.add(input.controlPoints);
        mesh.controlPts = view.controlPts;


    } else  view.controlPts = input.controlPoints;



    view.mesh = mesh;

    if(input.centerGeometry) view.centerGeometry();

    view.mesh.updateCurve = function(){view.updateCurve()};

    view.updateCurve();

    input.controlPoints.update = function(){view.updateCurve()};

    return view.mesh;


};

closedCurve.prototype.computeCurve = function () {

    var view = this;

    view.tempVertices = [];

    var smooth_value = 1;

    var controlPts = view.controlPts;

    if(view.closed){

        for(var i=0; i<controlPts.length;i++){


            createCurve(

                controlPts[(i-1+controlPts.length)%controlPts.length],
                controlPts[(i)%controlPts.length],
                controlPts[(i+1)%controlPts.length],
                controlPts[(i+2)%controlPts.length]


            );


        }



        function createCurve(p0,p1,p2,p3) {


            if( p0 instanceof Array ) {

                var x0 = p0[0], y0 = p0[1], z0 = p0[2];
                var x1 = p1[0], y1 = p1[1], z1 = p1[2];
                var x2 = p2[0], y2 = p2[1], z2 = p2[2];
                var x3 = p3[0], y3 = p3[1], z3 = p3[2];

            }else if( p0 instanceof THREE.Vector3 ){

                x0 = p0.x; y0 = p0.y; z0 = p0.z;
                x1 = p1.x; y1 = p1.y; z1 = p1.z;
                x2 = p2.x; y2 = p2.y; z2 = p2.z;
                x3 = p3.x; y3 = p3.y; z3 = p3.z;


            } else  return;

            if(view.surface){

                x0 = p0.u; y0 = p0.v; z0 = p0.w;
                x1 = p1.u; y1 = p1.v; z1 = p1.w;
                x2 = p2.u; y2 = p2.v; z2 = p2.w;
                x3 = p3.u; y3 = p3.v; z3 = p3.w;


            }


            var xc1 = (x0 + x1) / 2.0;
            var yc1 = (y0 + y1) / 2.0;
            var zc1 = (z0 + z1) / 2.0;
            var xc2 = (x1 + x2) / 2.0;
            var yc2 = (y1 + y2) / 2.0;
            var zc2 = (z1 + z2) / 2.0;
            var xc3 = (x2 + x3) / 2.0;
            var yc3 = (y2 + y3) / 2.0;
            var zc3 = (z2 + z3) / 2.0;

            var len1 = Math.sqrt((x1-x0) * (x1-x0) + (y1-y0) * (y1-y0) + (z1-z0) * (z1-z0));
            var len2 = Math.sqrt((x2-x1) * (x2-x1) + (y2-y1) * (y2-y1) + (z2-z1) * (z2-z1));
            var len3 = Math.sqrt((x3-x2) * (x3-x2) + (y3-y2) * (y3-y2) + (z3-z2) * (z3-z2));

            var k1 = len1 / (len1 + len2);
            var k2 = len2 / (len2 + len3);

            var xm1 = xc1 + (xc2 - xc1) * k1;
            var ym1 = yc1 + (yc2 - yc1) * k1;
            var zm1 = zc1 + (zc2 - zc1) * k1;

            var xm2 = xc2 + (xc3 - xc2) * k2;
            var ym2 = yc2 + (yc3 - yc2) * k2;
            var zm2 = zc2 + (zc3 - zc2) * k2;

            // Resulting control points. Here smooth_value is mentioned
            // above coefficient K whose value should be in range [0...1].
            var ctrl1_x = xm1 + (xc2 - xm1) * smooth_value + x1 - xm1;
            var ctrl1_y = ym1 + (yc2 - ym1) * smooth_value + y1 - ym1;
            var ctrl1_z = zm1 + (zc2 - zm1) * smooth_value + z1 - zm1;

            var ctrl2_x = xm2 + (xc2 - xm2) * smooth_value + x2 - xm2;
            var ctrl2_y = ym2 + (yc2 - ym2) * smooth_value + y2 - ym2;
            var ctrl2_z = zm2 + (zc2 - zm2) * smooth_value + z2 - zm2;


            var curve = new THREE.CubicBezierCurve3(
                new THREE.Vector3( x1, y1, z1 ),
                new THREE.Vector3( ctrl1_x, ctrl1_y , ctrl1_z ),
                new THREE.Vector3( ctrl2_x, ctrl2_y, ctrl2_z ),
                new THREE.Vector3( x2, y2, z2 )
            );


            view.tempVertices = view.tempVertices.concat(curve.getPoints( view.resolution ).slice(1));


        }

    }else {

        var curve = new THREE.CatmullRomCurve3( view.controlPts );

        view.tempVertices = curve.getPoints( view.resolution * view.controlPts.length );


    }







};

closedCurve.prototype.updateCurve = function () {

    var view = this;

    view.computeCurve();

    for(var i=0;i<view.tempVertices.length;i++){

        if(view.surface){


            var pt = view.surface.point(view.tempVertices[i].x,view.tempVertices[i].y);

            if(view.geometry.vertices[i]) view.geometry.vertices[i].set(pt[0],pt[1],pt[2]);
            else  view.geometry.vertices[i] = new THREE.Vector3(pt[0],pt[1],pt[2]);

            view.geometry.vertices[i].u = view.tempVertices[i].x;
            view.geometry.vertices[i].v = view.tempVertices[i].y;
            view.geometry.vertices[i].w = 0;



        }else{


            if(view.geometry.vertices[i]) view.geometry.vertices[i].copy(view.tempVertices[i]);
            else view.geometry.vertices[i] = view.tempVertices[i];


        }

    }

    view.geometry.verticesNeedUpdate = true;

};

closedCurve.prototype.centerGeometry = function () {

    var view = this;

    var center = new THREE.Vector3();

    for(var i=0;i<view.controlPts.length;i++){

        center.add(view.controlPts[i]);

    }

    center.multiplyScalar(1/view.controlPts.length);

    view.mesh.position.copy(center);

    for(var i=0;i<view.controlPts.length;i++){

        view.controlPts[i].sub(center);

    }

    view.mesh.updateMatrixWorld();


};