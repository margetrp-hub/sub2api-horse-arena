"""Render the existing miniature in Blender, keeping the source GLB editable.

Run with Blender 4.5+: blender --background --factory-startup --python this.py
  -- --source output/blender/haolema-20261008/workstation-source.glb
     --output output/blender/haolema-20261008 --samples 64 --width 1600
"""

import argparse
import json
import sys
from pathlib import Path

import bpy
from mathutils import Vector


def args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--samples", type=int, default=64)
    parser.add_argument("--width", type=int, default=1600)
    parser.add_argument("--detail", action="store_true")
    return parser.parse_args(sys.argv[sys.argv.index("--") + 1:])


def linear(hex_color):
    values = [int(hex_color[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4 for v in values)


def color_matches(value, candidates):
    return any(max(abs(value[i] - linear(c)[i]) for i in range(3)) < 0.009 for c in candidates)


def finish_materials():
    for material in bpy.data.materials:
        if not material.use_nodes:
            continue
        nodes = material.node_tree.nodes
        links = material.node_tree.links
        bsdf = next((node for node in nodes if node.type == "BSDF_PRINCIPLED"), None)
        if "CRT_Game" in material.name:
            # Imported unlit imagery already has an emission shader. Keep the
            # exact source colours, without a light-dependent diffuse multiplier.
            material["finish"] = "Full 4:3 game image; emission display"
            continue
        if bsdf is None:
            continue
        base = tuple(bsdf.inputs["Base Color"].default_value[:3])
        bsdf.inputs["Specular IOR Level"].default_value = 0.3
        bsdf.inputs["Roughness"].default_value = 0.58
        if bsdf.inputs["Base Color"].is_linked:
            bsdf.inputs["Roughness"].default_value = 0.77
            continue
        if color_matches(base, ["c8874d", "e6b978", "cd8d80", "f2dfb6"]):
            material["finish"] = "Soft painted character resin"
            bsdf.inputs["Roughness"].default_value = 0.43
            bsdf.inputs["Subsurface Weight"].default_value = 0.045
            bsdf.inputs["Subsurface Radius"].default_value = (0.6, 0.3, 0.18)
            bsdf.inputs["Subsurface Scale"].default_value = 0.07
            bsdf.inputs["Coat Weight"].default_value = 0.08
            bsdf.inputs["Coat Roughness"].default_value = 0.36
        elif color_matches(base, ["d6cfb3", "f0e7cd", "b8b9a3", "d7d3bd", "f0e7ce"]):
            material["finish"] = "Warm ABS plastic"
            bsdf.inputs["Roughness"].default_value = 0.34
            bsdf.inputs["Coat Weight"].default_value = 0.1
            bsdf.inputs["Coat Roughness"].default_value = 0.27
        elif color_matches(base, ["f4eedc", "e8ddbd", "386a62", "414f3d"]):
            material["finish"] = "Matte woven clothing"
            bsdf.inputs["Roughness"].default_value = 0.8
            bsdf.inputs["Sheen Weight"].default_value = 0.18
            noise = nodes.new("ShaderNodeTexNoise")
            noise.inputs["Scale"].default_value = 175
            noise.inputs["Detail"].default_value = 2
            bump = nodes.new("ShaderNodeBump")
            bump.inputs["Strength"].default_value = 0.12
            bump.inputs["Distance"].default_value = 0.008
            links.new(noise.outputs["Fac"], bump.inputs["Height"])
            links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
        elif color_matches(base, ["b67745", "d0a16c", "b68963", "bd8e61", "c88e59", "b57c4a"]):
            material["finish"] = "Satin wood with subtle grain"
            bsdf.inputs["Roughness"].default_value = 0.48
            tex = nodes.new("ShaderNodeTexCoord")
            mapping = nodes.new("ShaderNodeVectorMath")
            mapping.operation = "MULTIPLY"
            mapping.inputs[1].default_value = (2.5, 35, 4)
            noise = nodes.new("ShaderNodeTexNoise")
            noise.inputs["Scale"].default_value = 2.0
            noise.inputs["Detail"].default_value = 2.0
            ramp = nodes.new("ShaderNodeValToRGB")
            ramp.color_ramp.elements[0].position = 0.1
            ramp.color_ramp.elements[0].color = tuple(v * 0.85 for v in base) + (1,)
            ramp.color_ramp.elements[1].position = 0.9
            ramp.color_ramp.elements[1].color = tuple(min(1, v * 1.07) for v in base) + (1,)
            links.new(tex.outputs["Generated"], mapping.inputs[0])
            links.new(mapping.outputs["Vector"], noise.inputs["Vector"])
            links.new(noise.outputs["Fac"], ramp.inputs["Fac"])
            links.new(ramp.outputs["Color"], bsdf.inputs["Base Color"])
        elif color_matches(base, ["bc9462", "b38d51"]):
            material["finish"] = "Brushed brass"
            bsdf.inputs["Metallic"].default_value = 0.62
            bsdf.inputs["Roughness"].default_value = 0.34
        elif color_matches(base, ["242723", "19241f", "fff8e5"]):
            bsdf.inputs["Roughness"].default_value = 0.24
        elif color_matches(base, ["448a83", "36726e"]):
            material["finish"] = "Satin chair upholstery"
            bsdf.inputs["Roughness"].default_value = 0.53
            bsdf.inputs["Sheen Weight"].default_value = 0.12


def look_at(obj, target):
    obj.rotation_euler = (Vector(target) - obj.location).to_track_quat("-Z", "Y").to_euler()


def area(name, location, target, energy, size, color):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = energy
    data.shape = "DISK"
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(obj)
    obj.location = location
    look_at(obj, target)
    return obj


def configure_scene(options):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(options.source.resolve()))
    scene = bpy.context.scene
    for obj in list(bpy.data.objects):
        if obj.type == "LIGHT" or "Baked_Contact_Shadow" in obj.name:
            bpy.data.objects.remove(obj, do_unlink=True)
    finish_materials()

    # Blender uses Z up; the source glTF uses Y up. The importer performs that
    # conversion before we place this studio ground, camera and lights.
    bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.535))
    ground = bpy.context.object
    ground.name = "Studio floor"
    mat = bpy.data.materials.new("Studio / warm ivory")
    mat.diffuse_color = (*linear("e2ddcb"), 1)
    mat.use_nodes = True
    shader = mat.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = mat.diffuse_color
    shader.inputs["Roughness"].default_value = 0.86
    ground.data.materials.append(mat)

    world = bpy.data.worlds.new("Studio ambient")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs["Color"].default_value = (0.74, 0.82, 1.0, 1)
    world.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.28
    scene.world = world
    area("Key / large warm softbox", (-4.5, -6.5, 10), (0, 0, 1.0), 1450, 5.0, (1.0, 0.89, 0.73))
    area("Fill / cool bounce", (6, -3, 6), (0, 0, 1.5), 600, 6.0, (0.76, 0.88, 1.0))
    area("Rim / overhead", (0, 4.0, 8), (0, 0, 1.5), 900, 4.0, (1.0, 0.94, 0.8))
    area("Pendant / practical", (0.2, 0.75, 3.64), (0.2, 0.75, 0), 28, 0.65, (1.0, 0.66, 0.34))

    camera_data = bpy.data.cameras.new("Blender hero orthographic")
    camera = bpy.data.objects.new("Blender hero orthographic", camera_data)
    scene.collection.objects.link(camera)
    reference = bpy.data.objects.get("ReferenceCamera")
    if reference:
        camera.matrix_world = reference.matrix_world.copy()
    else:
        camera.location = (5.4, -13, 7.5)
        look_at(camera, (0, 0, 1.7))
    camera_data.type = "ORTHO"
    camera_data.ortho_scale = 10.55
    camera_data.lens = 50
    camera_data.clip_end = 500
    scene.camera = camera
    scene.render.engine = "CYCLES"
    scene.cycles.samples = options.samples
    scene.cycles.use_denoising = True
    scene.cycles.adaptive_threshold = 0.025
    scene.cycles.max_bounces = 7
    scene.cycles.diffuse_bounces = 3
    scene.cycles.glossy_bounces = 4
    devices = []
    prefs = bpy.context.preferences.addons["cycles"].preferences
    for backend in ("CUDA", "OPTIX", "HIP", "ONEAPI"):
        try:
            prefs.compute_device_type = backend
            prefs.get_devices()
            gpu = [device for device in prefs.devices if device.type == backend]
            if gpu:
                for device in prefs.devices:
                    device.use = device.type == backend
                scene.cycles.device = "GPU"
                devices = [device.name for device in gpu]
                break
        except (TypeError, RuntimeError):
            continue
    if not devices:
        scene.cycles.device = "CPU"
        devices = ["CPU"]
    scene.render.resolution_x = options.width
    scene.render.resolution_y = round(options.width * 0.82)
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.film_transparent = False
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.view_settings.exposure = 0.15
    scene.render.use_file_extension = True
    scene["source"] = str(options.source.name)
    scene["purpose"] = "Haolema Blender material and lighting study; static work/inspection pose"
    bpy.ops.file.pack_all()

    # Opening the .blend immediately presents the composed shot.
    for screen in bpy.data.screens:
        for space_area in screen.areas:
            if space_area.type == "VIEW_3D":
                space_area.spaces.active.region_3d.view_perspective = "CAMERA"
    return scene, devices


def main():
    options = args()
    options.output.mkdir(parents=True, exist_ok=True)
    scene, devices = configure_scene(options)
    scene.render.filepath = str((options.output / "blender-workstation.png").resolve())
    blend_path = options.output / "haolema-workstation.blend"
    bpy.ops.wm.save_as_mainfile(filepath=str(blend_path.resolve()))
    bpy.ops.render.render(write_still=True)
    report = {
        "blender": bpy.app.version_string,
        "engine": scene.render.engine,
        "devices": devices,
        "samples": scene.cycles.samples,
        "resolution": [scene.render.resolution_x, scene.render.resolution_y],
        "objects": len(bpy.data.objects),
        "meshes": len(bpy.data.meshes),
        "packed_images": sum(bool(image.packed_file) for image in bpy.data.images),
        "source_glb": options.source.name,
        "blend": blend_path.name,
        "render": Path(scene.render.filepath).name,
        "scope": "Editable Blender study; web runtime unchanged; static pose, not a new rig",
    }
    if options.detail:
        scene.camera.location = (5.4, -12.5, 7.0)
        look_at(scene.camera, (0.02, 0.0, 1.75))
        scene.camera.data.ortho_scale = 6.8
        scene.render.resolution_x = options.width
        scene.render.resolution_y = round(options.width * 0.76)
        scene.render.filepath = str((options.output / "blender-workstation-detail.png").resolve())
        bpy.ops.render.render(write_still=True)
        report["detail_render"] = Path(scene.render.filepath).name
    (options.output / "blender-render-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("HAOLEMA_BLENDER_COMPLETE " + json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
