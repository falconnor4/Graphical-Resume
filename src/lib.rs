use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;

#[wasm_bindgen]
extern "C" {
    fn setup_shader_switcher(names: js_sys::Array);
}
use serde::Deserialize;

mod renderer;

// --- Global State for the Renderer (Single-Threaded) ---
thread_local! {
    static RENDER_STATE: RefCell<Option<renderer::State>> = RefCell::new(None);
}

// --- WebGPU Renderer and Animation Loop ---
fn request_animation_frame(f: &Closure<dyn FnMut(f64)>) {
    web_sys::window()
        .unwrap()
        .request_animation_frame(f.as_ref().unchecked_ref())
        .expect("should register `requestAnimationFrame` OK");
}

#[wasm_bindgen(start)]
pub async fn start() {
    console_error_panic_hook::set_once();

    let window = web_sys::window().unwrap();
    let document = window.document().unwrap();
    let canvas = document.get_element_by_id("wgpu-canvas").unwrap();
    let canvas: web_sys::HtmlCanvasElement = canvas.dyn_into().unwrap();

    // Set canvas size to window size
    canvas.set_width(window.inner_width().unwrap().as_f64().unwrap() as u32);
    canvas.set_height(window.inner_height().unwrap().as_f64().unwrap() as u32);

    web_sys::console::log_1(&"Creating WebGPU renderer state...".into());
    let state = renderer::State::new(canvas.clone()).await;
    web_sys::console::log_1(&"WebGPU renderer state created successfully".into());

    let shader_names = state.get_shader_names();
    let js_shader_names = js_sys::Array::new();
    for name in shader_names {
        js_shader_names.push(&JsValue::from_str(&name));
    }
    setup_shader_switcher(js_shader_names);

    RENDER_STATE.with(|cell| *cell.borrow_mut() = Some(state));

    // Handle resize
    let canvas_clone = canvas.clone();
    let resize_closure = Closure::wrap(Box::new(move |_event: web_sys::Event| {
        let window = web_sys::window().unwrap();
        let width = window.inner_width().unwrap().as_f64().unwrap() as u32;
        let height = window.inner_height().unwrap().as_f64().unwrap() as u32;
        
        canvas_clone.set_width(width);
        canvas_clone.set_height(height);
        
        RENDER_STATE.with(|cell| {
            if let Ok(mut borrow) = cell.try_borrow_mut() {
                if let Some(state) = borrow.as_mut() {
                    state.resize((width, height));
                }
            }
        });
    }) as Box<dyn FnMut(_)>);
    
    window.add_event_listener_with_callback("resize", resize_closure.as_ref().unchecked_ref()).unwrap();
    resize_closure.forget();

    let f = Rc::new(RefCell::new(None));
    let g = f.clone();

    let mouse_pos = Rc::new(RefCell::new([0.0, 0.0]));
    let mouse_pos_clone = mouse_pos.clone();

    let mouse_closure = Closure::wrap(Box::new(move |event: web_sys::MouseEvent| {
        let mut pos = mouse_pos_clone.borrow_mut();
        pos[0] = event.client_x() as f32;
        pos[1] = event.client_y() as f32;
    }) as Box<dyn FnMut(_)>);
    window.add_event_listener_with_callback("mousemove", mouse_closure.as_ref().unchecked_ref()).unwrap();
    mouse_closure.forget();

    *g.borrow_mut() = Some(Closure::wrap(Box::new(move |time: f64| {
        RENDER_STATE.with(|state_cell| {
            if let Ok(mut borrow) = state_cell.try_borrow_mut() {
                if let Some(state) = borrow.as_mut() {
                    state.update(time as f32 / 1000.0, *mouse_pos.borrow());
                    match state.render() {
                        Ok(_) => {}
                        Err(wgpu::SurfaceError::Lost) => state.resize(state.size),
                        Err(e) => eprintln!("Error rendering frame: {:?}", e),
                    }
                }
            }
        });
        request_animation_frame(f.borrow().as_ref().unwrap());
    }) as Box<dyn FnMut(_)>));

    request_animation_frame(g.borrow().as_ref().unwrap());
}

// --- Terminal Command Logic ---
#[derive(Deserialize, Debug)] struct Contact { name: String, email: String, linkedin: String, github: String, location: String }
#[derive(Deserialize, Debug)] struct Experience { title: String, company: String, dates: String, description: String, technologies: Vec<String> }
#[derive(Deserialize, Debug)] struct Education { degree: String, university: String, dates: String, gpa: String, coursework: Vec<String> }
#[derive(Deserialize, Debug)] struct Skills { languages: Vec<String>, web: Vec<String>, tools: Vec<String>, concepts: Vec<String> }
#[derive(Deserialize, Debug)] struct Project { name: String, description: String, technologies: Vec<String>, github: Option<String>, demo: Option<String> }
#[derive(Deserialize, Debug)] struct Resume { contact: Contact, summary: String, experience: Vec<Experience>, education: Vec<Education>, skills: Skills, projects: Vec<Project> }

async fn fetch_resume_data() -> Result<String, JsValue> {
    let opts = web_sys::RequestInit::new();
    opts.set_method("GET");
    opts.set_mode(web_sys::RequestMode::Cors);
    let request = web_sys::Request::new_with_str_and_init("./resume.json", &opts)?;
    let window = web_sys::window().unwrap();
    let resp_value = wasm_bindgen_futures::JsFuture::from(window.fetch_with_request(&request)).await?;
    let resp: web_sys::Response = resp_value.dyn_into().unwrap();
    let json = wasm_bindgen_futures::JsFuture::from(resp.json()?).await?;
    let resume: Resume = serde_wasm_bindgen::from_value(json).unwrap();
    let exp_str = resume.experience.iter().map(|e| format!("- {}\n  {} ({})\n  {}\n  Tech: {}\n", e.title, e.company, e.dates, e.description, e.technologies.join(", "))).collect::<Vec<String>>().join("\n");
    let edu_str = resume.education.iter().map(|e| format!("- {}, {} ({}) - GPA: {}\n  Coursework: {}", e.degree, e.university, e.dates, e.gpa, e.coursework.join(", "))).collect::<Vec<String>>().join("\n");
    let proj_str = resume.projects.iter().map(|p| format!("- {}\n  {}\n  Tech: {}\n  Links: {}", p.name, p.description, p.technologies.join(", "), [p.github.as_deref(), p.demo.as_deref()].iter().filter_map(|&x| x).collect::<Vec<&str>>().join(", "))).collect::<Vec<String>>().join("\n\n");
    let skills_str = format!("Languages: {}\nWeb: {}\nTools: {}\nConcepts: {}", resume.skills.languages.join(", "), resume.skills.web.join(", "), resume.skills.tools.join(", "), resume.skills.concepts.join(", "));
    let formatted = format!("\n{}\n{} | {} | {} | {}\n\n{}\n\n== Experience ==\n{}\n== Education ==\n{}\n== Skills ==\n{}\n\n== Projects ==\n{}\n", resume.contact.name, resume.contact.email, resume.contact.linkedin, resume.contact.github, resume.contact.location, resume.summary, exp_str, edu_str, skills_str, proj_str);
    Ok(formatted)
}

#[wasm_bindgen]
pub fn set_shader(name: String) {
    RENDER_STATE.with(|cell| {
        if let Ok(mut borrow) = cell.try_borrow_mut() {
            if let Some(state) = borrow.as_mut() {
                state.set_pipeline(&name);
            }
        }
    });
}

#[wasm_bindgen]
pub fn get_active_shader() -> String {
    RENDER_STATE.with(|cell| {
        if let Ok(borrow) = cell.try_borrow() {
            if let Some(state) = borrow.as_ref() {
                return state.get_active_shader();
            }
        }
        "none".to_string()
    })
}

#[wasm_bindgen]
pub async fn run_command(command: String) -> String {
    let parts: Vec<&str> = command.trim().split_whitespace().collect();
    match parts.as_slice() {
        ["help"] => "\nAvailable commands:\n  help\n  cat resume\n  view resume\n  game (Snake - JavaScript)\n  python-games (Python collection)\n  python <code>\n  shaders (list available shaders)\n  shader [name] (switch shader)\n  clear\n".to_string(),
        ["cat", "resume"] => fetch_resume_data().await.unwrap_or_else(|_| "Error fetching resume".to_string()),
        ["view", "resume"] => "__SHOW_RESUME__".to_string(),
        ["game"] => "\nStarting Snake Game...\nUse WASD or arrow keys to move\nEat the red squares to grow!\n\n__START_GAME__".to_string(),
        ["python-games"] => "__RUN_PYTHON_GAMES__".to_string(),
        ["shader", name] => {
            let shader_exists = RENDER_STATE.with(|cell| {
                cell.borrow().as_ref().unwrap().get_shader_names().contains(&name.to_string())
            });
            if shader_exists {
                format!("__SET_SHADER__:{}", name)
            } else {
                let available = RENDER_STATE.with(|cell| {
                    cell.borrow().as_ref().unwrap().get_shader_names()
                });
                format!("Shader '{}' not found. Available shaders:\n  {}", name, available.join("\n  "))
            }
        },
        ["shaders"] => {
            RENDER_STATE.with(|cell| {
                let state = cell.borrow();
                let state = state.as_ref().unwrap();
                let names = state.get_shader_names();
                let active = state.get_active_shader();
                let shader_list = names.iter()
                    .map(|name| if name == &active {
                        format!("  {} (active)", name)
                    } else {
                        format!("  {}", name)
                    })
                    .collect::<Vec<String>>()
                    .join("\n");
                format!("Available shaders:\n{}\n\nUse 'shader [name]' to switch", shader_list)
            })
        },
        ["clear"] => "__CLEAR__".to_string(),
        [] => "".to_string(),
        _ => format!("\n{}: command not found", command),
    }
}
