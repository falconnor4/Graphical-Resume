// Crystal ice shader with refractions and caustics

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
    var p3 = fract(vec3<f32>(p.xyx) * 0.1031);
    p3 = p3 + dot(p3, p3.yzx + 19.19);
    return fract((p3.x + p3.y) * p3.z);
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

fn voronoi(p: vec2<f32>) -> vec2<f32> {
    let n = floor(p);
    let f = fract(p);
    
    var mr = 8.0;
    var mg = vec2<f32>(0.0);
    
    for (var j = -1; j <= 1; j = j + 1) {
        for (var i = -1; i <= 1; i = i + 1) {
            let g = vec2<f32>(f32(i), f32(j));
            let o = hash(n + g) * vec2<f32>(sin(uniforms.time * 0.3), cos(uniforms.time * 0.5));
            let r = g + o - f;
            let d = dot(r, r);
            
            if (d < mr) {
                mr = d;
                mg = r;
            }
        }
    }
    
    return vec2<f32>(sqrt(mr), mg.x);
}

@fragment
fn main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4<f32> {
    var uv = frag_coord.xy / uniforms.resolution.xy;
    uv = uv * 2.0 - 1.0;
    uv.x = uv.x * (uniforms.resolution.x / uniforms.resolution.y);
    
    let time = uniforms.time * 0.2;
    
    // Create ice crystal pattern using Voronoi
    let scale = 6.0 + 2.0 * sin(time);
    let vor = voronoi(uv * scale + vec2<f32>(time, time * 0.7));
    
    // Crystal edges
    let edge = smoothstep(0.0, 0.1, vor.x);
    let crystal = 1.0 - edge;
    
    // Add some noise for texture
    let n1 = noise(uv * 15.0 + vec2<f32>(time * 2.0, time));
    let n2 = noise(uv * 30.0 - vec2<f32>(time, time * 1.5));
    let texture_noise = n1 * 0.7 + n2 * 0.3;
    
    // Ice blue colors with caustics
    let caustic = sin(vor.x * 20.0 + time * 5.0) * 0.5 + 0.5;
    let blue_tint = vec3<f32>(0.6, 0.8, 1.0);
    let cyan_tint = vec3<f32>(0.4, 0.9, 1.0);
    
    var color = mix(blue_tint, cyan_tint, caustic);
    color = color * (0.5 + 0.5 * texture_noise);
    color = color * (0.3 + 0.7 * crystal);
    
    // Add sparkle effect
    let sparkle = smoothstep(0.98, 1.0, texture_noise) * crystal;
    color = color + vec3<f32>(sparkle * 0.8);
    
    // Fade to darker blue at edges
    let vignette = 1.0 - length(uv * 0.5);
    color = color * (0.4 + 0.6 * vignette);
    
    return vec4<f32>(color, 1.0);
}