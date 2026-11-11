let boxes = [];
let isDrawing = false;
let isDragging = false;
let draggedBoxIndex = null;
let startX, startY;
let dragOffsetX, dragOffsetY;
let currentBoxDiv = null;

const img = document.getElementById('template-img');
const container = document.getElementById('canvas-container');

img.addEventListener('dragstart', (e) => e.preventDefault());

function getCSSFontFamily(ttfName) {
    if (!ttfName) return 'Arial';
    const lower = ttfName.toLowerCase();
    if (lower.includes('times')) return 'Times New Roman, serif';
    if (lower.includes('cour')) return 'Courier New, monospace';
    if (lower.includes('georgia')) return 'Georgia, serif';
    if (lower.includes('verdana')) return 'Verdana, sans-serif';
    if (lower.includes('tahoma')) return 'Tahoma, sans-serif';
    if (lower.includes('trebuchet')) return 'Trebuchet MS, sans-serif';
    if (lower.includes('impact')) return 'Impact, sans-serif';
    return 'Arial, sans-serif';
}

function toScreenCoords(box) {
    const scaleX = img.width / img.naturalWidth;
    const scaleY = img.height / img.naturalHeight;
    return {
        left: box.x * scaleX,
        top: box.y * scaleY,
        width: box.width * scaleX,
        height: box.height * scaleY
    };
}

function renderBoxes() {
    container.querySelectorAll('.label-box').forEach(el => el.remove());

    boxes.forEach((box, index) => {
        const screen = toScreenCoords(box);
        const boxDiv = document.createElement('div');
        boxDiv.className = 'label-box';
        boxDiv.style.position = 'absolute';
        boxDiv.style.left = `${screen.left}px`;
        boxDiv.style.top = `${screen.top}px`;
        boxDiv.style.width = `${screen.width}px`;
        boxDiv.style.height = `${screen.height}px`;
        boxDiv.style.border = '2px solid #198754';
        boxDiv.style.backgroundColor = 'rgba(25, 135, 84, 0.08)';
        boxDiv.style.cursor = 'move';
        boxDiv.dataset.index = index;

        // Use Flexbox to handle precise horizontal container alignment matching backend math
        boxDiv.style.display = 'flex';
        boxDiv.style.alignItems = 'center';
        
        if (box.alignment === 'center') {
            boxDiv.style.justifyContent = 'center';
        } else if (box.alignment === 'right') {
            boxDiv.style.justifyContent = 'flex-end';
        } else {
            boxDiv.style.justifyContent = 'flex-start';
        }

        const previewText = document.createElement('div');
        previewText.innerText = `[${box.name}]`;
        previewText.style.color = box.text_color;
        
        const uiFontSize = Math.max(10, box.font_size * (img.width / img.naturalWidth));
        previewText.style.fontSize = `${uiFontSize}px`;
        previewText.style.fontFamily = getCSSFontFamily(box.font_family);
        previewText.style.padding = '0 4px';
        previewText.style.boxSizing = 'border-box';
        previewText.style.overflow = 'hidden';
        previewText.style.whiteSpace = 'nowrap';
        previewText.style.textOverflow = 'ellipsis';

        boxDiv.appendChild(previewText);

        boxDiv.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            isDragging = true;
            draggedBoxIndex = index;
            const rect = boxDiv.getBoundingClientRect();
            dragOffsetX = e.clientX - rect.left;
            dragOffsetY = e.clientY - rect.top;
        });

        container.appendChild(boxDiv);
    });

    updateBoxListUI();
}

function updateBoxListUI() {
    const listEl = document.getElementById('box-list');
    if (!listEl) return;
    
    if (boxes.length === 0) {
        listEl.innerHTML = '<li class="list-group-item text-muted">No labels created yet. Draw on the image to add one.</li>';
        return;
    }

    listEl.innerHTML = '';
    boxes.forEach((box, index) => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <div>
                <strong>${box.name}</strong><br>
                <small class="text-muted">Size: ${box.font_size}px | Align: ${box.alignment}</small>
            </div>
            <button class="btn btn-sm btn-danger" onclick="deleteBox(${index})">Delete</button>
        `;
        listEl.appendChild(li);
    });
}

window.deleteBox = function(index) {
    boxes.splice(index, 1);
    renderBoxes();
};

container.addEventListener('mousedown', (e) => {
    if (isDragging) return;
    const rect = img.getBoundingClientRect();
    if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;

    isDrawing = true;
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    currentBoxDiv = document.createElement('div');
    currentBoxDiv.style.position = 'absolute';
    currentBoxDiv.style.border = '2px dashed #0d6efd';
    currentBoxDiv.style.backgroundColor = 'rgba(13, 110, 253, 0.1)';
    currentBoxDiv.style.left = `${startX}px`;
    currentBoxDiv.style.top = `${startY}px`;
    container.appendChild(currentBoxDiv);
});

container.addEventListener('mousemove', (e) => {
    const rect = img.getBoundingClientRect();

    if (isDragging && draggedBoxIndex !== null) {
        const currentX = e.clientX - rect.left - dragOffsetX;
        const currentY = e.clientY - rect.top - dragOffsetY;

        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        boxes[draggedBoxIndex].x = Math.max(0, currentX * scaleX);
        boxes[draggedBoxIndex].y = Math.max(0, currentY * scaleY);
        renderBoxes();
        return;
    }

    if (!isDrawing || !currentBoxDiv) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);

    currentBoxDiv.style.width = `${width}px`;
    currentBoxDiv.style.height = `${height}px`;
    currentBoxDiv.style.left = `${left}px`;
    currentBoxDiv.style.top = `${top}px`;
});

container.addEventListener('mouseup', (e) => {
    if (isDragging) {
        isDragging = false;
        draggedBoxIndex = null;
        return;
    }

    if (!isDrawing) return;
    isDrawing = false;

    let labelName = document.getElementById('label-name-input').value.trim();
    if (!labelName) {
        labelName = prompt('Enter the CSV column name for this label (e.g., full_name):');
        if (!labelName) {
            if (currentBoxDiv) currentBoxDiv.remove();
            currentBoxDiv = null;
            return;
        }
    }

    const fontSize = document.getElementById('font-size-input').value;
    const textColor = document.getElementById('text-color-input').value;
    const fontFamily = document.getElementById('font-family-input').value;
    const alignment = document.getElementById('alignment-input').value;

    const rect = img.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const box = {
        name: labelName,
        x: Math.min(startX, endX) * scaleX,
        y: Math.min(startY, endY) * scaleY,
        width: Math.abs(endX - startX) * scaleX,
        height: Math.abs(endY - startY) * scaleY,
        font_size: parseInt(fontSize),
        text_color: textColor,
        font_family: fontFamily,
        alignment: alignment
    };

    boxes.push(box);
    if (currentBoxDiv) currentBoxDiv.remove();
    currentBoxDiv = null;
    document.getElementById('label-name-input').value = '';

    renderBoxes();
});

window.addEventListener('resize', renderBoxes);

document.getElementById('save-config').addEventListener('click', () => {
    if (boxes.length === 0) {
        alert('Please draw at least one label box on the template before saving.');
        return;
    }

    const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

    fetch(window.location.href, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken
        },
        body: JSON.stringify({ labels: boxes })
    })
    .then(async response => {
        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch {
            throw new Error(text);
        }
    })
    .then(data => {
        if (data.status === 'success') {
            window.location.href = data.redirect_url;
        } else {
            alert('Error from server: ' + (data.message || 'Unknown error'));
        }
    })
    .catch(error => {
        console.error('Save error:', error);
        alert('Failed to save configuration.');
    });
});