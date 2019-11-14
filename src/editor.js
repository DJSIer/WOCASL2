//const fs = require('fs');
//const {BrowserWindow, dialog} = require('electron').remote;

let inputArea = null;
let inputTxt = null;
let footerArea = null;


let currentPath = '';
var editor = null;

window.addEventListener('DOMContentLoaded', onLoad);

/**
 * Webページ読み込み時の処理
 */
function onLoad() {
  // 入力関連領域
  inputArea = document.getElementById('input_area');
  // 入力領域
  inputTxt = document.getElementById('input_txt');
  // フッター領域
  footerArea = document.getElementById('footer_fixed');
  var langTools = ace.require("ace/ext/language_tools");
  var staticWordCompleter = {
    getCompletions: function(editor, session, pos, prefix, callback) {
        var wordList = [
          ["LD"," GR , GR"," LD GR , GR"],["LD ","GR , Addr","LD GR , Addr"],["LAD ","GR , Addr","LAD GR , Addr"],["ST"," GR , Addr"," GR,Addr [,x]"],["ADDA"," GR , GR"," ADDA GR , GR"],["ADDA ","GR , Addr","ADDA GR , Addr [,x]"],
          ["ADDL"," GR , GR"," ADDL GR , GR"],["ADDL ","GR , Addr","ADDL GR , Addr [,x]"],["SUBA"," GR , Addr"," SUBA GR,Addr [,x]"],["SUBA"," GR , Addr","SUBA GR,Addr [,x]"],["SUBL"," GR , Addr"," SUBL GR,Addr [,x]"],["SUBL"," GR , Addr","SUBL GR,Addr [,x]"],
          ["AND"," GR , GR"," AND GR , GR"],["AND "," GR , Addr","AND GR,Addr [,x]"],["OR"," GR , GR"," OR GR , GR"],["OR "," GR , Addr","OR GR,Addr [,x]"],
          ["XOR"," GR , GR"," XOR GR , GR"],["XOR "," GR , Addr","XOR GR,Addr [,x]"]
        ];
        callback(null, wordList.map(function(word) {
            return {
                caption: word[0],
                value: word[0]+word[1],
                meta: word[2]
            };
        }));

    }
}
  
  editor = ace.edit('input_txt');
  //editor.getSession().setMode('ace/mode/javascript');
  langTools.setCompleters([staticWordCompleter])
  editor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: true
  });
  editor.session.setMode("ace/mode/casl2");
  var val = localStorage["caslcode"];
  if(val != undefined){
    editor.setValue(val,0);
  }
  editor.on("change",function(e){
    localStorage["caslcode"]=editor.getValue();
  })

  

  // ドラッグ&ドロップ関連処理
  // イベントの伝搬を止めて、アプリケーションのHTMLとファイルが差し替わらないようにする
  document.addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  document.addEventListener('drop', (event) => {
    event.preventDefault();
  });

  // 入力部分の処理
  inputArea.addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  inputArea.addEventListener('dragleave', (event) => {
    event.preventDefault();
  });
  inputArea.addEventListener('dragend', (event) => {
    event.preventDefault();
  });
  inputArea.addEventListener('drop', (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    readFile(file.path);
  });

  // 「読み込む」ボタンの制御
  document.querySelector('#btnLoad').addEventListener('click', () => {
    //openLoadFile();
    btnStepExecution.disabled = true;
  });
  // 「保存する」ボタンの制御
  document.querySelector('#btnSave').addEventListener('click', () => {
    //openLoadFile();
    var content = editor.getValue();
    var blob = new Blob([ content ], { "type" : "text/plain" });
    if (window.navigator.msSaveBlob) { 
      window.navigator.msSaveBlob(blob, "code.txt"); 
      // msSaveOrOpenBlobの場合はファイルを保存せずに開ける
      window.navigator.msSaveOrOpenBlob(blob, "code.txt"); 
    } else {
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.target = '_blank';
      a.download = 'code.txt';
      a.click();                
    }
  });
};

//行を選択します
function selectLine(value){
  editor.selection.moveCursorToPosition({row:value-1,column:0});
  editor.selection.selectLine();
}


/**
 * ファイルを開きます。
 */
function openLoadFile() {
  const win = BrowserWindow.getFocusedWindow();

  dialog.showOpenDialog(
    win,
    // どんなダイアログを出すかを指定するプロパティ
    {
      properties: ['openFile'],
      filters: [
        {
          name: 'Documents',
          extensions: ['txt', 'text', 'html', 'js']
        }
      ]
    },
    // [ファイル選択]ダイアログが閉じられた後のコールバック関数
    (fileNames) => {
      if (fileNames) {
        readFile(fileNames[0]);
      }
    });
}

/**
 * テキストを読み込み、テキストを入力エリアに設定します。
 */
function readFile(path) {
  currentPath = path;
  fs.readFile(path, (error, text) => {
    if (error != null) {
      alert('error : ' + error);
      return;
    }
    // フッター部分に読み込み先のパスを設定する
    footerArea.innerHTML = path;
    // テキスト入力エリアに設定する
    editor.setValue(text.toString(), -1);
  });
}

/**
 * ファイルを保存します。
 */
function saveFile() {

  //　初期の入力エリアに設定されたテキストを保存しようとしたときは新規ファイルを作成する
  if (currentPath === '') {
    saveNewFile();
    return;
  }

  const win = BrowserWindow.getFocusedWindow();

  dialog.showMessageBox(win, {
      title: 'ファイルの上書き保存を行います。',
      type: 'info',
      buttons: ['OK', 'Cancel'],
      detail: '本当に保存しますか？'
    },
    // メッセージボックスが閉じられた後のコールバック関数
    (response) => {
      // OKボタン(ボタン配列の0番目がOK)
      if (response === 0) {
        const data = editor.getValue();
        writeFile(currentPath, data);
      }
    }
  );
}

/**
 * ファイルを書き込みます。
 */
function writeFile(path, data) {
  fs.writeFile(path, data, (error) => {
    if (error != null) {
      alert('error : ' + error);
    }
  });
}

/**
 * 新規ファイルを保存します。
 */
function saveNewFile() {

  const win = BrowserWindow.getFocusedWindow();
  dialog.showSaveDialog(
    win,
    // どんなダイアログを出すかを指定するプロパティ
    {
      properties: ['openFile'],
      filters: [
        {
          name: 'Documents',
          extensions: ['txt', 'text', 'html', 'js']
        }
      ]
    },
    // セーブ用ダイアログが閉じられた後のコールバック関数
    (fileName) => {
      if (fileName) {
        const data = editor.getValue();
        currentPath = fileName;
        writeFile(currentPath, data);
      }
    }
  );
}