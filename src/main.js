import './style.css'
import interact from 'interactjs'
import {Modal} from 'flowbite';

const canvas = document.getElementById('canvas');
const fileInput = document.getElementById('fileInput');
const flipAllBtn = document.getElementById('flipAll');
const flipOneBtn = document.getElementById('flip');
const delOneBtn = document.getElementById('del');
const grayscaleBtn = document.getElementById('toggleGrayscale');

const resetCanvasBtn = document.getElementById('resetCanvas');

let allFlipped = false;
let allGrayscale = false;
const imageStates = new WeakMap();


// set the modal menu element
const $targetEl = document.getElementById('modalEl');

// options with default values
const options = {
    placement: 'bottom-right',
    backdrop: 'dynamic',
    backdropClasses: 'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
    closable: true,
    onHide: () => {
        console.log('modal is hidden');
    },
    onShow: () => {
        console.log('modal is shown');
    },
    onToggle: () => {
        console.log('modal has been toggled');
    },
};

// instance options object
const instanceOptions = {
    id: 'modalEl', override: true
};


/*
 * $targetEl: required
 * options: optional
 */
const modal = new Modal($targetEl, options, instanceOptions);


function applyTransform(wrapper, state) {
    const scaleX = state.flipped ? -state.scale : state.scale;
    wrapper.style.transform = `translate(${state.x}px, ${state.y}px) scale(${scaleX}, ${state.scale})`;
    const img = wrapper.querySelector('img');
    img.style.filter = state.grayscale ? 'grayscale(100%)' : 'none';
}

// modal.show();

function showMenu(wrapper, state) {
    menuElState.cur_wrapper = wrapper;
    menuElState.cur_state = state
    modal.show();
}

const menuElState = {
    cur_wrapper: null, cur_state: null
}


fileInput.addEventListener('change', (e) => {
    for (const file of e.target.files) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('image-wrapper');
            const img = document.createElement('img');
            img.src = evt.target.result;
            img.addEventListener('touchstart', e => e.preventDefault(), {passive: false}); // 阻止长按行为
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
                }).on('hold', function (event) {
                const target = event.target;
                const s = imageStates.get(target);
                showMenu(wrapper, s);
            })


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

flipOneBtn.addEventListener('click', () => {
    let wrapper = menuElState.cur_wrapper;
    let s = menuElState.cur_state
    s.flipped = !s.flipped;
    applyTransform(wrapper, s);
    wrapper = undefined
    modal.hide();
});

delOneBtn.addEventListener('click', () => {
    let wrapper = menuElState.cur_wrapper;
    let s = menuElState.cur_state
    canvas.removeChild(wrapper)
    wrapper = undefined
    modal.hide();
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
        }, move(event) {
            if (scaleCanvas) {
                document.querySelectorAll('.image-wrapper').forEach(wrapper => {
                    const s = imageStates.get(wrapper);
                    s.scale *= (1 + event.ds);
                    s.scale = Math.max(0.5, Math.min(3, s.scale));
                    applyTransform(wrapper, s);
                });
            }
        }, end() {
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

});


document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());

