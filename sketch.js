// Hand Pose Detection with ml5.js
// https://thecodingtrain.com/tracks/ml5js-beginners-guide/ml5/hand-pose

let video;
let handPose;
let hands = [];
let startButton;
let isStarted = false;

function preload() {
  // Initialize HandPose model with flipped video input
  handPose = ml5.handPose({ flipped: true });
}

function mousePressed() {
  console.log("當前手部偵測資料：", hands);
}

function gotHands(results) {
  // 將偵測結果存入 hands 變數
  hands = results;
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  // 設定影片尺寸，確保偵測座標時有正確的基準點
  // 加入 constraints 確保在手機上使用前鏡頭並修正 iOS 播放問題
  let constraints = {
    video: { facingMode: "user" },
    audio: false
  };
  video = createCapture(constraints, { flipped: true });
  video.size(640, 480);
  video.elt.setAttribute('playsinline', ''); // 關鍵：防止 iOS 強制全螢幕播放
  video.autoplay = true;
  video.hide();

  // 建立啟動按鈕，解決手機端必須由使用者點擊才能啟動媒體的問題
  startButton = createButton('點擊以啟動相機偵測');
  startButton.style('padding', '20px');
  startButton.style('font-size', '18px');
  startButton.position(windowWidth / 2 - 80, windowHeight / 2);
  startButton.mousePressed(startDetection);
}

function startDetection() {
  // 檢查是否為安全環境 (HTTPS 或 localhost)
  if (window.isSecureContext) {
    isStarted = true;
    startButton.hide();
    // Start detecting hands
    handPose.detectStart(video, gotHands);
  } else {
    alert("相機功能需要 HTTPS 安全連線才能啟動。請確認網址開頭為 https:// 或使用 localhost。");
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  if (startButton) {
    startButton.position(windowWidth / 2 - 80, windowHeight / 2);
  }
}

function draw() {
  background('#e7c6ff');

  if (!isStarted) {
    fill(0);
    textAlign(CENTER);
    textSize(20);
    text("等待啟動...", width / 2, height / 2 - 40);
    return;
  }

  // 計算影像顯示的大小（全螢幕的 50%）與置中位置
  let w = width * 0.5;
  let h = height * 0.5;
  let x = (width - w) / 2;
  let y = (height - h) / 2;

  // 檢查影片是否已經準備好，避免 width 為 0 導致錯誤
  if (video.width === 0) {
    return;
  }

  image(video, x, y, w, h);

  // Ensure at least one hand is detected
  if (hands && hands.length > 0) {
    for (let hand of hands) {
      if (hand.confidence > 0.1 && hand.keypoints) {
        // Loop through keypoints and draw circles
        for (let i = 0; i < hand.keypoints.length; i++) {
          let keypoint = hand.keypoints[i];

          // Color-code based on left or right hand
          if (hand.handedness == "Left") {
            fill(255, 0, 255);
          } else {
            fill(255, 255, 0);
          }

          noStroke();
          let px = map(keypoint.x, 0, video.width, x, x + w);
          let py = map(keypoint.y, 0, video.height, y, y + h);
          circle(px, py, 16);
        }

        // 串接關鍵點連線
        strokeWeight(5); // 設定線條粗細
        if (hand.handedness == "Left") {
          stroke(255, 0, 255); // 左手紫色
        } else {
          stroke(255, 255, 0); // 右手黃色
        }

        // 定義手指連線組：0-4(拇指), 5-8(食指), 9-12(中指), 13-16(無名指), 17-20(小指)
        let fingerParts = [
          [0, 1, 2, 3, 4],
          [5, 6, 7, 8],
          [9, 10, 11, 12],
          [13, 14, 15, 16],
          [17, 18, 19, 20]
        ];

        for (let part of fingerParts) {
          for (let i = 0; i < part.length - 1; i++) {
            let p1 = hand.keypoints[part[i]];
            let p2 = hand.keypoints[part[i + 1]];
            
            // 映射連線起點與終點座標
            let x1 = map(p1.x, 0, video.width, x, x + w);
            let y1 = map(p1.y, 0, video.height, y, y + h);
            let x2 = map(p2.x, 0, video.width, x, x + w);
            let y2 = map(p2.y, 0, video.height, y, y + h);
            
            line(x1, y1, x2, y2);
          }
        }
      }
    }
  }
}
