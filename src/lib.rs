use std::cell::RefCell;
use std::rc::Rc;
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
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

    let state = renderer::State::new(canvas).await;
    RENDER_STATE.with(|cell| *cell.borrow_mut() = Some(state));

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
            if let Some(state) = state_cell.borrow_mut().as_mut() {
                state.update(time as f32 / 1000.0, *mouse_pos.borrow());
                match state.render() {
                    Ok(_) => {}
                    Err(wgpu::SurfaceError::Lost) => state.resize(state.size),
                    Err(e) => eprintln!("Error rendering frame: {:?}", e),
                }
            }
        });
        request_animation_frame(f.borrow().as_ref().unwrap());
    }) as Box<dyn FnMut(_)>));

    request_animation_frame(g.borrow().as_ref().unwrap());
}

// --- Terminal Command Logic ---
#[derive(Deserialize, Debug)] struct Contact { name: String, email: String, linkedin: String, github: String }
#[derive(Deserialize, Debug)] struct Experience { title: String, company: String, dates: String, description: String }
#[derive(Deserialize, Debug)] struct Education { degree: String, university: String, dates: String }
#[derive(Deserialize, Debug)] struct Resume { contact: Contact, summary: String, experience: Vec<Experience>, education: Vec<Education>, skills: Vec<String> }

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
    let exp_str = resume.experience.iter().map(|e| format!("- {}\n  {} ({})\n  {}\n", e.title, e.company, e.dates, e.description)).collect::<Vec<String>>().join("\n");
    let edu_str = resume.education.iter().map(|e| format!("- {}, {} ({})", e.degree, e.university, e.dates)).collect::<Vec<String>>().join("\n");
    let formatted = format!("\n{}\n{} | {} | {}\n\n{}\n\n== Experience ==\n{}\n== Education ==\n{}\n== Skills ==\n{}\n", resume.contact.name, resume.contact.email, resume.contact.linkedin, resume.contact.github, resume.summary, exp_str, edu_str, resume.skills.join(", "));
    Ok(formatted)
}

#[wasm_bindgen]
pub fn set_shader(name: String) {
    RENDER_STATE.with(|cell| {
        if let Some(state) = cell.borrow_mut().as_mut() {
            state.set_pipeline(&name);
        }
    });
}

#[wasm_bindgen]
pub async fn run_command(command: String) -> String {
    let parts: Vec<&str> = command.trim().split_whitespace().collect();
    match parts.as_slice() {
        ["help"] => "\nAvailable commands:\n  help\n  cat resume\n  shader [default|fire|ice]\n  python <code>\n  clear\n".to_string(),
        ["cat", "resume"] => fetch_resume_data().await.unwrap_or_else(|_| "Error fetching resume".to_string()),
        ["shader", name] => format!("__SET_SHADER__:{}", name),
        ["clear"] => "__CLEAR__".to_string(),
        [] => "".to_string(),
        _ => format!("\n{}: command not found", command),
    }
}
