var mosaicView = angular.module('tessell.mosaic', []);
  
mosaicView.controller('mosaicCtrl', ['$scope', function ($scope){
  console.log("in mosaic controller");
  //TODO: define $scope.mainImg.height, $scope.mainImg.width, $scope.mainImg.path
  $scope.image.height = //main image height $obj.event.height; 
  $scope.image.width = //main imgae width $obj.event.width;
  $scope.image.path = //cloudinary path to main image $obj.map.path;
  $scope.event._id = //current event id TOASK: is this mongo _id or eventCode -> both should be unique??
  $scope.eventMap = //I assume there is a map property for each event
  // $scope.map.data[key].rgb;
  // $scope.map.data

  $scope.dropzoneConfig = {
    'options': {
      'url': '/event/' + $scope.event.eventCode + '/image', //ultimately, we need to set this route up on the server.
      'method': 'POST',
      'maxFiles': 1,
      'clickable': true
    },
    'eventHandlers': {
      'sending': function (file, xhr, formData) {
        // console.log(formData, file, xhr);
        //TODO: modify the below based on the instructions you gave Jon.
        formData.append("eventCode", $scope.event._id);
      },
      'success': function (file, response) {
        console.log('done with sending photo');
        mosaicFactory.findImageHome(response);
      }
    }
  };
}]);

mosaicView.factory('mosaicFactory', ['http', '$scope', function ($http, $scope){
  var mosaicFactory = {};

  mosaicFactory.init = function(){
    var mainSVG = document.getElementById('mainSVG');
    var mainImg = document.createElementNS('http://www.w3.org/2000/svg','image');
    mainImg.setAttributeNS(null, 'height', $scope.image.height.toString()); // mainImg -> image
    mainImg.setAttributeNS(null, 'width', $scope.image.width.toString()); //mainImg -> image
    mainImg.setAttributeNS('http://www.w3.org/1999/xlink', 'href', $scope.image.path); //the path to cloudinary mainImg -> image
    mainImg.setAttributeNS(null, 'x', 0);
    mainImg.setAttributeNS(null, 'y', 0);
    mainImg.setAttributeNS(null, 'visibility', 'visible');

    mainSVG.appendChild(mainImg);
    mosaicFactory.redrawImages();  //iterates through the model we're given.
  };

  mosaicFactory.redrawImages = function(){
    for (var key in $scope.eventMap){ //$scope.eventMap is the map returned after the user
      //signs into an event or creates an event.
      if (key.imagePath){
        mosaicFactory.renderImage(key.coords[0], key.coords[1], key, key.imgPath, key.thumbnailPath);
      }
    }
  };

  mosaicFactory.renderImage = function(xCoord, yCoord, ID, imgPath, thumbnailPath){
    var svgImg = document.createElementNS('http://www.w3.org/2000/svg','image');
    svgImg.setAttributeNS(null,'height','10'); //squishes the image down, but still preserves the actual size
    svgImg.setAttributeNS(null,'width','10');
    svgImg.setAttributeNS('http://www.w3.org/1999/xlink','href', thumbnailPath);
    svgImg.setAttributeNS(null,'x', xCoord);
    svgImg.setAttributeNS(null,'y', yCoord);
    svgImg.setAttributeNS(null, 'visibility', 'visible');

    var svgLink = document.createElementNS('http://www.w3.org/2000/svg', 'a');
    svgLink.setAttributeNS('http://www.w3.org/1999/xlink','href', imgPath);
    svgLink.setAttributeNS(null,'id','image'+ID);
    svgLink.appendChild(svgImg);

    document.getElementsByClassName('svg-pan-zoom_viewport')[0].appendChild(svgLink);
    //for the above to append, the pan-zoom code snippet needs to have run...
  };

  //we won't have to use this until we start handling collisions.
  mosaicFactory.deleteImage = function(ID){
    var removeLink = document.getElementById('image' + ID);
    document.getElementsByClassName('svg-pan-zoom_viewport')[0].removeChild(removeLink);
  };

  mosaicFactory.findImageHome = function(guestImg){

    var minimums = []; //an array of all distances between guestImg.rgb and mainRGB.
    var whatChunk;

    for(var key in $scope.eventMap.data){ //map -> eventMap

      var mainRGB = $scope.eventMap.data[key].rgb; //map -> eventMap
      var RGBDistance = Math.sqrt(Math.pow(mainRGB.r - guestImg.rgb.r, 2) + Math.pow(mainRGB.g - guestImg.rgb.g, 2) + Math.pow(mainRGB.b - guestImg.rgb.b, 2));
      //the difference between the average RGB value of the small image and the average RGB value of the large image.

      minimums.push({
        key: key,
        min: RGBDistance
      });
    }

    //sort the minimums so that the lowest difference is first.
    minimums.sort(function(a, b){
      return (a.min - b.min);
    });

    console.log(minimums); //to verify the above

    //now, iterate through the minimums and check each key in $scope.map.data for whether it has a minValue
    for (var i = 0; i < minimums.length; i++){
      if ($scope.eventMap.data[minimums[i].key].original === false){//map -> eventMap
        continue;
        //right now, we're just skipping over sector that has an image in it.
      } else {
        whatChunk = $scope.map.data[minimums[i].key];//map -> eventMap
        whatChunk.ID = minimums[i].key;
        //updates the data.
        $scope.eventMap.data[minimums[i].key].original = false;//map -> eventMap
        $scope.eventMap.data[minimums[i].key].minValue = minimums[i].min;//map -> eventMap
        $scope.eventMap.data[minimums[i].key].imgPath = guestImg.imgPath;//map -> eventMap
        $scope.eventMap.data[minimums[i].key].thumbnailPath = guestImg.thumbnailPath;//map -> eventMap
        break;
      }
    }

    //TODO: make a post request to the server updating the model with the latest data.
    $http.post('/event/' + $scope.event.eventCode + '/map', { // TOASK: this route doesn't exisit!!!!!!!
      _id: $scope.eventMap._id,//map -> eventMap
      data: $scope.eventMap.data//map -> eventMap
    })
    .then(function(response){
      console.log("map revised!");
    });

    mosaicFactory.renderImage(whatChunk.coords[0], whatChunk.coords[1], whatChunk.ID, guestImg.imgPath, guestImg.thumbnailPath);
    //xCoord, yCoord, ID, imgPath, thumbnailPath
    //eventually, when we revise this function to handle collisions, we'll want to invoke mosaicFactory.redrawImages.
  };

  return mosaicFactory;

}]);