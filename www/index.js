import init, { run_command, set_shader } from '../pkg/rendered_resume.js';

// Global state
let terminal = null;
let pyodide = null;
let game = null;
let currentShader = 0;
const shaders = ['default', 'fire', 'ice'];

// Load and display resume on page load
async function loadResumeContent() {
    try {
        const response = await fetch('./resume.json');
        const resume = await response.json();
        const content = document.getElementById('resume-content');
        
        content.innerHTML = `
            <div class="resume-header">
                <h1 class="resume-name">${resume.contact.name}</h1>
                <div class="resume-title">Full-Stack Software Engineer</div>
                <div class="contact-info">
                    <a href="mailto:${resume.contact.email}" class="contact-item">${resume.contact.email}</a>
                    <a href="https://${resume.contact.linkedin}" class="contact-item" target="_blank">${resume.contact.linkedin}</a>
                    <a href="https://${resume.contact.github}" class="contact-item" target="_blank">${resume.contact.github}</a>
                    <span class="contact-item">${resume.contact.location}</span>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>💡</span> Summary
                </div>
                <p style="font-size: 1.1em; color: var(--text-muted); line-height: 1.7;">${resume.summary}</p>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>💼</span> Experience
                </div>
                ${resume.experience.map(exp => `
                    <div class="experience-item">
                        <div class="item-title">${exp.title}</div>
                        <div class="item-company">${exp.company} • ${exp.dates}</div>
                        <div class="item-description">${exp.description}</div>
                        <div class="tech-tags">
                            ${exp.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>🚀</span> Projects
                </div>
                ${resume.projects.map(proj => `
                    <div class="project-item">
                        <div class="item-title">${proj.name}</div>
                        <div class="item-description">${proj.description}</div>
                        <div class="tech-tags">
                            ${proj.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                        ${proj.github || proj.demo ? `
                            <div style="margin-top: 1rem;">
                                ${proj.github ? `<a href="https://${proj.github}" target="_blank" class="contact-item">GitHub →</a>` : ''}
                                ${proj.github && proj.demo ? ' • ' : ''}
                                ${proj.demo ? `<a href="https://${proj.demo}" target="_blank" class="contact-item">Demo →</a>` : ''}
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>🛠️</span> Skills
                </div>
                <div class="skills-grid">
                    <div class="skill-category">
                        <h4>Languages</h4>
                        <div class="tech-tags">
                            ${resume.skills.languages.map(skill => `<span class="tech-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Web Technologies</h4>
                        <div class="tech-tags">
                            ${resume.skills.web.map(skill => `<span class="tech-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Tools & Platforms</h4>
                        <div class="tech-tags">
                            ${resume.skills.tools.map(skill => `<span class="tech-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                    <div class="skill-category">
                        <h4>Concepts</h4>
                        <div class="tech-tags">
                            ${resume.skills.concepts.map(skill => `<span class="tech-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <div class="section-title">
                    <span>🎓</span> Education
                </div>
                ${resume.education.map(edu => `
                    <div style="background: rgba(26, 26, 26, 0.6); padding: 1.5rem; border-radius: 12px; border-left: 4px solid var(--primary-color);">
                        <div class="item-title">${edu.degree}</div>
                        <div class="item-company">${edu.university} • ${edu.dates} • GPA: ${edu.gpa}</div>
                        <div style="margin-top: 0.5rem;">
                            <strong style="color: var(--primary-color);">Relevant Coursework:</strong>
                            <div class="tech-tags" style="margin-top: 0.5rem;">
                                ${edu.coursework.map(course => `<span class="tech-tag">${course}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (error) {
        console.error('Error loading resume:', error);
        document.getElementById('resume-content').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--accent-red);">
                <h2>Error Loading Resume</h2>
                <p>Please try refreshing the page.</p>
            </div>
        `;
    }
}


// Built-in terminal commands (no WASM dependency)
function executeBuiltinCommand(command) {
    const parts = command.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    
    switch (cmd) {
        case 'help':
            return `
Available commands:
  help              - Show this help message
  about             - About this resume site
  contact           - Show contact information
  skills            - List technical skills
  python <code>     - Execute Python code (requires runtime)
  python-games      - Launch Python game collection
  clear             - Clear terminal
  echo <text>       - Echo text back
  date              - Show current date/time
  whoami            - Show current user info
  ls                - List available "files"
  cat <file>        - Show file contents
  
Interactive features:
  - Background shaders will work when WebGPU loads
  - Use floating buttons for Snake game and effects
            `;
            
        case 'about':
            return `
🚀 Interactive Resume Terminal
This is Connor Fallon's portfolio website built with:
- WebGPU shaders for animated backgrounds
- Interactive terminal with Python runtime (Pyodide)
- Snake game and Python games
- Responsive design for all devices

Type 'contact' for contact information.
            `;
            
        case 'contact':
            return `
📧 Contact Information:
- Email: connor@example.com
- LinkedIn: linkedin.com/in/connorfallon
- GitHub: github.com/falconnor4
- Location: San Francisco, CA
            `;
            
        case 'skills':
            return `
🛠️ Technical Skills:

Languages: Rust, Python, JavaScript, TypeScript, C++, Go
Web: React, HTML/CSS, WebAssembly, WebGPU, Node.js  
Tools: Git, Docker, Linux, AWS, PostgreSQL, MongoDB
Concepts: System Design, Algorithms, Graphics Programming, Performance Optimization
            `;
            
        case 'clear':
            terminal.clear();
            return null;
            
        case 'echo':
            return parts.slice(1).join(' ') || 'echo: missing argument';
            
        case 'date':
            return new Date().toString();
            
        case 'whoami':
            return 'visitor@connorfallon.dev';
            
        case 'ls':
            return `
resume.json    contact.txt    skills.md    projects/
about.txt      portfolio/     games/       shaders/
            `;
            
        case 'cat':
            const file = parts[1];
            if (!file) return 'cat: missing filename';
            
            switch (file) {
                case 'resume.json':
                    return 'Use the resume display above or type "contact" for contact info';
                case 'contact.txt':
                    return executeBuiltinCommand('contact');
                case 'about.txt':
                    return executeBuiltinCommand('about');
                default:
                    return `cat: ${file}: No such file or directory`;
            }
            
        default:
            // Try WASM command if available
            return null;
    }
}

async function handleCommand(command) {
    console.log('handleCommand called with:', command);
    
    // First try built-in commands
    const builtinResult = executeBuiltinCommand(command);
    if (builtinResult !== null) {
        if (builtinResult) {
            terminal.writeln(builtinResult);
        }
        return;
    }
    
    // Handle Python commands
    if (command.startsWith("python")) {
        const code = command.substring(6).trim();
        if (code) {
            try {
                if (!pyodide) {
                    terminal.writeln("Python runtime not loaded yet. Please wait...");
                    return;
                }
                pyodide.globals.set('code_to_run', code);
                let output = await pyodide.runPythonAsync(`
import sys
import io
old_stdout = sys.stdout
sys.stdout = io.StringIO()
try:
    exec(code_to_run)
    result = sys.stdout.getvalue()
finally:
    sys.stdout = old_stdout
result
                `);
                if (output) {
                    terminal.writeln(output.replace(/\\n/g, '\\r\\n'));
                }
            } catch (e) {
                terminal.writeln(`Python Error: ${e.message}`);
            }
        } else {
            terminal.writeln("Usage: python <code>");
        }
        return;
    }
    
    // Handle Python games
    if (command === "python-games") {
        if (!pyodide) {
            terminal.writeln("Python runtime not loaded yet. Please wait...");
            return;
        }
        
        terminal.writeln("Loading Python game collection...");
        try {
            const response = await fetch('./pygame.py');
            const gameCode = await response.text();
            pyodide.runPython(gameCode);
        } catch (error) {
            terminal.writeln("Error loading Python games: " + error.message);
        }
        return;
    }
    
    // Try WASM commands last (may fail)
    try {
        if (typeof run_command !== 'undefined') {
            const output = await run_command(command);
            console.log('WASM command output:', output);
            
            if (output.startsWith("__SET_SHADER__:")) {
                const shaderName = output.split(":")[1];
                if (typeof set_shader !== 'undefined') {
                    set_shader(shaderName);
                    terminal.writeln(`Shader set to: ${shaderName}`);
                } else {
                    terminal.writeln("Shader functionality not available (WebGPU not loaded)");
                }
            } else if (output === "__CLEAR__") {
                terminal.clear();
            } else if (output) {
                const cleanOutput = output.replace(/\\r\\n/g, '\\n').replace(/\\n/g, '\\r\\n');
                terminal.writeln(cleanOutput);
            } else {
                terminal.writeln(`${command}: command not found`);
            }
        } else {
            terminal.writeln(`${command}: command not found`);
        }
    } catch (error) {
        console.error('WASM command error:', error);
        terminal.writeln(`${command}: command not found`);
    }
}

// Global variable to track terminal command state
let currentCommand = "";

// Initialize terminal immediately on page load
function initTopTerminal() {
    if (terminal) return; // Already initialized
    
    terminal = new Terminal({
        cursorBlink: true,
        convertEol: true,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 14,
        rows: 8, // Smaller for top terminal
        cols: 120,
        theme: {
            background: 'transparent',
            foreground: '#00e5e5',
            cursor: '#00e5e5',
            selection: 'rgba(0, 229, 229, 0.3)',
        }
    });
    
    terminal.open(document.getElementById('terminal-content'));
    
    terminal.writeln('Welcome to the Interactive Terminal!');
    terminal.writeln('Loading Python runtime... (this may take a moment)');
    
    // Load Pyodide immediately
    loadPyodide().then(py => {
        pyodide = py;
        terminal.writeln('Python runtime loaded.');
        terminal.writeln('Type "help" to see available commands.');
        terminal.write('$ ');
    }).catch(error => {
        terminal.writeln('Failed to load Python runtime: ' + error.message);
        terminal.write('$ ');
    });
    
    // Handle terminal input
    terminal.onKey(async ({ key, domEvent }) => {
        const code = domEvent.keyCode;
        
        // Prevent default browser behavior for arrow keys, etc.
        if ([37, 38, 39, 40].includes(code)) {
            domEvent.preventDefault();
        }
        
        if (code === 13) { // Enter key
            terminal.write('\\r\\n');
            
            const cmd = currentCommand.trim();
            currentCommand = ""; // Reset immediately
            
            if (cmd.length > 0) {
                console.log('Executing command:', cmd); // Debug log
                try {
                    await handleCommand(cmd);
                } catch (error) {
                    console.error('Command execution error:', error);
                    terminal.writeln('Error: ' + error.message);
                }
            }
            terminal.write('$ ');
            
        } else if (code === 8) { // Backspace
            if (currentCommand.length > 0) {
                currentCommand = currentCommand.slice(0, -1);
                terminal.write('\\b \\b');
            }
            
        } else if (code === 9) { // Tab - prevent default
            domEvent.preventDefault();
            
        } else if (key.length === 1 && !domEvent.ctrlKey && !domEvent.altKey && !domEvent.metaKey) {
            // Printable character
            currentCommand += key;
            terminal.write(key);
        }
    });
    
    // Focus the terminal
    setTimeout(() => {
        if (terminal) {
            terminal.focus();
        }
    }, 100);
}

// Terminal control functions
window.minimizeTerminal = function() {
    const terminalEl = document.getElementById('top-terminal');
    const resumeEl = document.getElementById('resume-content');
    const minimizeBtn = document.getElementById('minimize-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const maximizeBtn = document.getElementById('maximize-btn');
    
    console.log('Minimizing terminal...'); // Debug log
    
    terminalEl.classList.add('collapsed');
    terminalEl.classList.remove('maximized');
    
    // When minimized, resume should be MORE visible (move up to fill space)
    resumeEl.classList.remove('terminal-maximized');
    resumeEl.classList.add('terminal-minimized');
    
    // Show restore button, hide minimize, show maximize
    minimizeBtn.style.display = 'none';
    restoreBtn.style.display = 'flex';
    maximizeBtn.style.display = 'flex';
    
    console.log('Terminal minimized, resume moved up, buttons updated'); // Debug log
};

window.restoreTerminal = function() {
    const terminalEl = document.getElementById('top-terminal');
    const resumeEl = document.getElementById('resume-content');
    const minimizeBtn = document.getElementById('minimize-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const maximizeBtn = document.getElementById('maximize-btn');
    
    console.log('Restoring terminal...'); // Debug log
    
    terminalEl.classList.remove('collapsed');
    terminalEl.classList.remove('maximized');
    
    // Resume should be in normal state (not minimized or maximized)
    resumeEl.classList.remove('terminal-minimized');
    resumeEl.classList.remove('terminal-maximized');
    
    minimizeBtn.style.display = 'flex';
    restoreBtn.style.display = 'none';
    maximizeBtn.style.display = 'flex';
    
    // Resize terminal back to normal size
    if (terminal) {
        setTimeout(() => {
            // Reset to original size
            const cols = 120;
            const rows = 8;
            
            console.log(`Restoring terminal to: ${cols}x${rows}`);
            terminal.resize(cols, rows);
            terminal.focus();
        }, 350); // Wait for CSS transition
    }
};

window.maximizeTerminal = function() {
    const terminalEl = document.getElementById('top-terminal');
    const resumeEl = document.getElementById('resume-content');
    const minimizeBtn = document.getElementById('minimize-btn');
    const restoreBtn = document.getElementById('restore-btn');
    const maximizeBtn = document.getElementById('maximize-btn');
    
    console.log('Maximizing terminal...'); // Debug log
    
    terminalEl.classList.remove('collapsed');
    terminalEl.classList.add('maximized');
    
    // When maximized, resume should be completely hidden
    resumeEl.classList.remove('terminal-minimized');
    resumeEl.classList.add('terminal-maximized');
    
    minimizeBtn.style.display = 'flex';
    restoreBtn.style.display = 'flex';
    maximizeBtn.style.display = 'none';
    
    // Calculate optimal terminal size for full screen
    if (terminal) {
        // Wait for CSS transition to complete
        setTimeout(() => {
            // Calculate terminal dimensions based on viewport
            const terminalContent = document.getElementById('terminal-content');
            const rect = terminalContent.getBoundingClientRect();
            
            // Rough calculation: character width ~9px, line height ~20px for 14px font
            const charWidth = 9;
            const lineHeight = 20;
            
            const cols = Math.floor((rect.width - 32) / charWidth); // Account for padding
            const rows = Math.floor((rect.height - 16) / lineHeight); // Account for padding
            
            console.log(`Resizing terminal to: ${cols}x${rows}`);
            
            // Ensure minimum size
            const finalCols = Math.max(80, Math.min(cols, 200));
            const finalRows = Math.max(20, Math.min(rows, 50));
            
            terminal.resize(finalCols, finalRows);
            terminal.focus();
        }, 350); // Wait for CSS transition
    }
};

window.playSnake = function() {
    startSnakeGame();
};

window.playPythonGames = function() {
    if (!terminal) {
        initTerminal();
    }
    
    // Show terminal and run python games
    document.getElementById('terminal').style.display = 'block';
    
    if (!pyodide) {
        terminal.writeln('Loading Python runtime and games...');
        loadPyodide().then(py => {
            pyodide = py;
            loadAndRunPythonGames();
        });
    } else {
        loadAndRunPythonGames();
    }
};

async function loadAndRunPythonGames() {
    try {
        const response = await fetch('./pygame.py');
        const gameCode = await response.text();
        pyodide.runPython(gameCode);
        terminal.focus();
    } catch (error) {
        terminal.writeln("Error loading Python games: " + error.message);
    }
}

window.changeShader = function() {
    currentShader = (currentShader + 1) % shaders.length;
    set_shader(shaders[currentShader]);
    
    // Show a brief notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 90px;
        right: 2rem;
        background: rgba(0, 229, 229, 0.9);
        color: #000;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        z-index: 100;
        font-family: 'Share Tech Mono', monospace;
        animation: fadeIn 0.3s ease;
    `;
    notification.textContent = `Shader: ${shaders[currentShader]}`;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
};

window.closeGame = function() {
    if (game) game.running = false;
    document.getElementById('game-display').style.display = 'none';
};

// Snake game implementation
function startSnakeGame() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('game-score');
    
    game = {
        canvas, ctx, scoreElement,
        gridSize: 20,
        snake: [{ x: 200, y: 200 }],
        direction: { x: 0, y: 0 },
        food: { x: 0, y: 0 },
        score: 0,
        running: true
    };
    
    // Reset score
    scoreElement.textContent = '0';
    
    // Place first food
    placeFood(game);
    
    // Game loop
    function gameLoop() {
        if (!game.running) return;
        
        // Move snake
        const head = { ...game.snake[0] };
        head.x += game.direction.x * game.gridSize;
        head.y += game.direction.y * game.gridSize;
        
        // Check wall collision
        if (head.x < 0 || head.x >= canvas.width || head.y < 0 || head.y >= canvas.height) {
            gameOver(game);
            return;
        }
        
        // Check self collision
        if (game.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
            gameOver(game);
            return;
        }
        
        game.snake.unshift(head);
        
        // Check food collision
        if (head.x === game.food.x && head.y === game.food.y) {
            game.score += 10;
            scoreElement.textContent = game.score;
            placeFood(game);
        } else {
            game.snake.pop();
        }
        
        // Draw
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw snake
        ctx.fillStyle = '#00e5e5';
        game.snake.forEach(segment => {
            ctx.fillRect(segment.x, segment.y, game.gridSize - 2, game.gridSize - 2);
        });
        
        // Draw food
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(game.food.x, game.food.y, game.gridSize - 2, game.gridSize - 2);
        
        setTimeout(gameLoop, 150);
    }
    
    gameLoop();
    document.getElementById('game-display').style.display = 'flex';
}

function placeFood(game) {
    const maxX = (game.canvas.width / game.gridSize) - 1;
    const maxY = (game.canvas.height / game.gridSize) - 1;
    
    do {
        game.food.x = Math.floor(Math.random() * maxX) * game.gridSize;
        game.food.y = Math.floor(Math.random() * maxY) * game.gridSize;
    } while (game.snake.some(segment => segment.x === game.food.x && segment.y === game.food.y));
}

function gameOver(game) {
    game.running = false;
    game.ctx.fillStyle = '#00e5e5';
    game.ctx.font = '24px Share Tech Mono';
    game.ctx.textAlign = 'center';
    game.ctx.fillText('Game Over!', game.canvas.width / 2, game.canvas.height / 2);
    game.ctx.fillText(`Score: ${game.score}`, game.canvas.width / 2, game.canvas.height / 2 + 30);
}

// Global key handlers
document.addEventListener('keydown', (e) => {
    // ESC to close overlays
    if (e.key === 'Escape') {
        if (game) game.running = false;
        document.getElementById('game-display').style.display = 'none';
        return;
    }
    
    // Game controls
    if (game && game.running && document.getElementById('game-display').style.display === 'flex') {
        switch(e.key.toLowerCase()) {
            case 'w': case 'arrowup':
                if (game.direction.y === 0) game.direction = { x: 0, y: -1 };
                break;
            case 's': case 'arrowdown':
                if (game.direction.y === 0) game.direction = { x: 0, y: 1 };
                break;
            case 'a': case 'arrowleft':
                if (game.direction.x === 0) game.direction = { x: -1, y: 0 };
                break;
            case 'd': case 'arrowright':
                if (game.direction.x === 0) game.direction = { x: 1, y: 0 };
                break;
        }
        e.preventDefault();
    }
});

// Initialize application
async function main() {
    // Always load resume content and initialize terminal first
    try {
        await loadResumeContent();
        console.log('Resume content loaded');
    } catch (error) {
        console.error('Error loading resume:', error);
    }
    
    // Initialize terminal (this should always work)
    try {
        initTopTerminal();
        console.log('Terminal initialized');
    } catch (error) {
        console.error('Error initializing terminal:', error);
    }
    
    // Try to initialize WebGPU (optional - site works without it)
    try {
        console.log('Attempting WebGPU initialization...');
        
        // Check if WebGPU is supported
        if (!navigator.gpu) {
            console.warn('WebGPU not supported - background shaders disabled');
            return;
        }
        
        // Initialize WebGPU renderer
        await init();
        console.log('WebGPU initialized successfully - shaders available');
        
    } catch (error) {
        console.warn('WebGPU initialization failed:', error.message);
        console.warn('Site will work without background shaders');
    }
    
    console.log('Site initialization complete');
}

// Start the application
main();