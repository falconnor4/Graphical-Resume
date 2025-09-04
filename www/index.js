import init, { run_command, set_shader } from '../pkg/rendered_resume.js';

async function main() {
    const term = new Terminal({
        cursorBlink: true,
        convertEol: true,
        fontFamily: "'Share Tech Mono', monospace",
        fontSize: 16,
        theme: {
            background: 'rgba(10, 10, 10, 0.6)',
            foreground: '#00e5e5',
            cursor: '#00e5e5',
            selection: 'rgba(0, 229, 229, 0.3)',
        }
    });
    const termElement = document.getElementById('terminal');
    term.open(termElement);
    term.focus();

    term.writeln('Welcome to rendered-resume!');
    term.writeln('Loading Python runtime... (this may take a moment)');

    // Load Pyodide
    let pyodide = await loadPyodide();
    term.writeln('Python runtime loaded.');

    // Initialize the wasm module and renderer
    await init();

    term.writeln('Type `help` to see available commands.');
    term.write('$ ');

    let command = "";

    term.onKey(async ({ key, domEvent }) => {
        const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

        if (domEvent.keyCode === 13) { // Enter
            if (command.length > 0) {
                term.write('\r\n');

                if (command.trim().startsWith("python")) {
                    const code = command.trim().substring(6).trim();
                    if (code) {
                        try {
                            // Redirect stdout to a string
                            pyodide.globals.set('code_to_run', code);
                            let output = await pyodide.runPythonAsync(`
                                import sys
                                import io
                                sys.stdout = io.StringIO()
                                exec(code_to_run)
                                sys.stdout.getvalue()
                            `);
                            term.writeln(output.replace(/\n/g, '\r\n'));
                        } catch (e) {
                            term.writeln(`Error: ${e.message}`);
                        }
                    } else {
                        term.writeln("Usage: python <code>");
                    }
                } else {
                    const output = await run_command(command);
                    if (output.startsWith("__SET_SHADER__:")) {
                        const shaderName = output.split(":")[1];
                        set_shader(shaderName);
                        term.writeln(`Shader set to: ${shaderName}`);
                    } else if (output === "__CLEAR__") {
                        term.clear();
                    } else {
                        term.writeln(output.replace(/\n/g, '\r\n'));
                    }
                }
                command = "";
            }
            term.write('$ ');
        } else if (domEvent.keyCode === 8) { // Backspace
            if (command.length > 0) {
                term.write('\b \b');
                command = command.slice(0, -1);
            }
        } else if (printable) {
            command += key;
            term.write(key);
        }
    });
}

main();
