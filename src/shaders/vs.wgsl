// A simple vertex shader that covers the screen with a single triangle.
// The vertex positions are generated in the shader, so no vertex buffer is needed.

@vertex
fn main(@builtin(vertex_index) in_vertex_index: u32) -> @builtin(position) vec4<f32> {
    var p: vec2<f32>;
    
    switch in_vertex_index {
        case 0u: { p = vec2<f32>(-1.0, -1.0); }
        case 1u: { p = vec2<f32>( 3.0, -1.0); }
        case 2u: { p = vec2<f32>(-1.0,  3.0); }
        default: { p = vec2<f32>(-1.0, -1.0); }
    }

    return vec4<f32>(p.x, p.y, 0.0, 1.0);
}
