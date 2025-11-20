use web_sys::HtmlCanvasElement;
use wgpu::util::DeviceExt;

include!(concat!(env!("OUT_DIR"), "/shaders.rs"));

#[repr(C)]
#[derive(Debug, Copy, Clone, bytemuck::Pod, bytemuck::Zeroable)]
struct Uniforms {
    time: f32,
    _pad0: [u32; 3],
    _padding1: [f32; 3],
    _pad1: [u32; 1],
    mouse: [f32; 2],
    _padding2: [f32; 2],
    resolution: [f32; 2],
    _padding3: [f32; 2],
    _extra_padding1: [f32; 4],
    _extra_padding2: [f32; 4],
    _extra_padding3: [f32; 4],
    _extra_padding4: [f32; 4],
    _extra_padding5: [f32; 4],
}

use std::collections::HashMap;

pub struct State {
    surface: wgpu::Surface<'static>,
    device: wgpu::Device,
    queue: wgpu::Queue,
    config: wgpu::SurfaceConfiguration,
    pub size: (u32, u32),
    render_pipelines: HashMap<String, wgpu::RenderPipeline>,
    active_pipeline: String,
    uniforms: Uniforms,
    uniform_buffer: wgpu::Buffer,
    uniform_bind_group: wgpu::BindGroup,
}

impl State {
    pub async fn new(canvas: HtmlCanvasElement) -> Self {
        let size = (canvas.width(), canvas.height());
        web_sys::console::log_2(&"Canvas size:".into(), &format!("{}x{}", size.0, size.1).into());

        let instance = wgpu::Instance::new(wgpu::InstanceDescriptor {
            backends: wgpu::Backends::all(),
            ..Default::default()
        });

        let surface = instance.create_surface(wgpu::SurfaceTarget::Canvas(canvas)).unwrap();

        let adapter = instance
            .request_adapter(&wgpu::RequestAdapterOptions {
                power_preference: wgpu::PowerPreference::default(),
                compatible_surface: Some(&surface),
                force_fallback_adapter: false,
            })
            .await
            .unwrap();

        let (device, queue) = adapter
            .request_device(
                &wgpu::DeviceDescriptor {
                    label: None,
                    required_features: wgpu::Features::empty(),
                    required_limits: wgpu::Limits::downlevel_webgl2_defaults(),
                },
                None,
            )
            .await
            .unwrap();

        let surface_caps = surface.get_capabilities(&adapter);
        let surface_format = surface_caps
            .formats
            .iter()
            .copied()
            .find(|f| f.is_srgb())
            .unwrap_or(surface_caps.formats[0]);

        let config = wgpu::SurfaceConfiguration {
            usage: wgpu::TextureUsages::RENDER_ATTACHMENT,
            format: surface_format,
            width: size.0,
            height: size.1,
            present_mode: surface_caps.present_modes.iter().copied().find(|&p| p == wgpu::PresentMode::Mailbox).unwrap_or(wgpu::PresentMode::Fifo),
            alpha_mode: surface_caps.alpha_modes[0],
            view_formats: vec![],
            desired_maximum_frame_latency: 2,
        };
        surface.configure(&device, &config);

        let uniforms = Uniforms {
            time: 0.0,
            mouse: [0.0, 0.0],
            resolution: [size.0 as f32, size.1 as f32],
            _pad0: [0; 3],
            _padding1: [0.0; 3],
            _pad1: [0; 1],
            _padding2: [0.0; 2],
            _padding3: [0.0; 2],
            _extra_padding1: [0.0; 4],
            _extra_padding2: [0.0; 4],
            _extra_padding3: [0.0; 4],
            _extra_padding4: [0.0; 4],
            _extra_padding5: [0.0; 4],
        };

        let uniform_buffer = device.create_buffer_init(&wgpu::util::BufferInitDescriptor {
            label: Some("Uniform Buffer"),
            contents: bytemuck::cast_slice(&[uniforms]),
            usage: wgpu::BufferUsages::UNIFORM | wgpu::BufferUsages::COPY_DST,
        });

        let uniform_bind_group_layout =
            device.create_bind_group_layout(&wgpu::BindGroupLayoutDescriptor {
                entries: &[wgpu::BindGroupLayoutEntry {
                    binding: 0,
                    visibility: wgpu::ShaderStages::FRAGMENT,
                    ty: wgpu::BindingType::Buffer {
                        ty: wgpu::BufferBindingType::Uniform,
                        has_dynamic_offset: false,
                        min_binding_size: None,
                    },
                    count: None,
                }],
                label: Some("uniform_bind_group_layout"),
            });

        let uniform_bind_group = device.create_bind_group(&wgpu::BindGroupDescriptor {
            layout: &uniform_bind_group_layout,
            entries: &[wgpu::BindGroupEntry {
                binding: 0,
                resource: uniform_buffer.as_entire_binding(),
            }],
            label: Some("uniform_bind_group"),
        });

        let render_pipeline_layout =
            device.create_pipeline_layout(&wgpu::PipelineLayoutDescriptor {
                label: Some("Render Pipeline Layout"),
                bind_group_layouts: &[&uniform_bind_group_layout],
                push_constant_ranges: &[],
            });

        let mut render_pipelines = HashMap::new();

        let vs_source = SHADER_SOURCES
            .iter()
            .find(|(name, _)| *name == "vs")
            .map(|(_, source)| *source)
            .expect("vs.wgsl not found");

        let vs_module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
            label: Some("Vertex Shader"),
            source: wgpu::ShaderSource::Wgsl(vs_source.into()),
        });

        for (name, source) in SHADER_SOURCES.iter().filter(|(name, _)| *name != "vs") {
            let fs_module = device.create_shader_module(wgpu::ShaderModuleDescriptor {
                label: Some(&format!("{} Fragment Shader", name)),
                source: wgpu::ShaderSource::Wgsl((*source).into()),
            });

            let pipeline = device.create_render_pipeline(&wgpu::RenderPipelineDescriptor {
                label: Some(&format!("{} Render Pipeline", name)),
                layout: Some(&render_pipeline_layout),
                vertex: wgpu::VertexState {
                    module: &vs_module,
                    entry_point: "main",
                    compilation_options: wgpu::PipelineCompilationOptions::default(),
                    buffers: &[],
                },
                fragment: Some(wgpu::FragmentState {
                    module: &fs_module,
                    entry_point: "main",
                    compilation_options: wgpu::PipelineCompilationOptions::default(),
                    targets: &[Some(wgpu::ColorTargetState {
                        format: config.format,
                        blend: Some(wgpu::BlendState::REPLACE),
                        write_mask: wgpu::ColorWrites::ALL,
                    })],
                }),
                primitive: wgpu::PrimitiveState {
                    topology: wgpu::PrimitiveTopology::TriangleList,
                    ..Default::default()
                },
                depth_stencil: None,
                multisample: wgpu::MultisampleState::default(),
                multiview: None,
            });
            render_pipelines.insert(name.to_string(), pipeline);
        }

        let mut shader_names: Vec<String> = render_pipelines.keys().cloned().collect();
        shader_names.sort();
        let active_pipeline = shader_names.first().cloned().unwrap_or_default();
        
        web_sys::console::log_2(&"Available shaders:".into(), &format!("{:?}", shader_names).into());
        web_sys::console::log_2(&"Default shader set to:".into(), &active_pipeline.clone().into());

        Self {
            surface,
            device,
            queue,
            config,
            size,
            render_pipelines,
            active_pipeline,
            uniforms,
            uniform_buffer,
            uniform_bind_group,
        }
    }

    pub fn set_pipeline(&mut self, name: &str) {
        if self.render_pipelines.contains_key(name) {
            self.active_pipeline = name.to_string();
        }
    }

    pub fn resize(&mut self, new_size: (u32, u32)) {
        if new_size.0 > 0 && new_size.1 > 0 {
            self.size = new_size;
            self.config.width = new_size.0;
            self.config.height = new_size.1;
            self.surface.configure(&self.device, &self.config);
            self.uniforms.resolution = [new_size.0 as f32, new_size.1 as f32];
        }
    }

    pub fn update(&mut self, time: f32, mouse: [f32; 2]) {
        self.uniforms.time = time;
        self.uniforms.mouse = mouse;
        self.queue.write_buffer(&self.uniform_buffer, 0, bytemuck::cast_slice(&[self.uniforms]));
    }

    pub fn render(&mut self) -> Result<(), wgpu::SurfaceError> {
        let output = self.surface.get_current_texture()?;
        let view = output
            .texture
            .create_view(&wgpu::TextureViewDescriptor::default());
        let mut encoder = self
            .device
            .create_command_encoder(&wgpu::CommandEncoderDescriptor {
                label: Some("Render Encoder"),
            });

        {
            let mut render_pass = encoder.begin_render_pass(&wgpu::RenderPassDescriptor {
                label: Some("Render Pass"),
                color_attachments: &[Some(wgpu::RenderPassColorAttachment {
                    view: &view,
                    resolve_target: None,
                    ops: wgpu::Operations {
                        load: wgpu::LoadOp::Clear(wgpu::Color::BLACK),
                        store: wgpu::StoreOp::Store,
                    },
                })],
                depth_stencil_attachment: None,
                timestamp_writes: None,
                occlusion_query_set: None,
            });

            if let Some(pipeline) = self.render_pipelines.get(&self.active_pipeline) {
                render_pass.set_pipeline(pipeline);
                render_pass.set_bind_group(0, &self.uniform_bind_group, &[]);
                render_pass.draw(0..3, 0..1);
            }
        }

        self.queue.submit(std::iter::once(encoder.finish()));
        output.present();

        Ok(())
    }

    pub fn get_shader_names(&self) -> Vec<String> {
        let mut names: Vec<String> = self.render_pipelines.keys().cloned().collect();
        names.sort();
        names
    }

    pub fn get_active_shader(&self) -> String {
        self.active_pipeline.clone()
    }
}
