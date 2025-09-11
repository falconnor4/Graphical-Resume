// Plasma fire shader with flowing energy

struct Uniforms {
    time: f32,
    _padding1: vec3<f32>,
    mouse: vec2<f32>,
    _padding2: vec2<f32>,
    resolution: vec2<f32>,
    _padding3: vec2<f32>,
    _extra_padding1: vec4<f32>,
    _extra_padding2: vec4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

fn hash(p: vec2<f32>) -> f32 {
    let p3 = fract(vec3<f32>(p.xyx) * 0.1031);
    let p3_add = p3 + dot(p3, p3.yzx + 19.19);
    return fract((p3_add.x + p3_add.y) * p3_add.z);
}

fn noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);

    return mix(
        mix(hash(i + vec2<f32>(0.0, 0.0)), hash(i + vec2<f32>(1.0, 0.0)), u.x),
        mix(hash(i + vec2<f32>(0.0, 1.0)), hash(i + vec2<f32>(1.0, 1.0)), u.x),
        u.y
    );
}

fn fbm(p: vec2<f32>) -> f32 {
    var value = 0.0;
    var amplitude = 0.5;
    var frequency = 1.0;
    var pos = p;
    
    for (var i = 0; i < 5; i = i + 1) {
        value = value + amplitude * noise(pos);
        pos = pos * 2.0;
        amplitude = amplitude * 0.5;
        frequency = frequency * 2.0;
    }
    
    return value;
}

@fragment
fn main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4<f32> {
    var uv = frag_coord.xy / uniforms.resolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x = uv.x * (uniforms.resolution.x / uniforms.resolution.y);

    // Flowing fire effect
    let time = uniforms.time * 0.8;
    var noise_uv = vec2<f32>(uv.x * 2.0, uv.y * 3.0 + time);
    
    let n1 = fbm(noise_uv);
    let n2 = fbm(noise_uv * 2.0 + vec2<f32>(1.7, 9.2));
    let n3 = fbm(noise_uv * 4.0 + vec2<f32>(8.3, 2.8));
    
    let turbulence = n1 + 0.5 * n2 + 0.25 * n3;
    
    // Create fire-like gradient
    let flame_height = 1.0 + 0.5 * turbulence - uv.y * 1.5;
    let flame_intensity = max(0.0, flame_height);
    
    // Color mapping for fire
    var color = vec3<f32>(0.0);
    if (flame_intensity > 0.0) {
        let hot = smoothstep(0.0, 0.8, flame_intensity);
        let very_hot = smoothstep(0.5, 1.0, flame_intensity);
        
        color = vec3<f32>(1.0, hot * 0.8, very_hot * 0.2);
        color = color * flame_intensity;
    }
    
    // Add some orange and red variations
    color.r = color.r + 0.3 * sin(time + uv.x * 3.0);
    color.g = color.g * (0.7 + 0.3 * cos(time * 0.7 + uv.y * 2.0));
    
    return vec4<f32>(color, 1.0);
}
