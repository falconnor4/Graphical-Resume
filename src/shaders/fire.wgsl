// Water-like shader

struct Uniforms {
    time: f32,
    _padding1: vec3<f32>,
    mouse: vec2<f32>,
    _padding2: vec2<f32>,
    resolution: vec2<f32>,
    _padding3: vec2<f32>,
    _extra_padding1: vec4<f32>,
    _extra_padding2: vec4<f32>,
    _extra_padding3: vec4<f32>,
    _extra_padding4: vec4<f32>,
    _extra_padding5: vec4<f32>,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

fn hash(p: vec2<f32>) -> f32 {
    let h = dot(p, vec2<f32>(127.1, 311.7));
    return fract(sin(h) * 43758.5453123);
}

fn noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);

    let a = hash(i + vec2<f32>(0.0, 0.0));
    let b = hash(i + vec2<f32>(1.0, 0.0));
    let c = hash(i + vec2<f32>(0.0, 1.0));
    let d = hash(i + vec2<f32>(1.0, 1.0));

    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

fn fbm(p_in: vec2<f32>) -> f32 {
    var p = p_in;
    var value = 0.0;
    var amplitude = 0.5;
    
    for (var i = 0; i < 6; i = i + 1) {
        value = value + amplitude * noise(p);
        p = p * 2.0;
        amplitude = amplitude * 0.5;
    }
    return value;
}


@fragment
fn main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4<f32> {
    var uv = frag_coord.xy / uniforms.resolution.xy;
    uv.x = uv.x * (uniforms.resolution.x / uniforms.resolution.y);

    let speed = 0.1;
    
    var q = vec2<f32>(fbm(uv + uniforms.time * speed), fbm(uv + vec2<f32>(5.2, 1.3) + uniforms.time * speed));
    var r = vec2<f32>(fbm(uv + q * 0.5 + vec2<f32>(1.7, 9.2) + uniforms.time * speed * 0.5), fbm(uv + q * 0.5 + vec2<f32>(8.3, 2.8) + uniforms.time * speed * 0.5));

    let f = fbm(uv + r);

    let color = smoothstep(0.4, 0.6, f);

    return vec4<f32>(color, color, color, 1.0);
}