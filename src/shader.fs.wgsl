// Mandelbrot fractal shader - beautiful and mesmerizing

struct Uniforms {
    time: f32,
    _padding1: array<u32, 3>,
    mouse: vec2<f32>,
    _padding2: array<u32, 2>,
    resolution: vec2<f32>,
    _padding3: array<u32, 2>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

fn mandelbrot(c: vec2<f32>) -> f32 {
    var z = vec2<f32>(0.0, 0.0);
    var n = 0.0;
    
    for (var i = 0; i < 80; i = i + 1) {
        if (dot(z, z) > 4.0) {
            break;
        }
        z = vec2<f32>(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
        n = n + 1.0;
    }
    
    return n / 80.0;
}

@fragment
fn main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4<f32> {
    var uv = (frag_coord.xy - 0.5 * uniforms.resolution.xy) / min(uniforms.resolution.x, uniforms.resolution.y);
    
    // Zoom and pan animation
    let zoom = 1.0 + 0.5 * sin(uniforms.time * 0.2);
    let offset = vec2<f32>(0.5 * sin(uniforms.time * 0.1), 0.3 * cos(uniforms.time * 0.15));
    uv = uv * zoom + offset;
    
    let m = mandelbrot(uv);
    
    // Color mapping with time-based cycling
    let hue = m * 6.28 + uniforms.time * 0.5;
    let col = vec3<f32>(
        0.5 + 0.5 * sin(hue),
        0.5 + 0.5 * sin(hue + 2.09),
        0.5 + 0.5 * sin(hue + 4.19)
    );
    
    return vec4<f32>(col * (1.0 - m), 1.0);
}
