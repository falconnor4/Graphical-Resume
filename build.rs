use std::env;
use std::fs;
use std::path::Path;

fn main() {
    let out_dir = env::var_os("OUT_DIR").unwrap();
    let dest_path = Path::new(&out_dir).join("shaders.rs");

    let mut shader_code = String::new();
    shader_code.push_str("static SHADER_SOURCES: &[(&str, &str)] = &[
");

    for entry in fs::read_dir("src/shaders").unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();
        if path.is_file() {
            if let Some(file_name_osstr) = path.file_name() {
                if let Some(file_name) = file_name_osstr.to_str() {
                    if file_name.ends_with(".wgsl") {
                        println!("cargo:rerun-if-changed={}", path.display());
                        let content = fs::read_to_string(&path).unwrap();
                        // Use the filename without extension as the shader name
                        let shader_name = file_name.trim_end_matches(".wgsl");
                        shader_code.push_str(&format!(
                            "    (\"{}\", r#\"{}\"#),\n",
                            shader_name,
                            content
                        ));
                    }
                }
            }
        }
    }

    shader_code.push_str("];\n");

    fs::write(&dest_path, shader_code).unwrap();
    println!("cargo:rerun-if-changed=build.rs");
    println!("cargo:rerun-if-changed=src/shaders");
}