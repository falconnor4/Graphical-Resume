import init from './pkg/rendered_resume.js';

// Provide a dummy function that the WASM module expects to exist.
window.setup_shader_switcher = (names) => {
    console.log('Available shaders for gallery:', names);
};

async function loadGalleryContent() {
    try {
        const response = await fetch('./gallery.json?t=' + Date.now());
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const galleryItems = await response.json();
        const grid = document.querySelector('.gallery-grid');
        if (!grid) {
            throw new Error('Gallery grid not found in the DOM.');
        }

        let galleryHTML = '';
        for (const item of galleryItems) {
            galleryHTML += `
                <div class="gallery-item">
                    ${
                        item.type === 'image' ?
                        `<img src="${item.src}" alt="${item.title}">` :
                        `<video controls width="100%"><source src="${item.src}" type="video/mp4">Your browser does not support the video tag.</video>`
                    }
                    <div class="gallery-item-info">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                    </div>
                </div>
            `;
        }
        grid.innerHTML = galleryHTML;

    } catch (error) {
        console.error('Error loading gallery content:', error);
        const grid = document.querySelector('.gallery-grid');
        if (grid) {
            grid.innerHTML = `<p style="color: var(--accent-red);">Error loading gallery: ${error.message}</p>`;
        }
    }
}

async function main() {
    // Initialize the background shader
    try {
        await init();
        console.log('WASM renderer initialized successfully for gallery.');
    } catch (error) {
        console.warn('WASM renderer initialization failed for gallery:', error.message);
    }

    // Load the gallery content
    await loadGalleryContent();
}

main();
