var myVideo, // video file
    myVida;  // VIDA

var widthVid = 300, heightVid = 300;
var cropX = 32, cropY = 110, cropSize = widthVid/2;
var croppedVid;

/*
  Some web browsers do not allow the automatic start of a video file and allow
  you to play the file only as a result of user interaction. Therefore, we will
  use this variable to manage the start of the file after interacting with the
  user.
*/
var interactionStartedFlag = false;
var backgroundImg, backgroundFlag = false;

function setup() {
  //createCanvas(widthVid*2, heightVid*2); // we need some space...
  createCanvas(windowWidth, windowHeight);

  backgroundImg = loadImage("assets/background2.png");
  backgroundImg.resize(cropSize, cropSize);

  // load test video file
  //myVideo = createVideo(['assets/IMG_0040.mov']);
  myVideo = createVideo(["./Volumes/One Touch/OFT 1/IMG_0037.MOV"]);
  //myVideo = createVideo(['assets/1L.mov']);
  //pixelDensity(1)
	myVideo.size(1080/5, 1920/5); //216*384

	//cropping
	croppedVid = createGraphics(widthVid,heightVid);

  // workaround for browser autoplay restrictions
  myVideo.elt.muted = true;
  // fix for some mobile browsers
  myVideo.elt.setAttribute('playsinline', '');
  /*
    At the beginning of the test video we do not see any moving objects, so we
    will capture one of the initial frames and load it into the VIDA's
    background buffer.
  */
  myVideo.addCue(0.1, touchEnded);
  // loop the video, hide the original object and start the playback
  myVideo.loop();
  //myVideo.speed(5);
  myVideo.hide();

  /*
    VIDA stuff. One parameter - the current sketch - should be passed to the
    class constructor (thanks to this you can use Vida e.g. in the instance
    mode).
  */
  myVida = new Vida(this); // create the object
  /*
    Turn off the progressive background mode (we will use a static background
    image).
  */
  myVida.progressiveBackgroundFlag = false;
  /*
    The value of the threshold for the procedure that calculates the threshold
    image. The value should be in the range from 0.0 to 1.0 (float).
  */
  myVida.imageFilterThreshold = 0.3;
  /*
    In order for VIDA to handle blob detection (it doesn't by default), we set
    this flag.
  */
  myVida.handleBlobsFlag = true;
  /*
    Normalized values of parameters defining the smallest and highest allowable
    mass of the blob.
  */
  //myVida.normMinBlobMass = 0.0002;  // uncomment if needed
  //myVida.normMaxBlobMass = 0.5;  // uncomment if needed
  /*
    Normalized values of parameters defining the smallest and highest allowable
    area of the blob boiunding box.
  */
  myVida.normMinBlobArea = 0.008;  // uncomment if needed
  //myVida.normMaxBlobArea = 0.5;  // uncomment if needed
  /*
    If this flag is set to "true", VIDA will try to maintain permanent
    identifiers of detected blobs that seem to be a continuation of the
    movement of objects detected earlier - this prevents random changes of
    identifiers when changing the number and location of detected blobs.
  */
  myVida.trackBlobsFlag = true;
  /*
    Normalized value of the distance between the tested blobs of the current
    and previous generation, which allows treating the new blob as the
    continuation of the "elder".
  */
  //myVida.trackBlobsMaxNormDist = 0.3; // uncomment if needed
  /*
    VIDA may prefer smaller blobs located inside larger or the opposite: reject
    smaller blobs inside larger ones. The mechanism can also be completely
    disabled. Here are the possibilities:
      [your vida object].REJECT_NONE_BLOBS
      [your vida object].REJECT_INNER_BLOBS
      [your vida object].REJECT_OUTER_BLOBS
    The default value is REJECT_NONE_BLOBS.
  */
  //myVida.rejectBlobsMethod = myVida.REJECT_NONE_BLOBS; // uncomment if needed
  /*
    If this flag is set to "true", VIDA will generate polygons that correspond
    approximately to the shape of the blob. If this flag is set to "false", the
    polygons will not be generated. Default vaulue is false. Note: generating
    polygons can be burdensome for the CPU - turn it off if you do not need it.
  */
  myVida.approximateBlobPolygonsFlag = false;
  /*
   Variable (integer) that stores the value corresponding to the number of
   polygon points describing the shape of the blobs. The minimum value of this
   variable is 3.
  */
  myVida.pointsPerApproximatedBlobPolygon = 8;

  frameRate(30); // set framerate
}

function draw() {
  if(myVideo !== null && myVideo !== undefined) { // safety first
    /*
      Wait for user interaction. Some browsers prevent video playback if the
      user does not interact with the webpage yet.
    */
    if(!interactionStartedFlag) {
      background(0);
      push();
      noStroke(); fill(255); textAlign(CENTER, CENTER);
      text('click or tap to start video playback', widthVid / 2, heightVid / 2 + 50);
      pop();
      return;

    }

    if(backgroundFlag == true){
        background(0, 0, 255);
    }

    /*
      Call VIDA update function, to which we pass the current video frame as a
      parameter. Usually this function is called in the draw loop (once per
      repetition).
    */

    // CROPPING
    cropVid(myVideo);
    myVida.update(croppedVid);

    //image(croppedVid, 500,0, croppedVid.width, croppedVid.height);
    /*
      Now we can display images: source video and subsequent stages
      of image transformations made by VIDA.
    */
    image(croppedVid, 0, 0);

    if(backgroundFlag && frameCount > 10){
      image(myVida.backgroundImage, widthVid, 0);
      backgroundFlag = true;
    }

    image(myVida.differenceImage, 0, heightVid);
    image(myVida.thresholdImage, widthVid, heightVid);

    image(myVideo, widthVid*2, 0, myVideo.width*2, heightVid*2);
    // let's also describe the displayed images
    noStroke(); fill(255, 255, 255);
    text('raw video', 20, 20);
    text('path image', widthVid + 20, 20);
    text('difference image', 20, heightVid + 20);
    text('threshold image', widthVid + 20, heightVid + 20);
    /*
      In this example, we use the built-in VIDA function for drawing blobs. We
      use the version of the function with two parameters (given in pixels)
      which are the coordinates of the upper left corner of the graphic
      representation of the blobs. VIDA is also equipped with a version of this
      function with four parameters (the meaning of the first and second
      parameter does not change, and the third and fourth mean width and height
      respectively). For example, to draw the blobs on the entire available
      surface, use the function in this way:
        [your vida object].drawBlobs(0, 0, width, height);
    */
    myVida.drawBlobs(widthVid, heightVid);
  }
  else {
    /*
      If there are problems with the capture device (it's a simple mechanism so
      not every problem with the camera will be detected, but it's better than
      nothing) we will change the background color to alarmistically red.
    */
    background(255, 0, 0);
  }


  if(myVida.getBlobs().length > 0){
    let blobX = myVida.getBlobs()[0].normMassCenterX * cropSize*2;
    let blobY = myVida.getBlobs()[0].normMassCenterY * cropSize*2;

    if(blobX >=85 && blobX <= 212 && blobY >= 83 && blobY <= 216){
      fill(255,255,255, 100);
      console.log('inside')
    }
    else{
      fill(255,0,0, 50);
    }


    ellipse(blobX, blobY, 10, 10);
    ellipse(blobX + widthVid, blobY, 3, 3);

    noFill();
    stroke(255);
    //rect(85 + 300, 83, 130, 130);

  }
}

function touchEnded() {
  /*
    Capture current video frame and put it into the VIDA's background buffer.
  */
  if(myVideo !== null && myVideo !== undefined && interactionStartedFlag) {
    //myVida.setBackgroundImage(croppedVid);
    myVida.setBackgroundImage(backgroundImg);
    console.log('background set');
  }
  // init video (if needed)
  if(!interactionStartedFlag) safeStartVideo();
}

/*
  Helper function that starts playback on browsers that require interaction
  with the user before playing video files.
*/
function safeStartVideo() {
  // safety first..
  if(myVideo === null || myVideo === undefined) return;
  // here we check if the video is already playing...
  if(!isNaN(myVideo.time())) {
    if(myVideo.time() < 1) {
      interactionStartedFlag = true;
      return;
    }
  }
  // if no, we will try to play it
  try {
    myVideo.loop();
    myVideo.hide();
    interactionStartedFlag = true;
  }
  catch(e) {
    console.log('[safeStartVideo] ' + e);
  }
}

function cropVid(v){
  //croppedVid = get(v,0,0,216,384)
  let frame = v.get();
  croppedVid.image(frame, 0,0, widthVid,heightVid, cropX, cropY, cropSize, cropSize)
}

function mouseClicked(){
  console.log(mouseX, mouseY)
}
