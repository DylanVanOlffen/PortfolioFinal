// --- 1. CUSTOM CURSOR ---
const cursorDot = document.querySelector('[data-cursor-dot]');
const cursorOutline = document.querySelector('[data-cursor-outline]');

window.addEventListener('mousemove', (e) => {
    const posX = e.clientX;
    const posY = e.clientY;

    cursorDot.style.left = `${posX}px`;
    cursorDot.style.top = `${posY}px`;

    // Add a slight lag to the outline for fluid feel
    cursorOutline.animate({
        left: `${posX}px`,
        top: `${posY}px`
    }, { duration: 500, fill: "forwards" });
});

// Hover effects for cursor
const triggers = document.querySelectorAll('.hover-trigger, a, .project-card, .btn-pill, .footer-link, .footer-link-large, .resume-btn');
triggers.forEach(trigger => {
    trigger.addEventListener('mouseenter', () => document.body.classList.add('hovering'));
    trigger.addEventListener('mouseleave', () => document.body.classList.remove('hovering'));
});


// --- 2. SCROLL & REVEAL ANIMATIONS ---
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up, .fade-in, .footer-cta, .footer-grid').forEach(el => observer.observe(el));

// Title Reveal Animation (Staggered)
window.addEventListener('load', () => {
    const titles = document.querySelectorAll('.title-reveal span');
    titles.forEach((span, idx) => {
        setTimeout(() => {
            span.style.transform = 'translateY(0)';
            span.style.opacity = '1';
        }, (idx + 1) * 200);
    });
});


// --- 3. SCRAMBLE TEXT EFFECT ---
class TextScramble {
    constructor(el) {
        this.el = el;
        this.chars = '!<>-_\\/[]{}—=+*^?#________'; // The "matrix" characters
        this.update = this.update.bind(this);
    }

    setText(newText) {
        const oldText = this.el.innerText;
        const length = Math.max(oldText.length, newText.length);
        const promise = new Promise((resolve) => this.resolve = resolve);
        
        this.queue = [];
        for (let i = 0; i < length; i++) {
            const from = oldText[i] || '';
            const to = newText[i] || '';
            const start = Math.floor(Math.random() * 40);
            const end = start + Math.floor(Math.random() * 40);
            this.queue.push({ from, to, start, end });
        }

        cancelAnimationFrame(this.frameRequest);
        this.frame = 0;
        this.update();
        return promise;
    }

    update() {
        let output = '';
        let complete = 0;
        
        for (let i = 0, n = this.queue.length; i < n; i++) {
            let { from, to, start, end, char } = this.queue[i];
            
            if (this.frame >= end) {
                complete++;
                output += to;
            } else if (this.frame >= start) {
                if (!char || Math.random() < 0.28) {
                    char = this.randomChar();
                    this.queue[i].char = char;
                }
                output += `<span class="dud">${char}</span>`;
            } else {
                output += from;
            }
        }
        
        this.el.innerHTML = output;
        
        if (complete === this.queue.length) {
            this.resolve();
        } else {
            this.frameRequest = requestAnimationFrame(this.update);
            this.frame++;
        }
    }

    randomChar() {
        return this.chars[Math.floor(Math.random() * this.chars.length)];
    }
}

// Scramble Configuration
const phrases = [
    'GRAPHIC DESIGNER',
    'INTERACTION DESIGNER',
    'UI/UX DESIGNER',
    'WEB DESIGNER'
];

const el = document.querySelector('.scramble-text');
// Check if element exists to avoid errors on pages without it
if (el) {
    const fx = new TextScramble(el);
    let counter = 0;
    const next = () => {
        fx.setText(phrases[counter]).then(() => {
            setTimeout(next, 3000); 
        });
        counter = (counter + 1) % phrases.length;
    };
    next();
}


// --- 4. PROJECT MODAL SYSTEM (UPDATED) ---

const modal = document.getElementById('project-modal');
const modalTitle = document.querySelector('.modal-title');
const modalDesc = document.querySelector('.modal-description');
const modalTech = document.querySelector('.modal-tech-stack');
const modalExternalBtn = document.querySelector('.modal-external-btn');
const closeBtn = document.querySelector('.modal-close-btn');

// Unified Function to Open Modal (Handles Web, PDF, and Gallery)
function openModal(card) {
    // 1. Get data from the clicked card
    const title = card.getAttribute('data-title');
    const desc = card.getAttribute('data-desc');
    const techRaw = card.getAttribute('data-tech');
    const type = card.getAttribute('data-type'); // Check for 'gallery'
    const url = card.getAttribute('data-url');   // For standard projects
    const imagesRaw = card.getAttribute('data-images'); // For gallery projects

    // 2. Populate Text Info
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    
    // Tech Stack Pill generation
    modalTech.innerHTML = '';
    if (techRaw) {
        techRaw.split(',').forEach(t => {
            const span = document.createElement('span');
            span.classList.add('tech-pill');
            span.textContent = t.trim();
            modalTech.appendChild(span);
        });
    }

    // 3. Handle Content (Iframe vs Gallery)
    const previewContainer = document.querySelector('.modal-preview');
    
    // Clear previous content
    previewContainer.innerHTML = ''; 

    if (type === 'gallery' && imagesRaw) {
        // --- CASE A: GALLERY PROJECT ---
        modalExternalBtn.style.display = 'none'; // Hide "Open Fullscreen" button for gallery

        // Create scrollable container
        const galleryDiv = document.createElement('div');
        galleryDiv.classList.add('gallery-container');

        // Build images
        const images = imagesRaw.split(',');
        images.forEach(imgSrc => {
            const img = document.createElement('img');
            img.src = imgSrc.trim();
            img.classList.add('gallery-img');
            galleryDiv.appendChild(img);
        });
        
        previewContainer.appendChild(galleryDiv);

    } else {
        // --- CASE B: STANDARD IFRAME PROJECT (Web or PDF) ---
        modalExternalBtn.style.display = 'inline-block';
        modalExternalBtn.href = url;

        // Create iframe dynamically
        const iframe = document.createElement('iframe');
        iframe.id = 'project-iframe';
        iframe.frameBorder = '0';
        iframe.allowFullscreen = true;
        
        // Add loader text
        const loader = document.createElement('div');
        loader.className = 'iframe-loader';
        loader.textContent = 'Loading Project...';
        
        previewContainer.appendChild(loader);
        previewContainer.appendChild(iframe);
        
        // Load URL
        iframe.src = url;
        iframe.onload = () => {
            iframe.classList.add('loaded'); // Trigger fade-in CSS
        };
    }

    // 4. Show Modal & Disable Scroll
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Function to Close Modal
function closeModal() {
    modal.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
    
    // Clear content after delay to stop audio/video
    setTimeout(() => {
        const previewContainer = document.querySelector('.modal-preview');
        if(previewContainer) previewContainer.innerHTML = ''; 
    }, 500);
}

// Event Listeners for Project Cards
document.querySelectorAll('.project-card[data-modal="true"]').forEach(card => {
    card.addEventListener('click', (e) => {
        e.preventDefault(); // Stop default link behavior
        openModal(card);
    });
});

// Close Button Listener
if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
}

// Close if clicking outside the container (on the backdrop)
if (modal) {
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.classList.contains('modal-backdrop')) {
            closeModal();
        }
    });
}

// --- 5. LIVE TIME CLOCK (Netherlands) ---
function updateTime() {
    const timeDisplay = document.getElementById('time-display');
    if (timeDisplay) {
        const now = new Date();
        // Force timezone to Amsterdam
        const options = { 
            timeZone: 'Europe/Amsterdam', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: false 
        };
        const timeString = now.toLocaleTimeString('en-GB', options);
        timeDisplay.textContent = timeString;
    }
}

// Update immediately, then every second
updateTime();
setInterval(updateTime, 1000);