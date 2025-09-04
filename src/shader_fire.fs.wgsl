// Fire shader adapted from Shadertoy
// https://www.shadertoy.com/view/4dsGW2

struct Uniforms {
    [[location(0)]] time: f32;
    [[location(1)]] mouse: vec2<f32>;
    [[location(2)]] resolution: vec2<f32>;
};
[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

fn hash(p: vec2<f32>) -> f32 {
    let p3 = fract(vec3<f32>(p.xyx) * 0.1031);
    let p3_add = p3 + dot(p3, p3.yzx + 19.19);
    return fract((p3_add.x + p3_add.y) * p3_add.z);
}

fn noise(p: vec2<f32>) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);

    return mix(mix(hash(i + vec2<f32>(0.0, 0.0)),
                   hash(i + vec2<f32>(1.0, 0.0)), u.x),
               mix(hash(i + vec2<f32>(0.0, 1.0)),
                   hash(i + vec2<f32>(1.0, 1.0)), u.x), u.y);
}

fn fbm(p: vec2<f32>) -> f32 {
    var f: f32 = 0.0;
    let m = mat2x2<f32>(vec2<f32>(0.8,  0.6), vec2<f32>(-0.6,  0.8));

    f = f + 0.5000 * noise(p); p = m * p * 2.02;
    f = f + 0.2500 * noise(p); p = m * p * 2.03;
    f = f + 0.1250 * noise(p); p = m * p * 2.01;
    f = f + 0.0625 * noise(p);
    return f / 0.9375;
}

[[stage(fragment)]]
fn main([[builtin(position)]] frag_coord: vec4<f32>) -> [[location(0)]] vec4<f32> {
    var uv = frag_coord.xy / uniforms.resolution.xy;
    uv.x = uv.x * (uniforms.resolution.x / uniforms.resolution.y);

    var q = uv;
    q.x = q.x * 2.0 - 0.5;
    q.y = q.y * 2.0 - 1.0;

    let t = uniforms.time * 0.5;
    let fire_uv = vec2<f32>(q.x, q.y + t);

    let f = fbm(fire_uv * 3.0);

    var c = vec3<f32>(1.0, 0.5, 0.1) * f;
    c = c * (1.0 - uv.y); // Fade to black at the top
    c = smoothstep(vec3<f32>(0.0), vec3<f32>(1.0), c);

    return vec4<f32>(c, 1.0);
}
