import 'video.js/dist/video-js.css'; // 載入預設 CSS
import "../assets/scss/video.scss";

import subtitleZH from "../assets/vtt/squirrel.zh.vtt";
import subtitleEN from "../assets/vtt/squirrel.en.vtt";

import videojs from 'video.js';
import * as bootstrap from "bootstrap";


const referrer = document.referrer;
let lastPath = "";

if (referrer) {
  const url = new URL(referrer);
  lastPath = url.pathname.split("/").pop(); // 取最後一段

  // 預設回到 album.html
  ["album.html", "word-detail.html"].includes(lastPath) ? null : lastPath = "album.html";
} else {
  lastPath = "album.html";
}


const audio = document.getElementById('myAudio');
audio.muted = false;

let chooseSub = "zh";
let prevSub = "zh";

const vjsComponent = videojs.getComponent('Component');
const vjsButton = videojs.getComponent('Button');
const vjsMenuButton = videojs.getComponent('MenuButton');
const vjsMenuItem = videojs.getComponent('MenuItem');
const vjsPlaybackRateMenuButton = videojs.getComponent('PlaybackRateMenuButton');

const introDuration = 6; // 預告長度
const mainDuration = 60; // 正片長度
let firstLoad = false;

class TitleComponent extends vjsComponent {
  constructor(player, options) {
    super(player, options);
    this.el().classList.add('vjs-title');
    this.el().innerHTML = options.text || '影片標題';
  }
}
class CastButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('倒退10秒');
    this.addClass('vjs-cast-button');
  }
  handleClick() {
    console.log("Cast 按鈕被點擊！");
  }
}
class LockButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('倒退10秒');
    this.addClass('vjs-lock-button');
  }
  handleClick() {
    console.log("Lock 按鈕被點擊！");
  }
}
class BackButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('關閉影片');
    this.addClass('vjs-back-button');
  }
  handleClick() {
    // console.log(`關閉按鈕被點擊！ ${lastPath}`);
    // window.location.href = 'album.html';
    window.location.href = lastPath;
  }
}

class RewindButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('倒退10秒');
    this.addClass('vjs-rewind-button');
  }
  handleClick() {
    const current = this.player().currentTime();
    this.player().currentTime(Math.max(0, current - 10));
  }
}
class ForwardButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('快進10秒');
    this.addClass('vjs-forward-button');
  }
  handleClick() {
    const current = this.player().currentTime();
    this.player().currentTime(current + 10);
  }
}

class RemainingTime extends vjsComponent {
  constructor(player, options) {
    super(player, options);
    this.el().classList.add('vjs-remaining-time');
    player.on('timeupdate', () => this.update());
    player.on('loadedmetadata', () => this.update());
  }

  update() {
    const remaining = Math.max(0, player.duration() - player.currentTime());
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    this.el().textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  }
}

class TranslateButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('翻譯');
    this.addClass('vjs-translate-button');
  }
  handleClick() {
    console.log("翻譯按鈕被點擊！");
    const videoWrapper = document.querySelector('.video-wrapper');
    videoWrapper.classList.add("subs-panel-open");
  }
}
class MultiSubsButton extends vjsMenuButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('字幕');
    this.addClass('vjs-mulit-subs-button');
  }
  // 建立選單內容
  createItems() {
    const items = [];
    const labels = [
      { name:'中文', sub:'zh' },
      { name:'英文', sub:'en' },
      { name:'無字幕', sub:'' }
    ];
    const titleItem = new vjsMenuItem(this.player_, {
      label: "字幕",
      selectable: false
    });
    titleItem.addClass('vjs-menu-item-title');
    items.push(titleItem);

    labels.forEach(label => {      
      const item = new vjsMenuItem(this.player_, {
        label: label.name,
        selectable: true,
        multiSelectable: false
      });

      item.handleClick = function() {
        items.forEach(i => i.selected(false)); // 全部取消
        item.selected(true);                   // 自己打勾
        chooseSub = label.sub;
        player.getChild('Subtitle').update();
        // console.log(`切換字幕: ${label.name}`);
      }

      items.push(item);
    });

    // 預設 "中文" 被選中
    items[1].selected(true);

    return items;
  }
  // handleClick() {
  //   console.log("字幕按鈕被點擊！");
  // }
}
class CommentButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('留言');
    this.addClass('vjs-comment-button');
  }
  handleClick() {
    console.log("留言按鈕被點擊！");
  }
}
class CustomPlaybackRateButton extends vjsPlaybackRateMenuButton {
  createItems() {
    const items = [];

    const titleItem = new vjsMenuItem(this.player_, {
      label: "播放速度",
      selectable: false
    });
    titleItem.addClass('vjs-menu-item-title');
    items.push(titleItem);

    // 原本播放速度選項
    return items.concat(super.createItems());
  }
}
class ListButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('影集清單');
    this.addClass('vjs-list-button');
  }
  handleClick() {
    console.log("影集清單按鈕被點擊！");
  }
}
class NextButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('下一集');
    this.addClass('vjs-next-button');
  }
  handleClick() {
    console.log("下一集按鈕被點擊！");
  }
}

class WatchCreditsButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('觀看片尾');
    this.addClass('vjs-watch-credits-button');
    this.el().textContent = "觀看片尾";
  }
  handleClick() {
    console.log("觀看片尾按鈕被點擊！");
  }
}
class NextEpisodeButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('下一集');
    this.addClass('vjs-next-episode-button');

    // 建立進度條容器
    this.barEl = document.createElement('div');
    this.barEl.className = 'vjs-next-episode-bar';

    this.labelEl = document.createElement('span');
    this.labelEl.className = 'vjs-next-episode-label';
    this.labelEl.textContent = "下一集";
    
    this.el().appendChild(this.barEl);
    this.el().appendChild(this.labelEl);
  }
  handleClick() {
    console.log("下一集按鈕被點擊！");
  }
  startProgress(duration=10) {
    let progress = 0;
    const interval = 50; // 每 50ms 更新一次
    const bar = document.querySelector('.vjs-next-episode-bar');

    const timer = setInterval(() => {
      progress += interval / 1000; // 秒
      const percent = Math.min(progress / duration * 100, 100);

      // 動態更新漸層位置，右側透明漸層
      bar.style.background = `linear-gradient(to right, #3C8AF7 0%, #3C8AF7 ${percent}%, rgba(0,0,0,0.3) ${percent+5}%, rgba(0,0,0,0.3) 100%)`;

      if (percent >= 100) clearInterval(timer);
    }, interval);
  }
}
class QuizButton extends vjsButton {
  constructor(player, options) {
    super(player, options);
    this.controlText('課後測驗');
    this.addClass('vjs-quiz-button');
    this.el().textContent = "課後測驗";
  }
  handleClick() {
    const videoWrapper = document.querySelector('.video-wrapper');
    videoWrapper.classList.add("quiz-open");
    // 關閉其他版面
    videoWrapper.classList.remove("subs-panel-open");
    videoWrapper.classList.remove("word-define-open");
    // 影片暫停
    player.pause();
  }
}

// 註冊自訂按鈕
videojs.registerComponent('TitleComponent', TitleComponent);
videojs.registerComponent('CastButton', CastButton);
videojs.registerComponent('LockButton', LockButton);
videojs.registerComponent('BackButton', BackButton);

videojs.registerComponent('RewindButton', RewindButton);
videojs.registerComponent('ForwardButton', ForwardButton);

videojs.registerComponent('RemainingTime', RemainingTime);

videojs.registerComponent('TranslateButton', TranslateButton);
videojs.registerComponent('MultiSubsButton', MultiSubsButton);
videojs.registerComponent('CommentButton', CommentButton);
videojs.registerComponent('CustomPlaybackRateButton', CustomPlaybackRateButton);
videojs.registerComponent('ListButton', ListButton);
videojs.registerComponent('NextButton', NextButton);

videojs.registerComponent('WatchCreditsButton', WatchCreditsButton);
videojs.registerComponent('NextEpisodeButton', NextEpisodeButton);
videojs.registerComponent('QuizButton', QuizButton);

class ExtraGroup extends vjsComponent {
  constructor(player, options) {
    super(player, options);
    this.el().classList.add('vjs-extra-group');
    
    this.addChild('TitleComponent', { text: '六人行 | 第一季 EP2' }, 0);
    this.addChild('CastButton');
    this.addChild('LockButton');
    this.addChild('BackButton');
  }
}
class PlayGroup extends vjsComponent {
  constructor(player, options) {
    super(player, options);
    this.el().classList.add('vjs-play-group');
    
    this.addChild('RewindButton');
    this.addChild('playToggle');
    this.addChild('ForwardButton');
  }
}
class TimeGroup extends vjsComponent {
  constructor(player, options) {
    super(player, options);
    this.el().classList.add('vjs-time-group');
    
    this.addChild('progressControl');
    this.addChild('RemainingTime');
  }
}
class ToolsGroup extends vjsComponent {
  constructor(player, options) {
    super(player, options);
    this.el().classList.add('vjs-tools-group');
    
    this.addChild('TranslateButton');
    this.addChild('MultiSubsButton');
    this.addChild('CommentButton');
    this.addChild('CustomPlaybackRateButton');
    this.addChild('ListButton');
    this.addChild('NextButton');
  }
}
class EndScreenOptionsGroup extends vjsComponent {
  constructor(player, options) {
    super(player, options);
    this.el().classList.add('vjs-end-options-group');
    
    this.addChild('WatchCreditsButton');
    this.addChild('NextEpisodeButton');
    this.addChild('QuizButton');
  }
}

class Subtitle extends vjsComponent {
  constructor(player, options) {
    super(player, options);
    this.el().classList.add('vjs-subtitle');
    player.on('timeupdate', () => this.update());
    player.on('loadedmetadata', () => this.update());
  }

  update() {
    if(subtitles.length > 0) {
      const currentTime = player.currentTime();
      // 找到當前應顯示的字幕
      const idx = subtitles.findIndex(sub => currentTime >= sub.start && currentTime <= sub.end);
      if ((idx !== -1 && idx !== currentIndex) || (prevSub !== chooseSub)) {
        // 更新字幕文字
        if(chooseSub) {
          this.el().textContent = subtitles[idx][chooseSub]; // 或選擇顯示 zh / en
        } else {
          this.el().textContent = "";
        }
        prevSub !== chooseSub ? prevSub = chooseSub : null;
        currentIndex = idx;
      }
      // 沒有字幕時清空
      if (idx === -1 && currentIndex !== -1) {
        this.el().textContent = '';
        currentIndex = -1;
      }
    }
  }
}

videojs.registerComponent('ExtraGroup', ExtraGroup);
videojs.registerComponent('PlayGroup', PlayGroup);
videojs.registerComponent('TimeGroup', TimeGroup);
videojs.registerComponent('ToolsGroup', ToolsGroup);
videojs.registerComponent('Subtitle', Subtitle);
videojs.registerComponent('EndScreenOptionsGroup', EndScreenOptionsGroup);

// ----------- 初始化播放器 ----------
const player = videojs('myVideo', {
  autoplay: true,
  muted: false,
  bigPlayButton: false,
  controls: true,
  inactivityTimeout: 5000,
  userActions: {
    // 停用點擊切換播放
    click: false,
  },
  controlBar: {
    children: [
      'TimeGroup',
      'ToolsGroup'
    ],
  },
  playbackRates: [0.5, 1, 1.5, 2] // 自訂速度選單
});

player.addChild('ExtraGroup');
player.addChild('PlayGroup');

player.addChild('Subtitle');
player.addChild('EndScreenOptionsGroup');

// 同步播放/暫停
player.on('play', () => {
  // console.log('[DEBUG] Video.js 偵測到 play');
  if(firstLoad) {
    player.userActive(false);
    firstLoad = false;
  }
  audio.play();
});
player.on('pause', () => {
  // console.log('[DEBUG] Video.js 偵測到 pause');
  if (!document.hidden) {
    audio.pause();
    document.querySelector('.vjs-extra-group').style.opacity = '1';
    document.querySelector('.vjs-play-group').style.opacity = '1';
  }
});

// 同步快轉/倒退
player.on('seeked', () => {
  audio.currentTime = player.currentTime();
});

// 偵測時間更新 (影片是否真的停下來)
player.on('timeupdate', () => {
  // console.log('[DEBUG] 畫面時間 =', player.currentTime());
  const videoWrapper = document.querySelector(".video-wrapper");
  if (player.currentTime() >= mainDuration) {
    // console.log('正片播完了');
    // 顯示三個按鈕
    videoWrapper.classList.add("video-end");
  } else {
    videoWrapper.classList.remove("video-end");
  }
});

player.on('useractive', () => {
  // 當滑鼠或手勢操作時顯示按鈕
  document.querySelector('.vjs-extra-group').style.opacity = '1';
  document.querySelector('.vjs-play-group').style.opacity = '1';
  const videoWrapper = document.querySelector('.video-wrapper');
  videoWrapper.classList.add("video-js-mask");
});

player.on('userinactive', () => {
  if (!player.paused()) {
    // 超過 idle 時隱藏按鈕
    document.querySelector('.vjs-extra-group').style.opacity = '0';
    document.querySelector('.vjs-play-group').style.opacity = '0';
    const videoWrapper = document.querySelector('.video-wrapper');
    videoWrapper.classList.remove("video-js-mask");
  }
});

player.on('loadedmetadata', () => {
  firstLoad = true;
  if(lastPath === "word-detail.html") {
    player.currentTime(introDuration);
  }
});


let subtitles = []; // 全部字幕
let currentIndex = -1; // 當前顯示的字幕索引

// 載入字幕
loadSubtitles().then(data => {
  subtitles = data;

  const panel = document.getElementById('subtitle-panel');

  panel.innerHTML = '';
  // 建立字幕項目
  subtitles.forEach((sub, i) => {
    const li = renderSubtitleLine(sub, i);

    // 點擊跳時間
    li.addEventListener('click', () => {
      player.currentTime(sub.start + 0.000001);
    });

    panel.appendChild(li);
  });

  let currentMultiIndex = -1;
  // 播放進度更新
  player.on('timeupdate', () => {

    const currentTime = player.currentTime();
    const idx = subtitles.findIndex(sub => currentTime >= sub.start && currentTime <= sub.end);
    // console.log(`currentMultiIndex: ${currentMultiIndex} / idx: ${idx}`);

    if (idx !== -1 && idx !== currentMultiIndex) {
      // 移除前一個效果
      if (currentMultiIndex !== -1) {
        const prev = panel.querySelector(`.subtitle-item[data-index="${currentMultiIndex}"]`);
        if (prev) prev.classList.remove('active');
      }

      // 當前字幕加上效果並滾動到最上面
      const current = panel.querySelector(`.subtitle-item[data-index="${idx}"]`);
      if (current) {
        current.classList.add('active');
        current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }

      currentMultiIndex = idx;
    }

    // 沒有字幕時清空效果
    if (idx === -1 && currentMultiIndex !== -1) {
      const prev = panel.querySelector(`.subtitle-item[data-index="${currentMultiIndex}"]`);
      if (prev) prev.classList.remove('active');
      currentMultiIndex = -1;
    }
  });
});
// 讀取字幕
async function loadSubtitles() {
  const zh = await parseVTT(subtitleZH);
  const en = await parseVTT(subtitleEN);

  // 假設兩個檔的時間一樣，長度也一樣
  const combined = zh.map((item, idx) => ({
    start: item.start,
    end: item.end,
    zh: item.text,
    en: en[idx].text
  }));

  return combined;
}
// 簡單的 VTT parser
async function parseVTT(url) {
  const res = await fetch(url);
  const raw = await res.text();
  
  // 正規化換行與移除 BOM
  const text = raw.replace(/\uFEFF/g, '').replace(/\r\n|\r/g, '\n');
  const lines = text.split('\n');

  const cues = [];
  let i = 0;

  // 跳過 WEBVTT 標頭
  if (lines[i] && lines[i].startsWith('WEBVTT')) {
    i++;
    // 跳過空白或描述行
    while (i < lines.length && lines[i].trim() !== '') i++;
    if (lines[i] && lines[i].trim() === '') i++;
  }

  while (i < lines.length) {
    if (lines[i].trim() === '') { i++; continue; }

    const timeLine = lines[i];
    if (!timeLine.includes('-->')) { i++; continue; }

    // 解析時間
    const [startPart, restPart] = timeLine.split('-->');
    const start = parseTime(startPart.trim());
    const timeAndSettings = restPart.trim().split(/\s+/);
    const end = parseTime(timeAndSettings[0]);

    // 收集所有文字行
    i++;
    const payload = [];
    while (i < lines.length && lines[i].trim() !== '') {
      payload.push(lines[i]);
      i++;
    }

    cues.push({
      start,
      end,
      text: payload.join('\n'),  // 多行會合併
      lines: payload.slice()     // 如果要逐行處理
    });
  }
  
  return cues;
}
// VTT 時間格式 00:00:05.000 → 秒數
function parseTime(timeStr) {
  const m = timeStr.trim().match(/(?:(\d+):)?(\d{2}):(\d{2})([.,](\d{3}))?/);
  if (!m) return 0;
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2], 10);
  const sec = parseInt(m[3], 10);
  const ms = parseInt(m[5] || '0', 10);
  return h * 3600 + min * 60 + sec + ms / 1000;
}
function renderSubtitleLine(sub, i) {
  const li = document.createElement('li');
  li.className = 'subtitle-item';
  li.dataset.index = i;

  // 英文逐字拆分
  const enContainer = document.createElement('div');
  enContainer.className = 'subtitle-en';
  sub.en.split(' ').forEach(word => {
    const match = word.match(/^(\w+)([^\w]*)$/); 
    if (match) {
      const [_, core, punct] = match;

      // 單字 span
      if (core) {
        const span = document.createElement('span');
        span.textContent = punct ? core : core + ' ';
        span.className = 'word';
        span.addEventListener('mouseenter', () => span.classList.add('highlight'));
        span.addEventListener('mouseleave', () => span.classList.remove('highlight'));
        // mousedown → 變藍
        span.addEventListener('mousedown', (event) => span.classList.add('highlight'));
        // mouseup → 開啟雙語字幕面板
        span.addEventListener('mouseup', (event) => {
          span.classList.remove('highlight'); // 可選：保留或移除藍色
          const videoWrapper = document.querySelector('.video-wrapper');
          videoWrapper.classList.add("word-define-open");
        });
        span.addEventListener('click', (e) => e.stopPropagation());
        enContainer.appendChild(span);
      }

      // 尾部標點直接文字節點
      if (punct) {
        enContainer.appendChild(document.createTextNode(punct + ' '));
      }
    }
  });

  // 中文字幕
  const zhDiv = document.createElement('div');
  zhDiv.className = 'subtitle-zh';
  zhDiv.textContent = sub.zh;

  li.appendChild(enContainer);
  li.appendChild(zhDiv);

  return li;
}


// 關閉雙語字幕面板
const mutiSubsClose = document.querySelector("#muti-subs-close");
mutiSubsClose.addEventListener('click', (e) => {
  const videoWrapper = document.querySelector('.video-wrapper');
  videoWrapper.classList.remove("subs-panel-open");
});

// 關閉收藏單字面板
const backMutiSubsArea = document.querySelector("#back-muti-subs-area");
backMutiSubsArea.addEventListener('click', (e) => {
  const videoWrapper = document.querySelector('.video-wrapper');
  videoWrapper.classList.remove("word-define-open");
  // 收藏按鈕取消已收藏效果
  const favoriteIcon = document.querySelector("#favorite-icon");
  favoriteIcon.classList.remove("active");
});

// 收藏按鈕點擊效果
const favoriteIcon = document.querySelector("#favorite-icon");
favoriteIcon.addEventListener('click', (e) => {
  favoriteIcon.classList.toggle("active");
});

// 關閉片尾測驗
const quizExitBtn = document.querySelector("#quiz-exit-btn");
quizExitBtn.addEventListener('click', (e) => {
  const videoWrapper = document.querySelector('.video-wrapper');
  videoWrapper.classList.remove("quiz-open");
  // 測驗結束，下一集按鈕顯示進度條效果
  if(videoWrapper.classList.contains("quiz-end")) {
    const nextEpisodeButton = player.getChild('EndScreenOptionsGroup').getChild('NextEpisodeButton');
    nextEpisodeButton.startProgress(6); // 6 秒填滿
  }
});


const questions = [
  {
    word: "miraculous",
    options: [
      { en: "hesitantly", zh: "猶豫地", correct: false },
      { en: "coincidence", zh: "巧合", correct: false },
      { en: "miraculous", zh: "神奇", correct: true },
      { en: "slip", zh: "滑", correct: false }
    ]
  }
];
const quiz = document.getElementById("question-section");
let quizLocked = false;
// 建立題目
function renderQuestion(question) {
  quiz.innerHTML = ""; // 清空

  question.options.forEach((opt, idx) => {
    const li = document.createElement("li");
    li.className = "question-item";    
    li.dataset.index = idx;
    
    const button = document.createElement("button");
    button.type = "button";
    button.classList.add("btn", "btn-primary", "w-100", "rounded-pill", "text-white", "d-flex", "justify-content-center", "py-5");
    // 預設只顯示英文
    button.innerHTML = `
        <span class="en fs-7">${opt.en}</span>
    `;

    // 預設藍色背景
    li.appendChild(button);
    
    const handler = () => {
      if (quizLocked) return;
      quizLocked = true;
      handleAnswer(li, question);
    };
    // 點擊事件
    li.addEventListener("click", handler);

    quiz.appendChild(li);
  });
}
let isCorrect = false;
// 點擊處理
function handleAnswer(selectedLi, question) {
  const allOptions = quiz.querySelectorAll(".question-item");

  allOptions.forEach(li => {
    const idx = li.dataset.index;
    const option = question.options[idx];

    // 點擊後顯示中文翻譯
    const button = li.children[0];
    button.innerHTML += `
      <span class="zh fs-7 ms-2">${option.zh}</span>
    `;
    if (li === selectedLi) {
      if (option.correct) {
        // 選對
        isCorrect = true;
        button.classList.remove("btn-primary");
        button.classList.add("btn-success");
        button.innerHTML += `<span class="material-symbols-rounded ms-2">check_circle</span>`;
      } else {
        // 選錯
        button.classList.remove("btn-primary");
        button.classList.add("btn-danger");
        button.innerHTML += `<span class="material-symbols-rounded ms-2">cancel</span>`;
      }
    } else if (option.correct) {
      // 顯示正確答案
      button.classList.remove("btn-primary");
      button.classList.add("btn-success");
      button.innerHTML += `<span class="material-symbols-rounded ms-2">check_circle</span>`;
    }
  });

  const videoWrapper = document.querySelector('.video-wrapper');
  videoWrapper.classList.add("quiz-end");

  // 五秒後處理保留邏輯
  setTimeout(() => {
    const title = document.getElementById("quiz-question-title");
    title.textContent = isCorrect ? "恭喜答對，你已完成測驗" : "很可惜，正確解答是";
    const classesToCheck = ['btn-success', 'btn-danger'];
    allOptions.forEach(li => {
      const button = li.children[0];
      const hasAnyClass = classesToCheck.some(c => button.classList.contains(c));
      if (!hasAnyClass) {
        li.style.display = "none"; // 移除
      }
    });
    videoWrapper.classList.add("quiz-end-pos-change");
  }, 5000);
}
// 初始化第一題
renderQuestion(questions[0]);


// 若為直式，顯示提示訊息
function checkOrientation() {
  const isMobile = /Mobi|Android|iPhone/i.test(navigator.userAgent);
  const isPortrait = window.innerHeight > window.innerWidth;
  const warning = document.getElementById("orientation-warning");

  if (isMobile && isPortrait) {
    // warning.style.display = "flex"; // 顯示遮罩
    warning.classList.add("active");
  } else {
    // warning.style.display = "none"; // 隱藏遮罩
    warning.classList.remove("active");
  }
}
// 初始檢查
window.addEventListener("load", checkOrientation);
// 旋轉 or 視窗變動時檢查
window.addEventListener("resize", checkOrientation);
// 補上部分瀏覽器支援的 orientation API
if (screen.orientation && screen.orientation.addEventListener) {
  screen.orientation.addEventListener("change", checkOrientation);
}
