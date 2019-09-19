import './style.css';

// YOUR CODE BELOW
const urlEl = document.getElementById('url');
let url = '';
const submitEl = document.getElementById('submit');
const errorEl = document.getElementById('error');
const resultEl = document.getElementById('result');
const rawEl = document.getElementById('raw');
const codeEl = document.getElementById('code');

const buildPath = (el, path = []) => {
  const key = el.dataset.key[0] === '[' ? el.dataset.key : '.' + el.dataset.key;
  const newPath = path.concat([key]);

  if (el.parentNode.dataset.key) {
    return buildPath(el.parentNode, newPath);
  } else {
    return newPath.reverse().join('');
  }
};

const selectLeaf = el => {
  const path = buildPath(el);
  const key =
    el.dataset.key[0] === '['
      ? el.parentNode.dataset.key +
        el.dataset.key.slice(1, el.dataset.key.length - 1)
      : el.dataset.key;
  const code = `fetch('${url}')
    .then(function(response) {
        return response.json();
    })
    .then(function(data) {
        var ${key} = data${path}
        // console.log(${key});
    })`;

  codeEl.innerHTML = code;
  hljs.highlightBlock(codeEl);
};

const getDataType = data => {
  if (data === null) return 'null';
  else if (Array.isArray(data)) return 'array';
  else return typeof data;
};

const renderResult = (data, key) => {
  const dataType = getDataType(data);

  const container = document.createElement('div');
  container.className = 'result-list__list';
  if (key) {
    container.innerHTML = `<div class="result-list__title">${key} <small>(${dataType})</small></div>`;
    container.dataset.key = key;
  }

  if (dataType === 'array') {
    return data.reduce((container, d, i) => {
      const child = renderResult(d, `[${i}]`);
      container.appendChild(child);

      return container;
    }, container);
  } else if (dataType === 'object') {
    return Object.keys(data).reduce((container, key) => {
      const child = renderResult(data[key], key);
      container.appendChild(child);

      return container;
    }, container);
  } else {
    const el = document.createElement('div');
    el.className = 'result-list__leaf';
    el.dataset.key = key;

    el.innerHTML = `
        <div class="result-list__title">${key} <small>(${typeof data})</small></div>
        ${data}
        `;
    el.onclick = () => selectLeaf(el);
    return el;
  }
};

submitEl.onclick = () => {
  url = urlEl.value;

  resultEl.innerHTML = '';
  rawEl.innerHTML = '';
  codeEl.innerHTML = '';
  errorEl.innerHTML = '';
  errorEl.classList.remove('visible');

  fetch(url)
    .then(response => {
      if (!response.ok) {
        return response.text().then(text => {
          const error = new Error(response.statusText);
          error.status = response.status;
          error.body = text;
          throw error;
        });
      } else {
        return response.json();
      }
    })
    .then(data => {
      resultEl.appendChild(renderResult(data));
      rawEl.innerHTML = JSON.stringify(data, null, '  ');
      hljs.highlightBlock(rawEl);
    })
    .catch(err => {
      if (err.status) {
        errorEl.innerHTML = `${err.status} - ${err.statusText}`;
        rawEl.innerText = err.body;
      } else {
        errorEl.innerHTML = err.message;
      }

      errorEl.classList.add('visible');
    });
};
