// Ice/Water shader adapted from Shadertoy
// https://www.shadertoy.com/view/Xtl3RX

struct Uniforms {
    [[location(0)]] time: f32;
    [[location(1)]] mouse: vec2<f32>;
    [[location(2)]] resolution: vec2<f32>;
};
[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

fn random(st: vec2<f32>) -> f32 {
    return fract(sin(dot(st.xy, vec2<f32>(12.9898, 78.233))) * 43758.5453123);
}

fn noise(st: vec2<f32>) -> f32 {
    let i = floor(st);
    let f = fract(st);

    let a = random(i);
    let b = random(i + vec2<f32>(1.0, 0.0));
    let c = random(i + vec2<f32>(0.0, 1.0));
    let d = random(i + vec2<f32>(1.0, 1.0));

    let u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

fn fbm(st: vec2<f32>) -> f32 {
    var value = 0.0;
    var amplitude = 0.5;
    var p = st;

    for (var i = 0; i < 6; i = i + 1) {
        value = value + amplitude * noise(p);
        p = p * 2.0;
        amplitude = amplitude * 0.5;
    }
    return value;
}

[[stage(fragment)]]
fn main([[builtin(position)]] frag_coord: vec4<f32>) -> [[location(0)]] vec4<f32> {
    let uv = frag_coord.xy / uniforms.resolution.xy;
    let t = uniforms.time * 0.1;

    let f = fbm(uv + vec2<f32>(t, 0.0));
    let color = vec3<f32>(0.0, 0.1, 0.6 + f * 0.4);

    return vec4<f32>(color, 1.0);
}
