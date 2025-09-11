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

// Note: The following functions (rand, noise, fbm, pattern) are no longer
// called by the new main function but are kept from the original shader.
fn rand(n: vec2<f32>) -> f32 {
    return fract(sin(dot(n, vec2<f32>(12.9898, 4.1414))) * 43758.5453);
}

fn noise(p: vec2<f32>) -> f32 {
    let ip = floor(p);
    var u = fract(p);
    u = u*u*(3.0-2.0*u);

    let res = mix(
        mix(rand(ip),rand(ip+vec2<f32>(1.0,0.0)),u.x),
        mix(rand(ip+vec2<f32>(0.0,1.0)),rand(ip+vec2<f32>(1.0,1.0)),u.x),u.y);
    return res*res;
}

fn fbm(p_in: vec2<f32>) -> f32 {
    let mtx = mat2x2<f32>( 0.80,  0.60, -0.60,  0.80 );
    var p = p_in;
    var f = 0.0;

    f = f + 0.500000*noise( p + uniforms.time  ); p = mtx*p*2.02;
    f = f + 0.031250*noise( p ); p = mtx*p*2.01;
    f = f + 0.250000*noise( p ); p = mtx*p*2.03;
    f = f + 0.125000*noise( p ); p = mtx*p*2.01;
    f = f + 0.062500*noise( p ); p = mtx*p*2.04;
    f = f + 0.015625*noise( p + sin(uniforms.time) );

    return f/0.96875;
}

fn pattern(p: vec2<f32>) -> f32 {
    return fbm( p + fbm( p + fbm( p ) ) );
}


// This is the translated main function, now monochromatic.
@fragment
fn main(@builtin(position) frag_coord: vec4<f32>) -> @location(0) vec4<f32> {
    var uv = (2.0 * frag_coord.xy - uniforms.resolution.xy) / min(uniforms.resolution.x, uniforms.resolution.y);

    for (var i: f32 = 1.0; i < 8.0; i = i + 1.0) {
        uv.y = uv.y + 0.1 * sin(uv.x * i * i + uniforms.time * 0.5) * sin(uv.y * i * i + uniforms.time * 0.5);
    }

    // Original color calculation (now commented out for monochromatic)
    // let col = vec3<f32>(
    //     uv.y - 0.1,
    //     uv.y + 0.3,
    //     uv.y + 0.95
    // );
    
    // Convert to monochromatic:
    // We'll just take one of the components or an average to get a single shade value.
    // Here, I'm using uv.y + 0.3 as a base for the shade. You can adjust this.
    let shade: f32 = uv.y + 0.3; // Or (uv.y - 0.1 + uv.y + 0.3 + uv.y + 0.95) / 3.0; for average
    
    return vec4<f32>(shade, shade, shade, 1.0);
}
