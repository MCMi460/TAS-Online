  // TAS-related variables
  const keys = [
    'NONE',
    'KEY_A',
    'KEY_B',
    'KEY_X',
    'KEY_Y',
    'KEY_L',
    'KEY_R',
    'KEY_ZL',
    'KEY_ZR',
    'KEY_PLUS',
    'KEY_MINUS',
    'KEY_DLEFT',
    'KEY_DUP',
    'KEY_DRIGHT',
    'KEY_DDOWN',
    'KEY_LSTICK',
    'KEY_RSTICK',
  ];
  const YES = '✅';
  const NO = '⛔';
  var defaultBuffer = '1 NONE 0;0 0;0';
  var bufferArray = ['1 KEY_B 0;0 0;0\n6 KEY_ZL 0;0 0;0\n41 KEY_ZL;KEY_Y 0;0 0;0\n43 KEY_X;KEY_A 30000;0 0;0\n44 KEY_A 30000;0 0;0\n45 KEY_A 30000;0 0;0\n46 KEY_A 30000;0 0;0\n47 KEY_A 30000;0 0;0',];
  var bufferTitles = ['Main Script',];
  var bufferIndex = 0;
  var pasteboard = 'NONE 0;0 0;0';
  var url = window.location.href;
  var baseUrl = url.split('?')[0].replaceAll('#','');

  // Important functions
  function setupUI() {
    // Create table columns
    var apparatus = document.getElementById('apparatus');
    var main = document.getElementById('main');
    document.getElementById('file-dialog').value = '';
    try {

      // Check for url parameters
      let queries = url.split('?');
      if (queries.length > 1 && queries[1] != '') {
        bufferArray[bufferIndex] = loadFromQuery();
      }
      document.getElementById('reset').href = baseUrl;

      loadHeader();
      populateTable();

      var sec = 0

      function cycle() {
        sec = (Number(sec) + .1).toFixed(1);

        fillText(sec);
      }

      fillText(sec);
      setInterval(cycle,100);

      // Create listener for tableUpdate
      const updateEvent = document.querySelector('#apparatus');
      updateEvent.addEventListener('click', function (e) {
        try {
          let cell = e.target.closest('td');
          if (!cell) {
            return;
          }
          let row = cell.parentElement.rowIndex;
          let col = cell.cellIndex;

          tableUpdate(row, col, cell);
        } catch (e) {
          console.log(e);
          main.innerHTML += `<h3 style='color:#d11b24;'>${e}</h3>`;
        }
      });

      // XY Div
      function checkInput(e) {
        var chr = String.fromCharCode(e.which);
        if ('1234567890-'.indexOf(chr) < 0) {
          return false;
      }};
      let xcoord = document.getElementById('x-coordinate');
      let ycoord = document.getElementById('y-coordinate');
      xcoord.onkeypress = checkInput; xcoord.addEventListener('input', inputUpdate);
      ycoord.onkeypress = checkInput; ycoord.addEventListener('input', inputUpdate);

      const funcbox = document.querySelector('#funcbox');
      funcbox.addEventListener('change', (event) => {
        bufferIndex = Number(event.target.value);
        populateTable();
      });

      document.addEventListener('keydown', e => {
        if (document.getElementById('joystick-container').style.width == '100%' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          inputUpdate(e);
        }
      });
      // End of listeners

    } catch (e) {
      console.log(e);
      main.innerHTML += `<h3 style='color:#d11b24;'>${e}</h3>`;
    }
  }

  function loadFromQuery() {
    let search = new URL(url);
    let data = search.searchParams.get('buffer').split('~');
    let tempBuffer = '';
    let lastFrame = 0;
    if (data) {
      for (let i = 0; i < data.length; i++) {
        if (data[i] == '') {
          continue;
        }
        let line = data[i].split('.');
        let _key = line[1].split('_');
        let key = [];
        for (let n = 0; n < _key.length; n++) {
          key.push(keys[_key[n]]);
        }
        if (!key[0]) {
          key = ['NONE'];
        }
        line[0] = Number(line[0]);
        tempBuffer += `${line[0] + lastFrame} ${key.join(';')} ${line[2].replaceAll('_',';')} ${line[3].replaceAll('_',';')}\n`
        lastFrame += line[0];
      }
      bufferArray[bufferIndex] = tempBuffer;
    }
    return bufferArray[bufferIndex];
  }

  function createQuery() {
    let parameters = [];

    let tempBuffer = '';
    let data = bufferArray[bufferIndex].split('\n');
    let lastFrame = 0;
    for (let i = 0; i < data.length; i++) {
      if (data == '') {
        continue;
      }
      let line = data[i].split(' ');
      let _key = line[1].split(';');
      let key = [];
      for (let n = 0; n < _key.length; n++) {
        key.push(`${keys.indexOf(_key[n])}`);
      }
      if (key.length == 1 && key[0] == '0') {
        key = [''];
      }
      line[2] = line[2].split(';');
      if (line[2][0] == '0') {line[2][0] = '';} if (line[2][1] == '0') {line[2][1] = '';}
      line[3] = line[3].split(';');
      if (line[3][0] == '0') {line[3][0] = '';} if (line[3][1] == '0') {line[3][1] = '';}
      line[0] = Number(line[0]);
      tempBuffer += `${line[0] - lastFrame}.${key.join('_')}.${line[2].join('_')}.${line[3].join('_')}~`;
      lastFrame = line[0];
    }

    parameters.push(encodeURIComponent('buffer') + '=' + encodeURIComponent(tempBuffer));

    return baseUrl + '?' + parameters.join('&');
  }

  function copy(index) {
    let row = apparatus.children[index].children;

    let frame = row[0].innerHTML;

    let key = [];
    for (let n = 3; n < row.length; n++) {
      if (row[n].innerHTML == YES) {
        key.push(keys[n - 2]);
      }
    }
    if (key == '') {
      key = ['NONE',];
    }
    key = key.join(';');

    lstick = row[1].innerHTML.split(',').map(Number);
    rstick = row[2].innerHTML.split(',').map(Number);

    pasteboard = `${key} ${lstick.join(';')} ${rstick.join(';')}\n`;
    return pasteboard;
  }

  function paste(frame,data = pasteboard) {
    let tempBuffer = bufferArray[bufferIndex].split('\n');

    let possibleFrame = 0;
    for (let i = 0; i < tempBuffer.length; i++) {
      if (!tempBuffer[i] || !/\S/.test(tempBuffer[i])) {
        continue;
      }
      possibleFrame = Number(tempBuffer[i].split(' ')[0]);
      if (possibleFrame > frame) {
        tempBuffer.splice(i, 0, `${frame} ${data}`);
        break;
      }
      possibleFrame += 1;
    }
    if (possibleFrame == Number(tempBuffer[tempBuffer.length - 1].split(' ')[0]) + 1 || (tempBuffer.length == 1 && tempBuffer[0] == '') ) {
      tempBuffer.push(`${frame} ${data}`);
    }
    bufferArray[bufferIndex] = tempBuffer.join('\n');

    // Refill the table
    populateTable();
  }

  function newFrame() {
    let frame = 0;
    if (apparatus.children.length > 1) {
      frame = Number(apparatus.children[apparatus.children.length - 1].children[0].innerHTML);
    }
    paste(frame + 1,'NONE 0;0 0;0');
  }

  function delFrame() {
    if (apparatus.children.length > 1) {
      var option = Number(apparatus.children[1].children[0].innerHTML);
    } else {
      return;
    }
    let prompt = window.prompt('Which frame should be removed?', option);
    if (!prompt) {
      return;
    }
    let frame = Number(prompt);
    if (Number.isInteger(frame)) {
      let rows = apparatus.children;
      for (let i = 1; i < rows.length; i++) {
        if (Number(rows[i].children[0].innerHTML) == frame) {
          apparatus.removeChild(rows[i]);
          break;
        }
      }
    }

    tableUpdate(0,0);
  }

  function readFile(event) {
    try {
      var input = event.target;

      var reader = new FileReader();
      reader.onload = function() {
        bufferArray[bufferIndex] = reader.result;
        populateTable(true);
      };
      reader.readAsText(input.files[0]);
    } catch (e) {
      console.log(e);
      main.innerHTML += `<h3 style='color:#d11b24;'>${e}</h3>`;
    }
  }

  function downloadBuffer() { /* Although the function name implies it only downloads one buffer,
    recent updates have changed its functionality to include the entire buffer array */
    for (let i = 0; i < bufferArray.length; i++) {
      let elem = document.createElement('a');
      elem.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(bufferArray[i]));
      elem.setAttribute('download', bufferTitles[i] + '.txt');

      elem.style.display = 'none';
      document.body.appendChild(elem);

      elem.click();

      document.body.removeChild(elem);
    }
  }

  function loadHeader() {
    let columns = [];
    columns.push(...keys);
    columns.shift();
    columns.unshift('Frame','L-Stick','R-Stick');
    for (let i = 0; i < columns.length; i++)  {
      let td = document.createElement('th');
      let text = columns[i];
      if (i > 2) {
        text = text.substring(4);
      }
      td.innerHTML = text; td.title = text;
      header.appendChild(td);
    }
  }

  function populateTable(newFile = false) {
    while (apparatus.children.length > 1) {
      apparatus.removeChild(apparatus.lastChild);
    }

    const lines = bufferArray[bufferIndex].split('\n');
    for (let i = 0; i < lines.length; i++) {
      // Create row
      let line = lines[i].split(' ');
      if (!line || !/\S/.test(line)) {
        continue;
      }
      let row = document.createElement('tr');

      // Frame
      let frame = document.createElement('td'); frame.className = 'frame';
      frame.innerHTML = line[0];
      row.appendChild(frame);

      // Sticks
      let stick1 = line[2].split(';').map(Number); let stick2 = line[3].split(';').map(Number);
      let lstick = document.createElement('td'); let rstick = document.createElement('td');
      lstick.className = 'lstick'; rstick.className = 'rstick';
      lstick.innerHTML = stick1; rstick.innerHTML = stick2;
      lstick.title = stick1; rstick.title = stick2;
      row.appendChild(lstick); row.appendChild(rstick);

      // Keys
      let key = line[1].split(';');
      for (let n = 0; n < key.length; n++) {
        if (!keys.includes(key[n])) {
          throw `Key at frame ${line[0]} [Input #${apparatus.children.length}] does not exist.`
        }
      }
      for (let n = 1; n < keys.length; n++) {
        let keyElem = document.createElement('td'); keyElem.className = 'key';
        if (key.includes(keys[n])) {
          keyElem.innerHTML = YES;
        } else {
          keyElem.innerHTML = NO;
        }
        row.appendChild(keyElem);
      }

      apparatus.appendChild(row);
    }
    bufferArray[bufferIndex] = sortTable();
    populateCombo();
    if (newFile) {
      tableUpdate(0,0);
    }
  }

  function sortTable() {
    let rows = apparatus.children;
    let data = [];
    let possibleFrame = 0;
    for (let i = 1; i < rows.length; i++) {
      let row = rows[i].children;

      // Get frame
      let frame = Number(row[0].innerHTML);

      // Get keys
      let key = [];
      for (let n = 3; n < row.length; n++) {
        if (row[n].innerHTML == YES) {
          key.push(keys[n - 2]);
        }
      }
      if (key == '') {
        key = ['NONE',];
      }
      key = key.join(';');

      // Get sticks
      let lstick = row[1].innerHTML.split(',').map(Number);
      let rstick = row[2].innerHTML.split(',').map(Number);

      if (possibleFrame < frame) {
        possibleFrame = frame;
      } else {
        frame = possibleFrame + 1;
        possibleFrame = frame;
      }

      // Write to string variable
      data.push(`${frame} ${key} ${lstick.join(';')} ${rstick.join(';')}`);
    }
    data.sort(function(elem1,elem2) {
      return Number(elem2.split(' ')[0]) - Number(elem1.split(' ')[0]);
    }).reverse();
    return data.join('\n');
  }

  function newBuffer() {
    let title = window.prompt('What would you like to name this script?', '');
    if (!title) {
      return;
    }
    if (bufferTitles.includes(title)) {
      window.alert('That script name is already taken!');
      return;
    }
    bufferArray.push(defaultBuffer);
    bufferTitles.push(title);
    bufferIndex = bufferArray.length - 1;

    // Refill the table
    populateTable();
  }

  function delBuffer(index = bufferIndex) {
    if (!window.confirm('Are you sure you want to delete the current script?')) {
      return;
    } else {
      bufferArray.splice(index, 1);
      bufferTitles.splice(index, 1);
      if (bufferIndex != 0) {
        bufferIndex--;
      }
    }
    if (bufferArray.length <= 0) {
      bufferArray = [defaultBuffer,];
      bufferTitles = ['Main Script',];
    }

    // Refill the table
    populateTable();
  }

  function populateCombo() {
    let comboBox = document.getElementById('funcbox');

    for (let i = comboBox.length - 1; i >= 0; i--) {
      comboBox.remove(i);
    }

    for (let n = 0; n < bufferArray.length; n++) {
      let option = document.createElement('option');
      option.text = bufferTitles[n];
      option.value = String(n);
      comboBox.add(option);
    }

    comboBox.value = String(bufferIndex);
  }

  function removeRow(row) {
    row = apparatus.children[row];
    apparatus.removeChild(row);
    tableUpdate(0,0);
    return row;
  }

  function fillText(sec = 0) {
    let textarea = document.querySelector('.sidebar').children[1];

    let date = new Date();
    let time = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
    let tag = `Buffer updated at ${time} (${sec} seconds of runtime)`;

    textarea.title = tag;
    textarea.innerHTML = '<code>' + bufferArray[bufferIndex].replaceAll('\n','<br>') + `</code><br><br>${tag}`;
  }

  function changeKey(row, col) {
    if (apparatus.children[row].children[col].innerHTML == YES) {
      apparatus.children[row].children[col].innerHTML = NO;
    } else {
      apparatus.children[row].children[col].innerHTML = YES;
    }
  }

  function changeFrame(row, col) {
    let prompt = window.prompt('After which frame should this one be placed?', '1');
    if (prompt) {
      let frame = Number(prompt);
      if (Number.isInteger(frame)) {
        copy(row);
        removeRow(row);
        paste(frame);
      }
    }
  }

  function checkBounds(x,y,radius) {
    // Check if out of bounds
    if (Math.sqrt((x - 0) ** 2 + (y - 0) ** 2)  > radius) {
      // Outside of circle
      return false;
    }
    // Cap X/Y level to radius
    if (x > radius) {
      x = radius;
      return false;
    } else if (x < (-1 * radius)) {
      x = -1 * radius;
      return false;
    }
    if (y > radius) {
      y = radius;
      return false;
    } else if (y < (-1 * radius)) {
      y = -1 * radius;
      return false;
    }
    return true;
  }

  function cursorMove(e) {
    if (e.buttons != 1 && e.buttons != undefined) {
      return;
    }
    let clientX = e.clientX;
    let clientY = e.clientY;
    if (e.buttons == undefined) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }
    let joystick = document.getElementById('joystick');
    let radius = 32767;
    let x = (clientX - joystick.offsetLeft - joystick.offsetWidth / 2) * radius / (joystick.offsetWidth / 2);
    let y = ((clientY - joystick.offsetTop - joystick.offsetWidth / 2) * -1) * radius / (joystick.offsetWidth / 2);
    x = x.toFixed(0); y = y.toFixed(0);
    if (!checkBounds(x,y,radius)) {
      return;
    }
    // Set coords
    let coords = document.getElementById('coords').children;
    coords[0].value = `${x}`;
    coords[1].value = `${y}`;
    // Move cursor
    let cursor = document.getElementById('joystick-cursor');
    cursor.style.left = `calc(${clientX}px - 1vmin)`;
    cursor.style.top = `calc(${clientY}px - 1vmin)`;
  }

  function inputUpdate(e = null) {
    let joystick = document.getElementById('joystick');
    let coords = document.getElementById('coords').children;
    let cursor = document.getElementById('joystick-cursor');
    let radius = 32767;
    if (e) {
      switch (e.key) {
        case 'ArrowUp':
          coords[1].value = String(Number(coords[1].value) + 50);
          break;
        case 'ArrowLeft':
          coords[0].value = String(Number(coords[0].value) - 50);
          break;
        case 'ArrowRight':
          coords[0].value = String(Number(coords[0].value) + 50);
          break;
        case 'ArrowDown':
          coords[1].value = String(Number(coords[1].value) - 50);
          break;
      }
    }
    let x = Number(coords[0].value);
    let y = Number(coords[1].value);
    let clientX = x * (joystick.offsetWidth / 2) / radius + joystick.offsetWidth / 2 + joystick.offsetLeft;
    let clientY = y * (joystick.offsetWidth / 2) / radius / -1 + joystick.offsetWidth / 2 + joystick.offsetTop;
    if (!checkBounds(x,y,radius)) {
      coords[0].value = 0;
      coords[1].value = 0;
      inputUpdate();
      return;
    }
    cursor.style.left = `calc(${clientX}px - 1vmin)`;
    cursor.style.top = `calc(${clientY}px - 1vmin)`;
  }

  function changeStick(row, col) {
    let container = document.getElementById('joystick-container');
    let cursor = document.getElementById('joystick-cursor');
    let xCrosshair = document.getElementById('joystick-x-crosshair');
    let yCrosshair = document.getElementById('joystick-y-crosshair');
    if (row == 0 && col == 0) {
      // Get coordinates to write
      let x = document.getElementById('x-coordinate').value;
      let y = document.getElementById('y-coordinate').value;

      // Get location of cell
      let cellR = container.title.split(', ')[0];
      let cellC = container.title.split(', ')[1];

      apparatus.children[cellR].children[cellC].innerHTML = `${x},${y}`;
      apparatus.children[cellR].children[cellC].title = `${x},${y}`;
      container.title = '';

      // Close joystick-related elements
      container.style.width = '0%';
      cursor.style.display = 'none';
      xCrosshair.style.display = 'none';
      yCrosshair.style.display = 'none';

      tableUpdate(0,0);
      return;
    }
    container.style.width = '100%';
    container.title = `${row}, ${col}`;
    cursor.style.display = 'block';
    xCrosshair.style.display = 'block';
    yCrosshair.style.display = 'block';
    let [x,y] = apparatus.children[row].children[col].innerHTML.split(',').map(Number);
    document.getElementById('x-coordinate').value = `${x}`;
    document.getElementById('y-coordinate').value = `${y}`;
    inputUpdate();
  }

  // Events

  function tableUpdate(row, col, cell = false) {
    if (cell) {
      if (cell.className == 'frame') {
        changeFrame(row, col);
      } else if (cell.className == 'lstick' || cell.className == 'rstick') {
        changeStick(row, col);
      } else if (cell.className == 'key') {
        changeKey(row, col);
      }
    }

    // Sort table, then write the changes
    bufferArray[bufferIndex] = sortTable();
    // Fill table
    populateTable();
  }

  function sidebar(toggle) {
    if (toggle) {
      document.querySelector('.sidebar').setAttribute("id", "open");
    } else {
      document.querySelector('.sidebar').removeAttribute("id", "open");
    }
  }

  function funcbar(toggle) {
    let width = '0%';
    if (toggle) {
      width = '40%';
    }
    document.getElementById('funcbar').style.width = width;
  }

  function importBuffer() {
    let defaultN = 0;
    if (bufferArray.length > 1) {
      defaultN = 0;
      if (defaultN == bufferIndex) {
        defaultN++;
      }
    }
    let response = window.prompt('Which script should be imported?', bufferTitles[defaultN]);
    if (!response) {
      return;
    }
    if (!bufferTitles.includes(response)) {
      window.alert('That\'s not a valid script!');
      return;
    }
    if (response == bufferTitles[bufferIndex] && !window.confirm('Are you sure you want to import a script into itself?')) {
      return;
    }
    response = bufferTitles.indexOf(response);
    let frame = apparatus.children[apparatus.children.length - 1].children[0].innerHTML;
    if (apparatus.children.length <= 1) {
      frame = 0;
    }
    frame = Number(frame);
    let prompt = window.prompt('After which frame should this script be imported?', frame);
    if (prompt) {
      frame = Number(prompt);
      if (Number.isInteger(frame)) {
        let array = bufferArray[response].split('\n');
        let totalFrames = Number(array[array.length - 1].split(' ')[0]);
        let copyArray = [];
        let startRow = null;
        for (let row = 1; row < apparatus.children.length; row++) {
          let tempFrame = Number(apparatus.children[row].children[0].innerHTML);
          if (tempFrame > frame) {
            if (startRow == null) {
              startRow = row;
            }
            copy(row);
            copyArray.push([tempFrame + totalFrames, pasteboard]);
          }
        }
        for (i of copyArray) {
          removeRow(startRow);
          paste(i[0], i[1]);
        }
        for (line of array) {
          line = line.split(' ');
          paste(frame + Number(line[0]), `${line[1]} ${line[2]} ${line[3]}`);
        }
      }
      populateTable();
    }
  }
