import './style.css'
import interact from 'interactjs'

const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('fileInput');
const flipAllBtn = document.getElementById('flipAll');
const grayscaleBtn = document.getElementById('toggleGrayscale');
const resetCanvasBtn = document.getElementById('resetCanvas');

let allFlipped = true;
let allGrayscale = false;
const imageStates = new WeakMap();

function applyTransform(wrapper, state) {
    const scaleX = state.flipped ? -state.scale : state.scale;
    wrapper.style.transform = `translate(${state.x}px, ${state.y}px) scale(${scaleX}, ${state.scale})`;
    const img = wrapper.querySelector('img');
    img.style.filter = state.grayscale ? 'grayscale(100%)' : 'none';
}


fileInput.addEventListener('change', (e) => {
    for (const file of e.target.files) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('image-wrapper');
            const img = document.createElement('img');
            img.src = evt.target.result;
            wrapper.appendChild(img);
            canvas.appendChild(wrapper);

            const state = {
                x: 100,
                y: 100,
                scale: 1,
                flipped: allFlipped,
                grayscale: allGrayscale
            };
            imageStates.set(wrapper, state);
            applyTransform(wrapper, state);

            interact(wrapper)
                .draggable({
                    listeners: {
                        move(event) {
                            const target = event.target;
                            const s = imageStates.get(target);
                            s.x += event.dx;
                            s.y += event.dy;
                            applyTransform(target, s);
                        }
                    }
                })
                .gesturable({
                    listeners: {
                        move(event) {
                            const target = event.target;
                            const s = imageStates.get(target);

                            s.scale *= (1 + event.ds);
                            applyTransform(target, s);
                        }
                    }
                });


        };
        reader.readAsDataURL(file);
    }
});

flipAllBtn.addEventListener('click', () => {
    allFlipped = !allFlipped;
    document.querySelectorAll('.image-wrapper').forEach(wrapper => {
        const s = imageStates.get(wrapper);
        s.flipped = allFlipped;
        applyTransform(wrapper, s);
    });
});

grayscaleBtn.addEventListener('click', () => {
    allGrayscale = !allGrayscale;
    document.querySelectorAll('.image-wrapper').forEach(wrapper => {
        const s = imageStates.get(wrapper);
        s.grayscale = allGrayscale;
        applyTransform(wrapper, s);
    });
});

let canvasScale = 1;
let scaleCanvas = false;
let canvasOffset = {x: 0, y: 0};

interact(canvas).gesturable({
    listeners: {
        start(event) {
            if (!event.target.closest('.image-wrapper')) {
                scaleCanvas = true;
            }
        },
        move(event) {
            if (scaleCanvas) {
                canvasScale *= (1 + event.ds);
                canvasScale = Math.max(0.5, Math.min(3, canvasScale));
                canvas.style.transform = `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`;
            }
        },
        end() {
            scaleCanvas = false;
        }
    }
});

interact(canvas).draggable({
    listeners: {
        move(event) {
            if (!event.target.closest('.image-wrapper')) {
                document.querySelectorAll('.image-wrapper').forEach(wrapper => {
                    const s = imageStates.get(wrapper);
                    s.x += event.dx;
                    s.y += event.dy;
                    applyTransform(wrapper, s);
                });
            }
        }
    }
});

resetCanvasBtn.addEventListener('click', () => {
    const wrappers = document.querySelectorAll('.image-wrapper');
    if (wrappers.length === 0) return;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    wrappers.forEach(wrapper => {
        const state = imageStates.get(wrapper);
        const img = wrapper.querySelector('img');
        const width = img.naturalWidth * state.scale;
        const height = img.naturalHeight * state.scale;

        const x = state.x;
        const y = state.y;

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x + width);
        maxY = Math.max(maxY, y + height);
    });

    const canvasRect = canvas.getBoundingClientRect();
    const viewWidth = window.innerWidth;
    const viewHeight = window.innerHeight - document.getElementById('controls').offsetHeight;

    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;

    const scaleX = viewWidth / contentWidth;
    const scaleY = viewHeight / contentHeight;
    canvasScale = Math.min(scaleX, scaleY, 1);

    const offsetX = (viewWidth - contentWidth * canvasScale) / 2 - minX * canvasScale;
    const offsetY = (viewHeight - contentHeight * canvasScale) / 2 - minY * canvasScale;

    canvasOffset = {x: offsetX, y: offsetY};
    canvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${canvasScale})`;
});


document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());