import init, { run_command, set_shader } from './pkg/rendered_resume.js';

// --- Global State ---
let terminal = null;
let fitAddon = null;
let pyodide = null;
let game = null;
let currentShader = 0;
const shaders = ['default', 'fire', 'ice'];

// --- Resume Loading ---
async function loadResumeContent() {
    try {
        const response = await fetch('./resume.json');
        const resume = await response.json();
        const content = document.getElementById('resume-content');
        
        // ... (resume rendering logic remains the same)
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

// --- Terminal Command Handling ---
const prompt = '$ ';
let commandHistory = [];
let historyIndex = -1;
let currentCommand = "";

const commands = {
    'help': {
        description: 'Show this help message',
        execute: () => {
            const commandList = Object.entries(commands)
                .map(([name, { description }]) => `  ${name.padEnd(15)} - ${description}`)
                .join('\r\n');
            return `Available commands:\r\n${commandList}`;
        }
    },
    'about': {
        description: 'About this resume site',
        execute: () => `
🚀 Interactive Resume Terminal
This is a portfolio website built with:
- WebGPU/WebGL shaders for animated backgrounds
- Interactive terminal with Python runtime (Pyodide)
- Snake game and Python games
- Responsive design for all devices`
    },
    'contact': {
        description: 'Show contact information',
        execute: async () => {
            const r = await (await fetch('./resume.json')).json();
            return `
📧 Contact Information:
- Email: ${r.contact.email}
- LinkedIn: ${r.contact.linkedin}
- GitHub: ${r.contact.github}
- Location: ${r.contact.location}`;
        }
    },
    'skills': {
        description: 'List technical skills',
        execute: async () => {
            const r = await (await fetch('./resume.json')).json();
            return `
🛠️ Technical Skills:
- Languages: ${r.skills.languages.join(', ')}
- Web: ${r.skills.web.join(', ')}
- Tools: ${r.skills.tools.join(', ')}
- Concepts: ${r.skills.concepts.join(', ')}`;
        }
    },
    'clear': {
        description: 'Clear terminal',
        execute: () => {
            terminal.clear();
            return null;
        }
    },
    'echo': {
        description: 'Echo text back',
        execute: (args) => args.join(' ') || 'echo: missing argument'
    },
    'date': {
        description: 'Show current date/time',
        execute: () => new Date().toString()
    },
    'whoami': {
        description: 'Show current user info',
        execute: () => 'visitor@rendered-resume.dev'
    },
    'ls': {
        description: 'List available "files"',
        execute: () => `
resume.json    contact.txt    skills.md    projects/
about.txt      portfolio/     games/       shaders/`
    },
    'cat': {
        description: 'Show file contents (e.g., cat about.txt)',
        execute: (args) => {
            const file = args[0];
            if (!file) return 'cat: missing filename';
            switch (file) {
                case 'resume.json': return 'Use the main page to view the resume.';
                case 'contact.txt': return commands.contact.execute();
                case 'about.txt': return commands.about.execute();
                case 'skills.md': return commands.skills.execute();
                default: return `cat: ${file}: No such file or directory`;
            }
        }
    },
    'shader': {
        description: 'Change background shader (e.g., shader fire)',
        execute: (args) => {
            const shaderName = args[0];
            if (shaders.includes(shaderName)) {
                set_shader(shaderName);
                return `Shader set to: ${shaderName}`;
            }
            return `Invalid shader. Available: ${shaders.join(', ')}`;
        }
    },
    'python-games': {
        description: 'Launch Python game collection',
        execute: async () => {
            if (!pyodide) return "Python runtime not loaded yet. Please wait...";
            terminal.writeln("Loading Python game collection...");
            try {
                const response = await fetch('./pygame.py');
                const gameCode = await response.text();
                pyodide.runPython(gameCode);
                return "Python games loaded. See terminal for instructions.";
            } catch (error) {
                return "Error loading Python games: " + error.message;
            }
        }
    },
    'python': {
        description: 'Execute Python code (e.g., python print("hello"))',
        execute: async (args) => {
            const code = args.join(' ');
            if (!code) return "Usage: python <code>";
            if (!pyodide) return "Python runtime not loaded yet. Please wait...";
            try {
                pyodide.globals.set('code_to_run', code);
                let output = await pyodide.runPythonAsync(`
                    import sys, io
                    sys.stdout = io.StringIO()
                    exec(code_to_run)
                    sys.stdout.getvalue()
                `);
                return output.trim();
            } catch (e) {
                return `Python Error: ${e.message}`;
            }
        }
    },
};

async function handleCommand(commandStr) {
    const parts = commandStr.trim().split(' ');
    const cmdName = parts[0].toLowerCase();
    const args = parts.slice(1);

    if (commandHistory[commandHistory.length - 1] !== commandStr) {
        commandHistory.push(commandStr);
    }
    historyIndex = commandHistory.length;

    if (cmdName in commands) {
        try {
            const output = await commands[cmdName].execute(args);
            if (output) {
                terminal.writeln(output.replace(/\n/g, '\r\n'));
            }
        } catch (error) {
            terminal.writeln(`Error: ${error.message}`);
        }
    } else {
        terminal.writeln(`${cmdName}: command not found`);
    }
}

// --- Terminal Initialization ---
function initTopTerminal() {
    if (terminal) return;

    const term = new window.Terminal({
        cursorBlink: true,
        convertEol: true,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 14,
        theme: {
            background: 'transparent',
            foreground: '#00e5e5',
            cursor: '#00e5e5',
            selectionBackground: 'rgba(0, 229, 229, 0.3)',
        }
    });
    
    fitAddon = new window.FitAddon();
    term.loadAddon(fitAddon);
    term.open(document.getElementById('terminal-content'));
    fitAddon.fit();
    
    terminal = term;

    terminal.writeln('Welcome to the Interactive Terminal!');
    terminal.writeln('Loading Python runtime... (this may take a moment)');
    terminal.write(prompt);

    loadPyodide().then(py => {
        pyodide = py;
        terminal.writeln('\r\nPython runtime loaded. Type "help" for commands.');
        terminal.write(prompt + currentCommand);
    }).catch(error => {
        terminal.writeln(`\r\nFailed to load Python runtime: ${error.message}`);
        terminal.write(prompt + currentCommand);
    });

    terminal.onKey(({ key, domEvent }) => {
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

        if (domEvent.keyCode === 13) { // Enter
            terminal.write('\r\n');
            if (currentCommand.length > 0) {
                handleCommand(currentCommand);
                currentCommand = '';
            }
            terminal.write(prompt);
        } else if (domEvent.keyCode === 8) { // Backspace
            if (currentCommand.length > 0) {
                currentCommand = currentCommand.slice(0, -1);
                terminal.write('\b \b');
            }
        } else if (domEvent.keyCode === 38) { // Up arrow
            if (historyIndex > 0) {
                historyIndex--;
                const prevCommand = commandHistory[historyIndex];
                terminal.write('\x1b[2K\r' + prompt + prevCommand);
                currentCommand = prevCommand;
            }
        } else if (domEvent.keyCode === 40) { // Down arrow
            if (historyIndex < commandHistory.length - 1) {
                historyIndex++;
                const nextCommand = commandHistory[historyIndex];
                terminal.write('\x1b[2K\r' + prompt + nextCommand);
                currentCommand = nextCommand;
            } else {
                historyIndex = commandHistory.length;
                terminal.write('\x1b[2K\r' + prompt);
                currentCommand = "";
            }
        } else if (printable) {
            currentCommand += key;
            terminal.write(key);
        }
    });

    setTimeout(() => terminal.focus(), 100);
}

// --- Terminal UI Controls ---
function fitTerminal() {
    if (fitAddon) {
        fitAddon.fit();
    }
}

window.minimizeTerminal = function() {
    const terminalEl = document.getElementById('top-terminal');
    terminalEl.classList.add('collapsed');
    terminalEl.classList.remove('maximized');
    document.getElementById('resume-content').classList.add('terminal-minimized');
    document.getElementById('resume-content').classList.remove('terminal-maximized');
    
    // Button visibility logic
    document.getElementById('minimize-btn').style.display = 'none';
    document.getElementById('restore-btn').style.display = 'block';
    document.getElementById('maximize-btn').style.display = 'none';
};

window.restoreTerminal = function() {
    const terminalEl = document.getElementById('top-terminal');
    terminalEl.classList.remove('collapsed', 'maximized');
    document.getElementById('resume-content').classList.remove('terminal-minimized', 'terminal-maximized');
    
    // Button visibility logic
    document.getElementById('minimize-btn').style.display = 'block';
    document.getElementById('restore-btn').style.display = 'none';
    document.getElementById('maximize-btn').style.display = 'block';
    
    setTimeout(fitTerminal, 350);
};

window.maximizeTerminal = function() {
    const terminalEl = document.getElementById('top-terminal');
    terminalEl.classList.add('maximized');
    terminalEl.classList.remove('collapsed');
    document.getElementById('resume-content').classList.add('terminal-maximized');
    document.getElementById('resume-content').classList.remove('terminal-minimized');
    
    // Button visibility logic
    document.getElementById('minimize-btn').style.display = 'none';
    document.getElementById('restore-btn').style.display = 'block';
    document.getElementById('maximize-btn').style.display = 'none';
    
    setTimeout(fitTerminal, 350);
};

window.addEventListener('resize', fitTerminal);


// --- Game Logic (remains mostly the same) ---
window.playSnake = function() { startSnakeGame(); };

window.playPythonGames = function() {
    if (!terminal) {
        initTopTerminal();
    }

    // Show terminal and run python games
    if (document.getElementById('top-terminal').classList.contains('collapsed')) {
        window.restoreTerminal();
    }

    handleCommand('python-games');
};

window.changeShader = function() {
    currentShader = (currentShader + 1) % shaders.length;
    set_shader(shaders[currentShader]);
    // ... (notification logic)
};
window.closeGame = function() {
    if (game) game.running = false;
    document.getElementById('game-display').style.display = 'none';
};
// ... (the rest of the game implementation)
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

// --- Main Application Initialization ---
async function main() {
    await loadResumeContent();
    initTopTerminal();

    document.addEventListener('keydown', (e) => {
        // Global key handlers: ESC to close overlays, game controls
        if (e.key === 'Escape') {
            window.closeGame();
            return;
        }

        if (game && game.running && document.getElementById('game-display').style.display === 'flex') {
            switch (e.key.toLowerCase()) {
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
    
    try {
        console.log('Attempting WebGPU/WebGL initialization...');
        await init();
        console.log('WASM renderer initialized successfully.');
    } catch (error) {
        console.warn('WASM renderer initialization failed:', error.message);
        // Site continues to work without background shaders
    }
    
    console.log('Site initialization complete');
}

main();