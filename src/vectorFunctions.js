/**
 * Created by Li on 4/5/2017.
 */

var vectorFunctions = function () {

    Array.prototype.add = function (A,B) {

        if(B) return [A[0]+B[0],A[1]+B[1],A[2]+B[2]];
        else {

            this[0]+=A[0];
            this[1]+=A[1];
            this[2]+=A[2];

            return this;

        }

    };



    Array.prototype.sub = function (A,B) {

        if(B) return [A[0]-B[0],A[1]-B[1],A[2]-B[2]];
        else {

            this[0]-=A[0];
            this[1]-=A[1];
            this[2]-=A[2];

            return this;

        }

    };


    Array.prototype.mult = function (A,b) {

        if(b) return [A[0]*b,A[1]*b,A[2]*b];
        else {

            this[0]*=A;
            this[1]*=A;
            this[2]*=A;

            return this;

        }

    };

    Array.prototype.div = function (A,b) {

        if(b) return [A[0]/b,A[1]/b,A[2]/b];
        else {

            this[0]/=A;
            this[1]/=A;
            this[2]/=A;

            return this;

        }

    };


    Array.prototype.dot = function (A,B) {

        if(B) return A[0]*B[0]+A[1]*B[1]+A[2]*B[2];
        else {

            return A[0]*this[0]+A[1]*this[1]+A[2]*this[2];

        }

    };


    Array.prototype.dis = function (A,B) {

        if(B) return Math.sqrt((A[0]-B[0])*(A[0]-B[0]) + (A[1]-B[1])*(A[1]-B[1]) + (A[2]-B[2])*(A[2]-B[2]) );
        else if(A){

            return Math.sqrt((A[0]-this[0])*(A[0]-this[0]) + (A[1]-this[1])*(A[1]-this[1]) + (A[2]-this[2])*(A[2]-this[2]) );

        }else {

            return Math.sqrt(this[0]*this[0] + this[1]*this[1] + this[2]*this[2]);

        }

    };

    Array.prototype.normalise = function (A) {

        if(A){

            // [].normalise(A) will return a new Vector
            var length = [].dis(A,[0,0,0]);
            return [].mult(A,1/length);

        }else{

            // A.normalise() will change A itself
            length = [].dis(this,[0,0,0]);
            return this.div(length);

        }


    };

    Array.prototype.copy = function () {

        var newArray = [];

        for(var i=0;i<this.length;i++){

            newArray.push(this[i]);

        }

        return newArray;

    };


};

new vectorFunctions();

//module.exports = vectorFunctions;