// A simple vertex shader that covers the screen with a single triangle.
// The vertex positions are generated in the shader, so no vertex buffer is needed.
// We pass the vertex position through to the fragment shader.

[[stage(vertex)]]
fn main([[builtin(vertex_index)]] in_vertex_index: u32) -> [[builtin(position)]] vec4<f32> {
    const POSITIONS: array<vec2<f32>, 3> = array<vec2<f32>, 3>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>( 3.0, -1.0),
        vec2<f32>(-1.0,  3.0)
    );

    let p = POSITIONS[in_vertex_index];
    return vec4<f32>(p.x, p.y, 0.0, 1.0);
}
