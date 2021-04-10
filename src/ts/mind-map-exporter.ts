var data: MindMapData = JSON.parse(localStorage.getItem('screenshot'));

function calcJoints(
  e1: HTMLElement,
  e2: HTMLElement
): { width: number; height: number; innerHTML: string } {
  const [x1, y1] = [
    e1.offsetWidth / 2 + e1.offsetLeft,
    e1.offsetHeight / 2 + e1.offsetTop
  ];
  const [x2, y2] = [
    e2.offsetWidth / 2 + e2.offsetLeft,
    e2.offsetHeight / 2 + e2.offsetTop
  ];
  return {
    height: Math.max(y1, y2) + data.settings.lineWidth,
    width: Math.max(x1, x2) + data.settings.lineWidth,
    innerHTML: `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${data.settings.lineColor}" stroke-width="${data.settings.lineWidth}"></line>`
  };
}
function joinNew(id1: string, id2: string, i: number) {
  const [e1, e2] = [document.getElementById(id1), document.getElementById(id2)];
  const { width, height, innerHTML } = calcJoints(e1, e2);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('joining-line');
  svg.innerHTML = innerHTML;
  svg.style.width = `${width}px`;
  svg.style.height = `${height}px`;
  svg.setAttribute('from', id1);
  svg.setAttribute('to', id2);
  svg.setAttribute('i', `${i}`);
  document.querySelector('#container').append(svg);
}

window.addEventListener('load', () => {
  if (!data) return;

  document.body.style.backgroundColor = data.settings.backgroundColor;

  data.bubbles.forEach(bubble => {
    const bubbleE = document.createElement('map-bubble') as Bubble;
    bubbleE.update(data.settings as any);
    Object.assign(bubbleE, {
      ...bubble,
      x: bubble.x + data.settings.exportingMargin,
      y: bubble.y + data.settings.exportingMargin
    });
    document.querySelector('#container').appendChild(bubbleE);
  });

  for (let i = 0; i < data.links.length; i++) joinNew(...data.links[i], i);

  const finishElement = document.createElement('div');
  finishElement.classList.add('finish-element');
  document.body.appendChild(finishElement);
});
