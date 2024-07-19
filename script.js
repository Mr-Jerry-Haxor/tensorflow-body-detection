const Models = Object.freeze({
    PlainVideo: 0,
    SimpleFaceDetection: 1,
    FaceLandMarkDetection: 2,
    PoseDetection: 3,
    BodySegmentation: 4,
    HandPoseDetection: 5,
    PortraitDepthEstimation: 6,
});

function onBodyLoad(){
    addOptions();
}

let selectedModel = Models.PlainVideo;

function addOptions(){
    const select = document.getElementById("detectionModel"); 
    for (const [key, value] of Object.entries(Models)) {
        var option = document.createElement("option");
        option.value = value;
        option.innerText = key;
        select.appendChild(option);
    }
}

function changeModel(event){
    selectedModel = Number(event.target.value);
}


async function setupVideoStream() {
  try {
    const mainvideo = document.getElementById("video");
    const mainstream = await navigator.mediaDevices.getUserMedia({ video: true });

    const videoelement = document.getElementById("motion");

    mainvideo.srcObject = mainstream;
    videoelement.srcObject = mainstream;

    return new Promise((resolve) => {
        videoelement.onloadedmetadata = () => {
        resolve(videoelement);
      };
    });
  } catch (error) {
    console.error('Error setting up video stream:', error);
  }
}

async function loadPoseNet() {
  const net = await posenet.load();
  
  const model = handPoseDetection.SupportedModels.MediaPipeHands;
  const detectorConfig = {
    runtime: 'mediapipe',
    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands'
                  // or 'base/node_modules/@mediapipe/hands' in npm.
  };
  const detector = await handPoseDetection.createDetector(model, detectorConfig);
  
  return {
    posenet: net,
    handPoseDetector: detector
  };
}

async function detectPoseInRealTime(video, detectors) {
  const canvas = document.getElementById('sketch');
  const ctx = canvas.getContext('2d');

  video.width = canvas.width = video.videoWidth;
  video.height = canvas.height = video.videoHeight;

  async function poseDetectionFrame() {

    switch(selectedModel){
        case Models.PlainVideo:
            break;
        case Models.SimpleFaceDetection:
            break;
        case Models.FaceLandMarkDetection:
            break;
        case Models.PoseDetection:
            const pose = await detectors.posenet.estimateMultiplePoses(video);
            drawPose(pose, ctx);
            break;
        case Models.BodySegmentation:
            break;
        case Models.HandPoseDetection:
            const handpose = await detectors.handPoseDetector.estimateHands(video);
            console.log(handpose);
            drawHands(handpose,ctx);
            break;
        case Models.PortraitDepthEstimation:
            break;
    }
    requestAnimationFrame(poseDetectionFrame);
  }
  poseDetectionFrame();
}

function drawHands(hands, ctx){

    const fingerJoints = {
        thumb: [0, 1, 2, 3, 4],
        indexFinger: [0, 5, 6, 7, 8],
        middleFinger: [0, 9, 10, 11, 12],
        ringFinger: [0, 13, 14, 15, 16],
        pinkyFinger: [0, 17, 18, 19, 20]
    }

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    function drawHandPoints(hand){
        ctx.fillStyle = 'red';
        hand.keypoints.forEach(keypoints => {
        ctx.beginPath();
        ctx.arc(keypoints.x, keypoints.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        });
    }

    function drawAdjacentLines(hand){
          // Draw lines between adjacent points
          const keypoints = hand.keypoints;
          ctx.strokeStyle = 'blue';
          ctx.lineWidth = 2;
          for (const [key, value] of Object.entries(fingerJoints)) {
            for (let k = 0; k < fingerJoints[key].length-1; k++) {
                const firstJointIndex = fingerJoints[key][k];
                const secondJointIndex = fingerJoints[key][k+1];
                ctx.beginPath();
                ctx.moveTo(keypoints[firstJointIndex].x, keypoints[firstJointIndex].y);
                ctx.lineTo(keypoints[secondJointIndex].x, keypoints[secondJointIndex].y);
                ctx.stroke();   
            }
        } 
    }

    hands.forEach(hand =>{
        drawHandPoints(hand);
        drawAdjacentLines(hand);
    })
return
    // Define adjacent points

}

function drawPose(poses, ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  poses.forEach(pose => {
      drawKeypoints(pose.keypoints, ctx);
      drawSkeleton(pose.keypoints, ctx);
  });
}

function drawKeypoints(keypoints, ctx) {
    console.log(keypoints);
  keypoints.forEach(keypoint => {
    if (keypoint.score > 0.5) {
      const { y, x } = keypoint.position;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  });
}

function drawSkeleton(keypoints, ctx) {
  const adjacentKeyPoints = posenet.getAdjacentKeyPoints(keypoints, 0.5);

  adjacentKeyPoints.forEach(keypoints => {
    const [from, to] = keypoints;
    ctx.beginPath();
    ctx.moveTo(from.position.x, from.position.y);
    ctx.lineTo(to.position.x, to.position.y);
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

async function main() {
  const video = await setupVideoStream();
  const net = await loadPoseNet();
  video.play();
  detectPoseInRealTime(video, net);
}

main();