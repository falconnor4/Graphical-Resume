import init, { run_command, set_shader, get_active_shader } from './pkg/rendered_resume.js';

// --- Global State ---
let terminal = null;
let fitAddon = null;
let pyodide = null;

// --- Resume Loading ---
async function loadResumeContent() {
    try {
        const response = await fetch('./resume.json?t=' + Date.now());
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const resume = await response.json();
        const content = document.getElementById('resume-content');
        
        // Build sections dynamically - only from JSON
        let sectionsHTML = '';
        
        if (!resume.sections) {
            throw new Error('No sections configuration found in resume.json');
        }
        
        const sections = resume.sections;
        
        // Summary Section
        if (sections.summary && sections.summary.enabled && resume.summary) {
            sectionsHTML += `
                <div class="section">
                    <div class="section-title">
                        ${sections.summary.title}
                    </div>
                    <p style="font-size: 1.1em; color: var(--text-muted); line-height: 1.7;">${resume.summary}</p>
                </div>
            `;
        }
        
        // Experience Section
        if (sections.experience && sections.experience.enabled && resume.experience && resume.experience.length > 0) {
            const visibleExperiences = resume.experience.slice(0, 2);
            const hiddenExperiences = resume.experience.slice(2);
            
            sectionsHTML += `
                <div class="section">
                    <div class="section-title">
                        ${sections.experience.title}
                    </div>
                    ${visibleExperiences.map(exp => `
                        <div class="experience-item">
                            <div class="item-title">${exp.title}</div>
                            <div class="item-company">${exp.company} • ${exp.dates}</div>
                            <div class="item-description">${exp.description}</div>
                            <div class="tech-tags">
                                ${exp.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                    ${hiddenExperiences.length > 0 ? `
                        <div class="expand-section">
                            <div class="expand-controls" onclick="toggleSection('experience')">
                                <span class="expand-text">expand</span>
                                <span class="section-arrow">→</span>
                            </div>
                            <div class="collapsible-content" id="experience-content" style="display: none;">
                                ${hiddenExperiences.map(exp => `
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
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // Projects Section  
        if (sections.projects && sections.projects.enabled && resume.projects && resume.projects.length > 0) {
            const visibleProjects = resume.projects.slice(0, 2);
            const hiddenProjects = resume.projects.slice(2);
            
            sectionsHTML += `
                <div class="section">
                    <div class="section-title">
                        ${sections.projects.title}
                    </div>
                    ${visibleProjects.map(proj => `
                        <div class="project-item">
                            <div class="item-title">${proj.name}</div>
                            <div class="item-description">${proj.description}</div>
                            <div class="tech-tags">
                                ${proj.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                            </div>
                            ${proj.gallery_link ? `
                                <div style="margin-top: 1rem;">
                                    <a href="${proj.gallery_link}" class="contact-item">${proj.gallery_text || 'View Gallery →'}</a>
                                </div>
                            ` : (proj.github || proj.demo ? `
                                <div style="margin-top: 1rem;">
                                    ${proj.github ? `<a href="https://${proj.github}" target="_blank" class="contact-item">GitHub →</a>` : ''}
                                    ${proj.github && proj.demo ? ' • ' : ''}
                                    ${proj.demo ? `<a href="https://${proj.demo}" target="_blank" class="contact-item">Demo →</a>` : ''}
                                </div>
                            ` : '')}
                        </div>
                    `).join('')}
                    ${hiddenProjects.length > 0 ? `
                        <div class="expand-section">
                            <div class="expand-controls" onclick="toggleSection('projects')">
                                <span class="expand-text">expand</span>
                                <span class="section-arrow">→</span>
                            </div>
                            <div class="collapsible-content" id="projects-content" style="display: none;">
                                ${hiddenProjects.map(proj => `
                                    <div class="project-item">
                                        <div class="item-title">${proj.name}</div>
                                        <div class="item-description">${proj.description}</div>
                                        <div class="tech-tags">
                                            ${proj.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                                        </div>
                                        ${proj.gallery_link ? `
                                            <div style="margin-top: 1rem;">
                                                <a href="${proj.gallery_link}" class="contact-item">${proj.gallery_text || 'View Gallery →'}</a>
                                            </div>
                                        ` : (proj.github || proj.demo ? `
                                            <div style="margin-top: 1rem;">
                                                ${proj.github ? `<a href="https://${proj.github}" target="_blank" class="contact-item">GitHub →</a>` : ''}
                                                ${proj.github && proj.demo ? ' • ' : ''}
                                                ${proj.demo ? `<a href="https://${proj.demo}" target="_blank" class="contact-item">Demo →</a>` : ''}
                                            </div>
                                        ` : '')}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }
        
        // Skills Section
        if (sections.skills && sections.skills.enabled && resume.skills) {
            const skillCategories = Object.entries(resume.skills)
                .filter(([key, skills]) => Array.isArray(skills) && skills.length > 0)
                .map(([key, skills]) => {
                    if (!sections.skills.categories || !sections.skills.categories[key]) {
                        return ''; // Skip categories not defined in JSON
                    }
                    const categoryName = sections.skills.categories[key];
                    return `
                        <div class="skill-category">
                            <h4>${categoryName}</h4>
                            <div class="tech-tags">
                                ${skills.map(skill => `<span class="tech-tag">${skill}</span>`).join('')}
                            </div>
                        </div>
                    `;
                }).filter(category => category).join('');
            
            if (skillCategories) {
                sectionsHTML += `
                    <div class="section">
                        <div class="section-title">
                            ${sections.skills.title}
                        </div>
                        <div class="skills-grid">
                            ${skillCategories}
                        </div>
                    </div>
                `;
            }
        }
        
        // Education Section
        if (sections.education && sections.education.enabled && resume.education && resume.education.length > 0) {
            sectionsHTML += `
                <div class="section">
                    <div class="section-title">
                        ${sections.education.title}
                    </div>
                    ${resume.education.map(edu => `
                        <div class="experience-item">
                            <div class="item-title">${edu.degree}</div>
                            <div class="item-company">${edu.university} • ${edu.dates}${edu.gpa && edu.gpa !== 'In Progress' ? ` • GPA: ${edu.gpa}` : ''}</div>
                            ${edu.coursework && edu.coursework.length ? `
                                <div style="margin-top: 0.5rem;">
                                    <strong style="color: var(--primary-color);">Relevant Coursework:</strong>
                                    <div class="tech-tags" style="margin-top: 0.5rem;">
                                        ${edu.coursework.map(course => `<span class="tech-tag">${course}</span>`).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        // Validate required contact info exists
        if (!resume.contact || !resume.contact.name || !resume.contact.title || !resume.contact.email) {
            throw new Error('Required contact information missing from resume.json');
        }

        // Render everything
        content.innerHTML = `
            <div class="resume-header">
                <h1 class="resume-name">${resume.contact.name}</h1>
                <div class="resume-title">${resume.contact.title}</div>
                <div class="contact-info">
                    <a href="mailto:${resume.contact.email}" class="contact-item">${resume.contact.email}</a>
                    ${resume.contact.linkedin ? `<a href="https://${resume.contact.linkedin}" class="contact-item" target="_blank">${resume.contact.linkedin}</a>` : ''}
                    ${resume.contact.github ? `<a href="https://${resume.contact.github}" class="contact-item" target="_blank">${resume.contact.github}</a>` : ''}
                    ${resume.contact.location ? `<span class="contact-item">${resume.contact.location}</span>` : ''}
                </div>
            </div>
            
            ${sectionsHTML}
        `;
    } catch (error) {
        console.error('Error loading resume:', error);
        document.getElementById('resume-content').innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--accent-red);">
                <h2>Resume Loading Failed</h2>
                <p>Error: ${error.message}</p>
                <p>Check console for details.</p>
            </div>
        `;
    }
}

// --- Section Toggle Function ---
function toggleSection(sectionName) {
    const content = document.getElementById(sectionName + '-content');
    const expandControls = event.target.closest('.expand-controls');
    const expandText = expandControls.querySelector('.expand-text');
    const arrow = expandControls.querySelector('.section-arrow');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        expandText.textContent = 'collapse';
        arrow.style.transform = 'rotate(90deg)';
    } else {
        content.style.display = 'none';
        expandText.textContent = 'expand';
        arrow.style.transform = 'rotate(0deg)';
    }
}

// Make function globally available
window.toggleSection = toggleSection;

// --- Terminal Command Handling ---
const prompt = '$ ';
let commandHistory = [];
let historyIndex = -1;
let currentCommand = "";

async function handleCommand(commandStr) {
    if (commandHistory[commandHistory.length - 1] !== commandStr) {
        commandHistory.push(commandStr);
    }
    historyIndex = commandHistory.length;

    if (commandStr.trim().startsWith('python ')) {
        const code = commandStr.trim().substring(7);
        try {
            let result = await pyodide.runPythonAsync(code);
            if (result !== undefined) {
                terminal.writeln(result);
            }
        } catch (error) {
            terminal.writeln(error.message);
        }
        return;
    }

    const output = await run_command(commandStr);
    if (output) {
        if (output.startsWith('__SET_SHADER__:')) {
            const shaderName = output.split(':')[1];
            set_shader(shaderName);
            terminal.writeln(`Switched to shader: ${shaderName}`);
        } else if (output === '__CLEAR__') {
            terminal.clear();
        } else if (output === '__DOWNLOAD_PDF__') {
            downloadResumeAsPdf();
        } else if (output === '__SHOW_RESUME__') {
            // This is not handled yet.
        }
        else {
            terminal.writeln(output.replace(/\n/g, '\r\n'));
        }
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

    terminal.onKey(async ({ key, domEvent }) => {
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

        if (domEvent.keyCode === 13) { // Enter
            terminal.write('\r\n');
            if (currentCommand.length > 0) {
                await handleCommand(currentCommand);
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



async function downloadResumeAsPdf() {
    terminal.writeln("Generating balanced single-page PDF...");

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');

        const resumeResponse = await fetch('./resume.json?t=' + Date.now());
        const resume = await resumeResponse.json();

        // --- Constants (Balanced B&W) ---
        const TEXT_COLOR = '#000000';
        const MARGIN = 40;
        const PAGE_WIDTH = doc.internal.pageSize.getWidth();
        const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

        let y = 0;
        
        // --- Header ---
        y = MARGIN;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(TEXT_COLOR);
        doc.text(resume.contact.name, PAGE_WIDTH / 2, y, { align: 'center' });
        y += 24;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(resume.contact.title, PAGE_WIDTH / 2, y, { align: 'center' });
        y += 16;

        doc.setFontSize(10);
        const contactInfo = [resume.contact.email, resume.contact.phone, resume.contact.github, resume.contact.location].filter(Boolean).join('  •  ');
        doc.text(contactInfo, PAGE_WIDTH / 2, y, { align: 'center' });
        y += 22;

        doc.setDrawColor(TEXT_COLOR);
        doc.setLineWidth(0.7);
        doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
        y += 22;

        // --- Section Helper ---
        const drawSection = (title, body) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text(title.toUpperCase(), MARGIN, y);
            y += 15;
            body();
            y += 15;
        };

        // --- Summary ---
        if (resume.sections.summary && resume.sections.summary.enabled) {
            drawSection(resume.sections.summary.title, () => {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                const summaryLines = doc.splitTextToSize(resume.summary, CONTENT_WIDTH);
                doc.text(summaryLines, MARGIN, y);
                y += summaryLines.length * 12;
            });
        }

        // --- Experience ---
        if (resume.sections.experience && resume.sections.experience.enabled) {
            drawSection(resume.sections.experience.title, () => {
                resume.experience.forEach(exp => {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10.5);
                    doc.text(exp.title, MARGIN, y);

                    doc.setFont('helvetica', 'normal');
                    doc.text(exp.dates, CONTENT_WIDTH + MARGIN, y, { align: 'right' });
                    y += 13;

                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(10);
                    doc.text(exp.company, MARGIN, y);
                    y += 13;

                    doc.setFont('helvetica', 'normal');
                    const descLines = doc.splitTextToSize(exp.description, CONTENT_WIDTH);
                    doc.text(descLines, MARGIN, y);
                    y += descLines.length * 12 + 8;
                });
            });
        }

        // --- Projects ---
        if (resume.sections.projects && resume.sections.projects.enabled) {
            drawSection(resume.sections.projects.title, () => {
                resume.projects.forEach(proj => {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10.5);
                    doc.text(proj.name, MARGIN, y);
                    y += 13;

                    doc.setFont('helvetica', 'normal');
                    const descLines = doc.splitTextToSize(proj.description, CONTENT_WIDTH);
                    doc.text(descLines, MARGIN, y);
                    y += descLines.length * 12;

                    if (proj.github) {
                        doc.textWithLink(`GitHub: ${proj.github}`, MARGIN, y, { url: `https://${proj.github}` });
                        y += 12;
                    }
                    y += 8;
                });
            });
        }

        // --- Skills ---
        if (resume.sections.skills && resume.sections.skills.enabled) {
            drawSection(resume.sections.skills.title, () => {
                for (const category in resume.skills) {
                    if (resume.sections.skills.categories[category] && resume.skills[category].length > 0) {
                        doc.setFont('helvetica', 'bold');
                        doc.setFontSize(10.5);
                        doc.text(resume.sections.skills.categories[category], MARGIN, y);
                        y += 13;

                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(10);
                        const skillsString = resume.skills[category].join('  •  ');
                        const skillLines = doc.splitTextToSize(skillsString, CONTENT_WIDTH);
                        doc.text(skillLines, MARGIN, y);
                        y += skillLines.length * 12 + 8;
                    }
                }
            });
        }

        // --- Education ---
        if (resume.sections.education && resume.sections.education.enabled) {
            drawSection(resume.sections.education.title, () => {
                resume.education.forEach(edu => {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10.5);
                    doc.text(edu.degree, MARGIN, y);

                    doc.setFont('helvetica', 'normal');
                    doc.text(edu.dates, CONTENT_WIDTH + MARGIN, y, { align: 'right' });
                    y += 13;

                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(10);
                    doc.text(edu.university, MARGIN, y);
                    y += 13;
                });
            });
        }

        doc.save('resume_one_page.pdf');
        terminal.writeln("PDF download started.");
    } catch (error) {
        terminal.writeln(`Error generating PDF: ${error.message}`);
        console.error("PDF Generation Error:", error);
    }
}

window.setup_shader_switcher = (names) => {
    const select = document.getElementById('shader-select');
    if (!select) return;

    select.innerHTML = '';
    for (const name of names) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        select.appendChild(option);
    }

    select.style.display = 'block';

    select.addEventListener('change', (event) => {
        set_shader(event.target.value);
    });
};

// --- Main Application Initialization ---
async function main() {
    await loadResumeContent();
    initTopTerminal();

    document.getElementById('download-pdf-btn').addEventListener('click', downloadResumeAsPdf);

    document.addEventListener('keydown', (e) => {
        // Global key handlers: ESC to close overlays, game controls
        if (e.key === 'Escape') {
            // Future use for closing modals or overlays
            return;
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
