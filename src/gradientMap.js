/**
 * Created by Li on 4/6/2017.
 */

var gradientMap = function (input) {

    var view = this;

    view.mapFrom = input.mapFrom;
    view.mapTo = input.mapTo;

};

gradientMap.prototype.getValueAt = function (value) {

    var view = this;

    for(var i=0;i<view.mapFrom.length-1;i++){

        if(value >= view.mapFrom[i] && value <= view.mapFrom[i+1]  ){

            var parameter = (value - view.mapFrom[i]) / (view.mapFrom[i+1] - view.mapFrom[i]);

            return (view.mapTo[i+1] - view.mapTo[i]) * parameter + view.mapTo[i];

        }
    }

};