// A simple fragment shader that colors the screen based on the fragment's position.
// It also includes placeholders for time and mouse uniforms for later use.

struct Uniforms {
    [[location(0)]] time: f32;
    [[location(1)]] mouse: vec2<f32>;
    [[location(2)]] resolution: vec2<f32>;
};
[[group(0), binding(0)]] var<uniform> uniforms: Uniforms;

[[stage(fragment)]]
fn main([[builtin(position)]] frag_coord: vec4<f32>) -> [[location(0)]] vec4<f32> {
    let uv = frag_coord.xy / uniforms.resolution.xy;
    return vec4<f32>(uv.x, uv.y, 0.5 + 0.5 * sin(uniforms.time), 1.0);
}
