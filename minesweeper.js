const fieldLen = {
    "x": 10,
    "y": 10,
    "mine": 10,
}
const defaultSettings = {
    "solvable": {
        "name": {
            "kr": "풀 수 있는 퍼즐 생성",
            "en": "Solvable Puzzle",
            },
        "value": true,
        "description": {
            "kr": "찍기 없이 풀 수 있는 퍼즐을 생성합니다.",
            "en": "Make puzzle solvable without luck",
            },
        "type": "checkbox",
    },
    "life": {
        "name": {
            "kr": "생명",
            "en": "Life",
            },
        "value": 1,
        "description": {
            "kr": "지뢰를 밟을 때마다 1씩 깎이며, 0이 되면 패배합니다.",
            "en": "Every time step on a mine, life is cut by one, and you lose when life reach zero.",
            },
        "type": "number",
    },
    "language": {
        "name": {
            "kr": "언어",
            "en": "Language",
            },
        "value": "kr",
        "description": {
            "kr": "언어를 선택합니다.",
            "en": "Select a language.",
            },
        "type": "select",
        "dataList": {
            "kr": ["한글", "영어"],
            "en": ["Korean", "English"],
            },
    },
}
let settings = JSON.parse(JSON.stringify(defaultSettings));
let field;
let life;
let timer;
let time;
let minutes;
let seconds;
let min;
let sec;
let reveilCount;
let flagCount;
let processQueue;
let autoProcess;
let reveilQueue;
let isTest;
let mines;
let nearVeiledCount;
let nearFlagCount;
let nearVeiledCells;
let nearNumberedCells;
let somethingChanged;
let popupTimer;

function main() {
    document.body.innerHTML = '';
    const div = document.createElement('div');
    div.id = "MainPage";
    document.body.appendChild(div);
    let easyBtn;
    let normalBtn;
    let hardBtn;
    if (settings.language.value === "kr") {
        easyBtn = createStartBtn("작음");
        normalBtn = createStartBtn("중간");
        hardBtn = createStartBtn("큼");
    } else {
        easyBtn = createStartBtn("Small");
        normalBtn = createStartBtn("Medium");
        hardBtn = createStartBtn("Large");
    }
    const customBtn = createStartBtn();
    const settingsBtn = createSettingBtn();
    div.appendChild(easyBtn);
    div.appendChild(normalBtn);
    div.appendChild(hardBtn);
    div.appendChild(customBtn);
    div.appendChild(settingsBtn);
}

function createStartBtn(difficulty) {
    const startBtn = document.createElement('div');
    startBtn.id = "StartBtn";
    startBtn.className = 'Btn';
    if (settings.language.value === "kr") {
        startBtn.innerText = "자유 크기";
    } else {
        startBtn.innerText = "Custom Size";
    }
    startBtn.addEventListener('click', startGame);
    if (difficulty) {
        startBtn.id = `${difficulty}Btn`;
        startBtn.innerText = difficulty;
    }
    return startBtn;
}

function createSettingBtn() {
    const settingsBtn = document.createElement('div');
    settingsBtn.id = "SettingsBtn";
    settingsBtn.className = 'Btn';
    settingsBtn.innerText = "⚙️";
    settingsBtn.addEventListener('click', openSettings);
    return settingsBtn;
}

function startGame(e) {
    if (settings.solvable.value) {
        isTest = true;
    } else {
        isTest = false;
    }
    life = settings.life.value;
    reveilCount = [0, 0];
    flagCount = 0;
    time = 0;
    autoProcess = {};
    processQueue = [];
    reveilQueue = [];
    mines = [];
    const difficulty = e.target.innerText;
    if (difficulty === "작음" || difficulty === "Small") {
        fieldLen.x = 10;
        fieldLen.y = 10;
        fieldLen.mine = 10;
    } else if (difficulty === "중간" || difficulty === "Medium") {
        fieldLen.x = 15;
        fieldLen.y = 15;
        fieldLen.mine = 25;
    } else if (difficulty === "큼" || difficulty === "Large") {
        fieldLen.x = 20;
        fieldLen.y = 20;
        fieldLen.mine = 50;
    } else {
        getCustomInput();
        return;
    }
    generateField();
    displayField();
}

function getCustomInput() {
    const inputPopUp = makePopUp();
    const inputH2 = document.createElement('h2');
    inputPopUp.appendChild(inputH2);
    const inputTable = document.createElement("table");
    inputTable.id = 'InputTable';
    const widthTr = makeCustomInput('Width');
    const heightTr = makeCustomInput('Height')
    const countTr = makeCustomInput('Count');
    const startBtn = document.createElement('span');
    startBtn.id = "StartBtn";
    startBtn.className = 'Btn';
    if (settings.language.value === "kr") {
        inputH2.innerText = "크기 입력";
        startBtn.innerText = "시작";
    } else {
        inputH2.innerText = "Input Size";
        startBtn.innerText = "Start";
    }
    startBtn.addEventListener("click", handleInput);
    inputTable.appendChild(widthTr);
    inputTable.appendChild(heightTr);
    inputTable.appendChild(countTr);
    inputPopUp.appendChild(inputTable);
    inputPopUp.appendChild(startBtn);
    document.body.appendChild(inputPopUp);
}

function handleInput() {
    const inputWidth = document.querySelector('#InputWidth');
    const inputHeight = document.querySelector('#InputHeight');
    const inputCount = document.querySelector('#InputCount');
    const inputPopUp = document.querySelector('.PopUp');
    document.querySelector('.Alert')?.remove();
    if (inputWidth.value === '' || inputHeight.value === '' || inputCount.value === '') {
        const alertSpan = document.createElement('span');
        alertSpan.className = 'Alert';
        if (settings.language.value === "kr") {
            alertSpan.innerText = "값을 입력해주세요.";
        } else {
            alertSpan.innerText = "Insert a value.";
        }
        inputPopUp.appendChild(alertSpan);
        return;
    }
    const row = parseInt(inputWidth.value);
    const col = parseInt(inputHeight.value);
    const count = parseInt(inputCount.value);
    inputWidth.value = "";
    inputHeight.value = "";
    inputCount.value = "";
    if (row < 5 || col < 5) {
        const alertSpan = document.createElement('span');
        alertSpan.className = 'Alert';
        if (settings.language.value === "kr") {
            alertSpan.innerText = "가로와 세로는 5 이상이어야 합니다.";
        } else {
            alertSpan.innerText = "Horizontal and vertical must be at least 5.";
        }
        inputPopUp.appendChild(alertSpan);
        return;
    } else if (count < 1) {
        const alertSpan = document.createElement('span');
        alertSpan.className = 'Alert';
        if (settings.language.value === "kr") {
            alertSpan.innerText = "자연수를 입력하세요.";
        } else {
            alertSpan.innerText = "Insert a natural value.";
        }
        inputPopUp.appendChild(alertSpan);
        return;
    } else if (row * col <= count) {
        const alertSpan = document.createElement('span');
        alertSpan.className = 'Alert';
        if (settings.language.value === "kr") {
            alertSpan.innerText = "지뢰의 개수는 가로와 세로의 곱보다 적아야 합니다.";
        } else {
            alertSpan.innerText = "The number of mines must be less than the product of width and length.";
        }
        inputPopUp.appendChild(alertSpan);
        return;
    }
    fieldLen.x = row;
    fieldLen.y = col;
    fieldLen.mine = count;
    closePopUp();
    generateField();
    displayField();
}

function makeCustomInput(type) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    const span = document.createElement('span');
    if (settings.language.value === "kr") {
        if (type === 'Width') {
            span.innerText = '가로 칸 수';
        } else if (type === 'Height') {
            span.innerText = '세로 칸 수';
        } else if (type === 'Count') {
            span.innerText = '지뢰 개수';
        }
    } else {
        if (type === 'Width') {
            span.innerText = 'Width Cells';
        } else if (type === 'Height') {
            span.innerText = 'Height Cells';
        } else if (type === 'Count') {
            span.innerText = 'Mine Count';
        }
    }
    td.appendChild(span);
    const td2 = document.createElement('td');
    const input = document.createElement("input");
    input.id = `Input${type}`;
    input.type = "number";
    input.addEventListener('keydown', handleEnter);
    td2.appendChild(input);
    tr.appendChild(td);
    tr.appendChild(td2);
    return tr;
}

function handleEnter(e) {
    if (e.key === 'Enter') {
        if (e.target.id === 'InputWidth') {
            document.querySelector('#InputHeight').focus();
        } else if (e.target.id === 'InputHeight') {
            document.querySelector('#InputCount').focus();
        } else if (e.target.id === 'InputCount') {
            handleInput();
        }
    }
}

function restart() {
    if (settings.solvable.value) {
        isTest = true;
    } else {
        isTest = false;
    }
    life = settings.life.value;
    reveilCount = [0, 0];
    flagCount = 0;
    time = 0;
    autoProcess = {};
    processQueue = [];
    reveilQueue = [];
    mines = [];
    generateField();
    displayField();
}

function generateField() {
    field = [];
    for (let y = 0; y < fieldLen.y; y++) {
        field[y] = [];
        for (let x = 0; x < fieldLen.x; x++) {
            field[y][x] = ["", "veiled", "veiled"];
        }
    }
}

function displayField() {
    document.body.innerHTML = "";
    const upperBar = document.createElement('div');
    upperBar.id = 'UpperBar';
    const timeSpan = document.createElement("span");
    timeSpan.id = "Time";
    timeSpan.innerText = "00:00";
    const mainBtn = document.createElement('div');
    mainBtn.id = 'MainBtn';
    mainBtn.className = 'Btn';
    mainBtn.addEventListener('click', stop);
    const cm = document.createElement('div');
    cm.className = 'cm';
    if (settings.language.value === "kr") {
        mainBtn.innerText = '메인 메뉴';
        cm.innerText = '메인 메뉴';
    } else {
        mainBtn.innerText = 'Main Menu';
        cm.innerText = 'Main Menu';
    }
    upperBar.appendChild(cm);
    upperBar.appendChild(timeSpan);
    upperBar.appendChild(mainBtn);
    const tableBody = document.createElement('div');
    tableBody.id = 'TableBody';
    const fieldTable = document.createElement('table');
    fieldTable.addEventListener("mouseup", timerStart);
    fieldTable.id = 'FieldTable';
    for (let i = 0; i < fieldLen.y; i++) {
        const tr = document.createElement('tr');
        for (let j = 0; j < fieldLen.x; j++) {
            const td = document.createElement('td');
            td.classList.add('MineButton');
            td.dataset.x = j;
            td.dataset.y = i;
            if ((i + j) % 2 === 0) {
                td.classList.add('even');
            } else {
                td.classList.add('odd');
            }
            tr.appendChild(td);
        }
        fieldTable.appendChild(tr);
    }
    tableBody.appendChild(fieldTable);
    document.body.appendChild(upperBar);
    document.body.appendChild(tableBody);
}

function stop() {
    clearInterval(timer);
    main();
}

function timerStart(e) {
    const x = Number(e.target.dataset.x);
    const y = Number(e.target.dataset.y);
    const table = document.querySelector('table');
    const timeSpan = document.querySelector('#Time');
    table.removeEventListener('mouseup', timerStart);
    generateMines(x, y);
    if (settings.solvable.value) {
        isTest = true;
        makeSolbable(x, y);
    }
    isTest = false;
    reveil(x, y);
    reveilQueueProcess();
    const sound = new Audio('sounds/reveil.mp3');
    sound.play();
    minutes = 0;
    seconds = 0;
    min = '00';
    sec = '00';
    time = 0;
    timer = setInterval(() => {
        time++;
        if (time % 10 === 0) {
            seconds++;
            if (seconds === 60) {
                seconds = 0;
                minutes++;
                if (minutes < 10) {
                    min = `0${minutes}`;
                } else {
                    min = minutes;
                }
            }
            if (seconds < 10) {
                sec = `0${seconds}`;
            } else {
                sec = seconds;
            }
        }
        timeSpan.innerHTML = `${min}:${sec}`;
    }, 100);
    table.addEventListener('mouseup', handleClick);
}

function makeSolbable(x, y) {
    if (!isSolvable(x, y)) {
        reveilCount[1] = 0;
        generateField();
        generateMines(x, y);
        makeSolbable(x, y);
    }
}

function isSolvable(x, y) {
    reveil(x, y);
    reveilQueueProcess();
    somethingChanged = false;
    let i = 1;
    autoProcessing();
    console.log("1회 실행됨");
    while (somethingChanged === true) {
        somethingChanged = false;
        autoProcessing();
        i++;
        console.log(i+"회 실행됨");
    }
    
    if (reveilCount[1] === (fieldLen.x * fieldLen.y - fieldLen.mine)) {
        return true;
    } else {
        return false;
    }
}

function autoProcessing() {
    autoProcess = {};
    processQueue.forEach(cell => {
        const a = checkNear(cell[0], cell[1]);
        if (a.nearVeiledCells.length > 0) {
            if (a.count === a.nearFlagCount) {
                a.nearVeiledCells.forEach(cell => {
                    reveil(cell[0], cell[1]);
                })
                reveilQueueProcess();
            } else if (a.count === (a.nearFlagCount + a.nearVeiledCells.length)) {
                a.nearVeiledCells.forEach(cell => {
                    flag(cell[0], cell[1]);
                })
            } else {
                autoProcess[`${cell[0]}, ${cell[1]}`] = a;
            }
        } else {
            processQueue.splice(processQueue.indexOf(cell), 1);
        }
    });
    if (!somethingChanged) {
        Object.keys(autoProcess).forEach(key => {
            autoProcess[key].nearNumberedCells.every(cell => {
                const target = autoProcess[`${cell[0]}, ${cell[1]}`]
                const compare = JSON.parse(JSON.stringify(target.nearVeiledCells));
                if (processQueue.some(r => r[0] === cell[0] && r[1] && cell[1])) {
                    let count = 0;
                    autoProcess[key].nearVeiledCells.forEach(veiledCell => {
                        if (compare.some(c => c[0] === veiledCell[0] && c[1] === veiledCell[1])) {
                            compare.splice(compare.indexOf(c), 1)
                            count++;
                        }
                    });
                    if (count === autoProcess[key].nearVeiledCells.length) {
                        let leftCount = target.count - target.nearFlagCount - autoProcess[key].count + autoProcess[key].nearFlagCount;
                        if (compare.length === leftCount) {
                            compare.forEach(VC => flag(VC[0], VC[1]));
                            somethingChanged = true;
                            return false;
                        } else if (leftCount === 0) {
                            compare.forEach(VC => reveil(VC[0], VC[1]));
                            reveilQueueProcess();
                            somethingChanged = true;
                            return false;
                        }
                    }
                }
                return true;
            })
        })
    }
}

function handleClick(e) {
    const x = Number(e.target.dataset.x);
    const y = Number(e.target.dataset.y);
    if (e.target.classList.contains('MineButton')) {
        if (e.buttons === 0) {
            if (e.button === 0) {
                if (!cell.classList.contains('flag') && !cell.classList.contains('?')) {
                    reveilQueue = [];
                    const isMineClick = reveil(x, y);
                    if (!isMineClick) {
                        reveilQueueProcess();
                        const sound = new Audio('sounds/reveil.mp3');
                        sound.play();
                    }
                    checkEnd();
                }
            } else if (e.button === 2) {
                flag(x, y);
                checkEnd();
            }
        }
    } else if (e.target.classList.contains('Cell')) {
        if (((e.buttons === 2 && e.button === 0) || (e.buttons === 1 && e.button === 2)) && Number(e.target.innerHTML) !== NaN) {
            reveilQueue = [];
            const target = checkNear(x, y);
            if (target.nearFlagCount === target.count) {
                target.nearVeiledCells.forEach(cell => {
                    reveil(cell[0], cell[1]);
                })
                reveilQueueProcess();
                const sound = new Audio('sounds/reveil.mp3');
                sound.play();
            }
            checkEnd();
        }
    }
}

function reveilQueueProcess() {
    while (reveilQueue.length > 0) {
        for (let i = 0; i < reveilQueue.length; i++) {
            reveil(reveilQueue[0][0], reveilQueue[0][1]);
            reveilQueue.splice(0, 1);
        } 
    }
}

function reveil(x, y) {
    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    const data = field[y][x][0];
    let targetStatus;
    let target;
    if (isTest) {
        targetStatus = 2;
        target = 1;
    } else {
        targetStatus = 1;
        target = 0;
        cell.innerHTML = data;
        cell.classList.replace('MineButton', 'Cell');
    }
    if (field[y][x][targetStatus] === "reveiled") {
        return;
    }
    field[y][x][targetStatus] = "reveiled";
    if (data === "") {
        reveilCount[target]++;
        near(x, y, addToReveilQueue);
    } else if (typeof data === 'number') {
        reveilCount[target]++;
        if (checkQueue(x, y)) {
            processQueue.push([x, y]);
        }
    } else if (data === "💣") {
        field[y][x][targetStatus] = "flag";
        cell.innerHTML = "💥";
        life--;
        const sound = new Audio('sounds/explode.mp3');
        sound.play();
        return true;
    }
    somethingChanged = true;
}

function addToReveilQueue(x, y) {
    if (reveilQueue.some(r => r[0] === x && r[1] === y)) {
        return;
    }
    reveilQueue.push([x, y]);
}

function flag(x, y) {
    const cell = document.querySelector(`[data-x="${x}"][data-y="${y}"]`);
    if (isTest) {
        if (!cell.classList.contains('flag') && !cell.classList.contains('?')) {
            field[y][x][2] = "flag";
        } else if (cell.classList.contains('flag')) {
            field[y][x][2] = "?";
        } else if (cell.classList.contains('?')) {
            field[y][x][2] = "veiled";
        }
    } else {
        if (!cell.classList.contains('flag') && !cell.classList.contains('?')) {
            field[y][x][1] = "flag";
            cell.classList.add('flag');
            cell.innerHTML = "🚩";
            flagCount++;
        } else if (cell.classList.contains('flag')) {
            field[y][x][1] = "?";
            cell.classList.replace('flag', '?');
            cell.innerHTML = "❓";
            flagCount--;
        } else if (cell.classList.contains('?')) {
            field[y][x][1] = "veiled";
            cell.classList.remove('?');
            cell.innerHTML = "";
        }
    }
}

function checkQueue(x, y) {
    nearVeiledCount = 0;
    near(x, y, checkVeiled);
    if (nearVeiledCount !== 0) {
        return true;
    } else {
        return false;
    }
}

function checkVeiled(x, y) {
    if (field[y][x][1] === 'veiled') {
        nearVeiledCount++;
    }
}

function checkNear(x, y) {
    nearFlagCount = 0;
    nearVeiledCells = [];
    nearNumberedCells = [];
    near(x, y, checkSelf);
    return {nearFlagCount: nearFlagCount, nearVeiledCells: nearVeiledCells, nearNumberedCells: nearNumberedCells, count: field[y][x][0]};
}

function checkSelf(x, y) {
    let target;
    if (isTest) {
        target = 2;
    } else {
        target = 1;
    }
    if (field[y][x][target] === 'flag') {
        nearFlagCount++;
    } else if (field[y][x][target] === 'veiled') {
        nearVeiledCells.push([x, y]);
    } else if (typeof field[y][x][target] === 'number') {
        nearNumberedCells.push([x, y]);
    }
}

function checkEnd() {
    if (reveilCount[0] === (fieldLen.x * fieldLen.y - fieldLen.mine)) {
        win();
    } else if (life === 0) {
        lose();
    }
}

function generateMines(x, y) {
    mines = [];
    for (let i = 0; i < fieldLen.mine; i) {
        const mineX = Math.floor(Math.random() * fieldLen.x);
        const mineY = Math.floor(Math.random() * fieldLen.y);
        if (mineX < (x + 2) && mineX > (x - 2) && mineY < (y + 2) && mineY > (y - 2)) {
            continue;
        }
        if (mines.some(r => r[0] === mineX && r[1] === mineY)) {
            continue;
        }
        i++;
        mines.push([mineX, mineY]);
    }
    mines.forEach(mine => {
        field[mine[1]][mine[0]][0] = "💣";
        near(mine[0], mine[1], fillNumber);
    })
}

function fillNumber(x, y) {
    if (field[y][x][0] !== '💣') {
        field[y][x][0]++;
    }
}

function near(x, y, callback) {
    x = Number(x);
    y = Number(y);
    if (x === 0) {
        if (y === 0) {
            // left top
            callback(x + 1, y + 1);
            callback(x, y + 1);
        } else if (y === (fieldLen.y - 1)) {
            // left bottom
            callback(x, y - 1);
            callback(x + 1, y - 1);
        } else {
            // left center
            callback(x + 1, y + 1);
            callback(x, y + 1);
            callback(x, y - 1);
            callback(x + 1, y - 1);
        }
        callback(x + 1, y);
    } else if (x === (fieldLen.x - 1)) {
        if (y === 0) {
            // right top
            callback(x - 1, y + 1);
            callback(x, y + 1);
        } else if (y === (fieldLen.y - 1)) {
            // right bottom
            callback(x, y - 1);
            callback(x - 1, y - 1);
        } else {
            // right center
            callback(x - 1, y + 1);
            callback(x, y + 1);
            callback(x, y - 1);
            callback(x - 1, y - 1);
        }
        callback(x - 1, y);
    } else {
        if (y === 0) {
            // center top
            callback(x + 1, y + 1);
            callback(x, y + 1);
            callback(x - 1, y + 1);
        } else if (y === (fieldLen.y - 1)) {
            // center bottom
            callback(x - 1, y - 1);
            callback(x, y - 1);
            callback(x + 1, y - 1);
        } else {
            // center
            callback(x, y - 1);
            callback(x + 1, y - 1);
            callback(x + 1, y + 1);
            callback(x, y + 1);
            callback(x - 1, y + 1);
            callback(x - 1, y - 1);
        }
        callback(x + 1, y);
        callback(x - 1, y);
    }
}

function win() {
    end();
    const winPopUp = endPopUp('win');
    document.body.appendChild(winPopUp);
}

function lose() {
    end();
    for (let i = 0; i < mines.length; i++) {
        eval(`a${i} = setTimeout(() => {
            reveilMine(mines[i]);
        }, i * 100)`);
    }
    setTimeout(() => {
        document.addEventListener('mouseup', skipReveil);
    }, 50);

    popupTimer = setTimeout(() => {
        document.removeEventListener('mouseup', skipReveil);
        const losePopUp = endPopUp('lose');
        document.body.appendChild(losePopUp);
    }, mines.length * 100);
}

function end() {
    clearInterval(timer);
    const table = document.querySelector('table');
    table.removeEventListener('mouseup', handleClick);
}

function endPopUp(outcome) {
    const PopUp = makePopUp();
    PopUp.id = 'StatusPopUp';

    const outcomeH2 = document.createElement('h2');
    outcomeH2.id = 'OutcomeSpan';
    
    const timerTr = document.createElement('tr');
    const timerTd = document.createElement('td');
    const timerTd2 = document.createElement('td');
    timerTd2.id = 'TimerTd';
    min = Math.round(time/600);
    if (min < 10) {
        min = '0' + min;
    }
    sec = time%600/10;
    if (sec < 10) {
        sec = '0' + sec;
    }
    timerTd2.innerHTML = `${min}:${sec}`;
    timerTr.appendChild(timerTd);
    timerTr.appendChild(timerTd2);
    
    const sizeTr = document.createElement('tr');
    const sizeTd = document.createElement('td');
    const sizeTd2 = document.createElement('td');
    sizeTd2.id ='SizeTd';
    sizeTd2.innerHTML = `${fieldLen.x} × ${fieldLen.y}`;
    sizeTr.appendChild(sizeTd);
    sizeTr.appendChild(sizeTd2);
    
    const mineTr = document.createElement('tr');
    const mineTd = document.createElement('td');
    const mineTd2 = document.createElement('td');
    mineTd2.id ='MineTd';
    mineTd2.innerHTML = `${flagCount} / ${fieldLen.mine}`;
    mineTr.appendChild(mineTd);
    mineTr.appendChild(mineTd2);
    
    const lifeTr = document.createElement('tr');
    const lifeTd = document.createElement('td');
    const lifeTd2 = document.createElement('td');
    lifeTd2.id ='LifeTd';
    lifeTd2.innerHTML = `${life} / ${settings.life.value}`;
    lifeTr.appendChild(lifeTd);
    lifeTr.appendChild(lifeTd2);
    
    const statTable = document.createElement('table');
    statTable.id = 'StatTable';
    statTable.appendChild(timerTr);
    statTable.appendChild(sizeTr);
    statTable.appendChild(mineTr);
    statTable.appendChild(lifeTr);
    
    const restartBtn = document.createElement('div');
    restartBtn.id = 'RestartBtn';
    restartBtn.className = 'Btn';
    restartBtn.addEventListener('click', restart);
    
    const mainBtn = document.createElement('div');
    mainBtn.id = 'MainBtn';
    mainBtn.className = 'Btn';
    mainBtn.addEventListener('click', main);
    
    const btnWrapper = document.createElement('div');
    btnWrapper.id = 'BtnWrapper';
    btnWrapper.appendChild(restartBtn);
    btnWrapper.appendChild(mainBtn);
    
    if (settings.language.value === 'kr') {
        if (outcome === 'win') {
            outcomeH2.innerText = '승리';
        } else {
            outcomeH2.innerText = '패배';
        }
        timerTd.innerText = "걸린 시간";
        sizeTd.innerText = "맵 크기";
        mineTd.innerText = "꽂은 깃발의 수";
        lifeTd.innerText = "남은 생명";
        restartBtn.innerHTML = '재시작';
        mainBtn.innerHTML = '메인 메뉴';
    } else {
        if (outcome === 'win') {
            outcomeH2.innerText = 'Win';
        } else {
            outcomeH2.innerText = 'Loss';
        }
        timerTd.innerText = "Spent Time";
        sizeTd.innerText = "Map Size";
        mineTd.innerText = "Flags Count";
        lifeTd.innerText = "Left Life";
        restartBtn.innerHTML = 'Restart';
        mainBtn.innerHTML = 'Main Menu';
    }

    PopUp.appendChild(outcomeH2);
    PopUp.appendChild(statTable);
    PopUp.appendChild(btnWrapper);
    return PopUp;
}

function skipReveil() {
    document.removeEventListener('mouseup', skipReveil);
    for (let i = 0; i < mines.length; i++) {
        eval(`clearTimeout(a${i});`);
        reveilMine(mines[i]);
    }
    clearTimeout(popupTimer);
    const losePopUp = endPopUp();
    losePopUp.querySelector('#Close').remove();
    document.body.appendChild(losePopUp);
}

function reveilMine(mine) {
    if (field[mine[1]][mine[0]][1] !== "flag") {
        const sound = new Audio('sounds/explodes.mp3');
        sound.play();
        field[mine[1]][mine[0]][1] = "💣";
        const cell = document.querySelector(`[data-x="${mine[0]}"][data-y="${mine[1]}"]`);
        cell.innerHTML = "💣";
        cell.classList.replace('MineButton', 'Cell');
    }
}

function makePopUp() {
    cover();
    
    const closeBtn = document.createElement('span');
    closeBtn.id = "Close";
    closeBtn.className = 'Btn';
    closeBtn.innerText = "❌";
    closeBtn.addEventListener("click", closePopUp);
    const popUp = document.createElement('div');
    popUp.appendChild(closeBtn);
    popUp.className = "PopUp";
    return popUp;
}

function closePopUp() {
    uncover();
    document.body.querySelector('.PopUp').remove();
}

function cover() {
    const cover = document.createElement('div');
    cover.id = 'Cover';
    document.body.appendChild(cover);
}

function uncover() {
    document.body.querySelector('#Cover').remove();
}

function openSettings() {
    const settingPopUp = makePopUp();
    settingPopUp.id = "SettingsPopUp";
    const title = document.createElement('h2');
    settingPopUp.appendChild(title);
    const settingTable = document.createElement('table');
    settingTable.id = "SettingsTable";
    let target;
    if (settings.language.value === "kr") {
        target = "kr";
    } else {
        target = "en";
    }
    for (const key in settings) {
        const tr = document.createElement('tr');
        tr.id = key;
        const td1 = document.createElement('td');
        td1.innerText = settings[key].name[target];
        const tooltip = document.createElement('div');
        tooltip.className = 'Tooltip';
        tooltip.innerText = settings[key].description[target];
        td1.appendChild(tooltip);
        const td2 = document.createElement('td');
        let input;
        if (settings[key].type === "select") {
            input = document.createElement('select');
            settings[key].dataList[target].forEach(data => {
                console.log(data);
                const option = document.createElement('option');
                if (data === "Korean" || data === "한글") {
                    option.value = "kr";
                } else {
                    option.value = "en";
                }
                option.innerText = data;
                if (settings[key].value === option.value) {
                    option.selected = true;
                }
                input.appendChild(option);
            });
        } else {
            input = document.createElement('input');
            input.type = settings[key].type;
            if (input.type !== "checkbox") {
                input.value = settings[key].value;
            } else {
                input.checked = settings[key].value;
            }
        }
        td2.appendChild(input);
        input.addEventListener("change", changeSetting);
        tr.appendChild(td1);
        tr.appendChild(td2);
        settingTable.appendChild(tr);
    }
    const restoreBtn = document.createElement('div');
    restoreBtn.id = "Restore";
    restoreBtn.className = 'Btn';
    if (settings.language.value === "kr") {
        title.innerText = "설정";
        restoreBtn.innerText = "기본 설정으로 복구";
    } else {
        title.innerText = "Settings";
        restoreBtn.innerText = "Restore Default Settings";
    }
    restoreBtn.addEventListener("click", restoreSetting);
    const infoSpan = document.createElement('span');
    infoSpan.id = "InfoSpan";
    infoSpan.innerHTML = "Made by Penjuin";
    settingPopUp.appendChild(settingTable);
    settingPopUp.appendChild(restoreBtn);
    settingPopUp.appendChild(infoSpan);
    document.body.appendChild(settingPopUp);
}

function changeSetting(e) {
    const key = e.target.parentElement.parentElement.id;
    let value = e.target.value;
    if (settings[key].type === 'checkbox') {
        value = e.target.checked;
    }
    if (key === 'life' && value < 1) {
        e.target.value = 1;
    }
    settings[key].value = value;
    localStorage.setItem(key, JSON.stringify(value));
    if (key === 'language') {
        main();
        openSettings();
    }
}

function loadSetting() {
    Object.keys(settings).forEach(key => {
        if (localStorage.getItem(key)) {
            settings[key].value = JSON.parse(localStorage.getItem(key));
        }
    });
}

function restoreSetting() {
    settings = JSON.parse(JSON.stringify(defaultSettings));
    Object.keys(defaultSettings).forEach(key => {
        localStorage.setItem(key, settings[key].value);
        const tr = document.querySelector(`tr#${key}`);
        const input = tr.querySelector('input');
        input.value = settings[key].value;
        if (settings[key].type === 'checkbox') {
            input.checked = settings[key].value;
        }
    });
}

loadSetting();
main();
document.addEventListener('contextmenu', e => e.preventDefault());