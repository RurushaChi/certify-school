let boxes = [];
let isDrawing = false;
let startX, startY;
let currentBoxDiv = null;

const img = document.getElementById('template-img');
const container = document.getElementById('canvas-container');

// Prevent browser's native image dragging behavior
img.addEventListener('dragstart', (e) => e.preventDefault());

container.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = img.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    currentBoxDiv = document.createElement('div');
    currentBoxDiv.style.position = 'absolute';
    currentBoxDiv.style.border = '2px dashed #0d6efd';
    currentBoxDiv.style.backgroundColor = 'rgba(13, 110, 253, 0.2)';
    currentBoxDiv.style.left = `${startX}px`;
    currentBoxDiv.style.top = `${startY}px`;
    container.appendChild(currentBoxDiv);
});

container.addEventListener('mousemove', (e) => {
    if (!isDrawing || !currentBoxDiv) return;

    const rect = img.getBoundingClientRect();
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
    if (!isDrawing) return;
    isDrawing = false;

    let labelName = document.getElementById('label-name-input').value.trim();
    if (!labelName) {
        labelName = prompt('Enter the CSV column name for this box (e.g., first_name):');
        if (!labelName) {
            if (currentBoxDiv) currentBoxDiv.remove();
            currentBoxDiv = null;
            return;
        }
    }

    const rect = img.getBoundingClientRect();
    const endX = e.clientX - rect.left;
    const endY = e.clientY - rect.top;

    // Scale factors to map display size to natural image size
    const scaleX = img.naturalWidth / img.width;
    const scaleY = img.naturalHeight / img.height;

    const box = {
        name: labelName,
        x: Math.min(startX, endX) * scaleX,
        y: Math.min(startY, endY) * scaleY,
        width: Math.abs(endX - startX) * scaleX,
        height: Math.abs(endY - startY) * scaleY,
        font_size: 32
    };

    boxes.push(box);

    if (currentBoxDiv) {
        currentBoxDiv.style.border = '2px solid #198754';
        currentBoxDiv.style.backgroundColor = 'rgba(25, 135, 84, 0.2)';
        
        const tag = document.createElement('span');
        tag.innerText = labelName;
        tag.style.position = 'absolute';
        tag.style.background = '#198754';
        tag.style.color = 'white';
        tag.style.fontSize = '12px';
        tag.style.padding = '2px 6px';
        tag.style.borderRadius = '3px';
        currentBoxDiv.appendChild(tag);
    }
    
    currentBoxDiv = null;
    document.getElementById('label-name-input').value = '';
});

document.getElementById('save-config').addEventListener('click', () => {
    if (boxes.length === 0) {
        alert('Please draw at least one label box on the image before saving.');
        return;
    }

    // Grab CSRF token safely
    const csrfTokenElement = document.querySelector('[name=csrfmiddlewaretoken]');
    const csrfToken = csrfTokenElement ? csrfTokenElement.value : getCookie('csrftoken');

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
        alert('Failed to save configuration. Check console for details.');
    });
});

// Helper to grab cookie CSRF token if input field is missing
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}