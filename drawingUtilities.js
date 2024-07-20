let dotsColor = 'red';
let linesColor = 'blue';

function drawHands(hands, ctx){
    
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    const fingerJoints = {
        thumb: [0, 1, 2, 3, 4],
        indexFinger: [0, 5, 6, 7, 8],
        middleFinger: [0, 9, 10, 11, 12],
        ringFinger: [0, 13, 14, 15, 16],
        pinkyFinger: [0, 17, 18, 19, 20]
    }


    function drawHandPoints(hand){
        ctx.fillStyle = dotsColor;
        hand.keypoints.forEach(keypoints => {
        ctx.beginPath();
        ctx.arc(keypoints.x, keypoints.y, 5, 0, 2 * Math.PI);
        ctx.fill();
        });
    }

    function drawAdjacentLines(hand){
          // Draw lines between adjacent points
          const keypoints = hand.keypoints;
          ctx.strokeStyle = linesColor;
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
}

function drawPose(poses, ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    function drawKeypoints(keypoints, ctx) {
      keypoints.forEach(keypoint => {
        if (keypoint.score > 0.5) {
          const { y, x } = keypoint.position;
          ctx.beginPath();
          ctx.arc(x, y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = dotsColor;
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
          ctx.strokeStyle = linesColor;
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

    poses.forEach(pose => {
        drawKeypoints(pose.keypoints, ctx);
        drawSkeleton(pose.keypoints, ctx);
    });
}

function drawFaceMesh(faces, ctx){
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  function drawFacePoints(keypoints){
    for(let i = 0; i<keypoints.length; i++){
      const x = keypoints[i][0];
      const y = keypoints[i][1];
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
      ctx.fillStyle = dotsColor;
      ctx.fill();
    }
  }

  function drawFacePath(ctx, points) {
    const region = new Path2D();
    region.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      region.lineTo(point[0], point[1]);
    } 
    region.closePath();
 
    ctx.strokeStyle = linesColor;
    ctx.stroke(region);
  };

  faces.forEach(face=>{
    const keypoints = face.scaledMesh;
    for (let i = 0; i < TRIANGULATION.length; i++) {
      const points = TRIANGULATION[i].map((index) => keypoints[index]);
      drawFacePath(ctx, points, true);
    }
    drawFacePoints(keypoints);
  })
}


