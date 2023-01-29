// [COMBO] {"material":"Lens type","combo":"TYPE","type":"options","default":0,"options":{"Spherical":0,"Anamorphic":1}}
// [COMBO] {"material":"Invert mask","combo":"INVERT","type":"options","default":0}

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"combo":"MASK","default":"util/white","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"1 1 1 1"}
uniform float u_distorsion; // {"material":"Distorsion 1","default":0,"range":[-1,1]}
uniform float u_radius; // {"material":"Distorsion 2","default":0,"range":[-1,1]}
uniform float u_aberration; // {"material":"Chromatic aberration","default":0,"range":[-1,1]}
uniform vec2 u_center; // {"default":"0.5 0.5","material":"Center","position":true,"range":[0,1]}
uniform float u_focusLength; // {"material":"Focus length","default":1,"range":[0,3]}
uniform float u_general; // {"material":"General","default":1,"range":[0,1]}

uniform vec4 g_Texture0Resolution;

varying vec4 v_TexCoord;

#if TYPE == 0
#define type vec2(g_Texture0Resolution.x / g_Texture0Resolution.y, 1.0)
#else
#define type 1.0
#endif

vec2 computeUV(vec2 uv, float amount, float radius){

    uv = (uv - 0.5) * type * 2.0;
    vec2 radial = 0.0, tangential = 0.0, center = (1.0 - u_center - 0.5) * u_general;

    float focusLength = 1.0 / u_focusLength;
    radial += uv * (1.0 + amount * pow(length(uv), 2.0) + radius * pow(length(uv), 4.0)) * focusLength;

    tangential.x = 2.0 * center.x * uv.x * uv.y + center.y * (length(uv) + 2.0 * uv.x * uv.x);
    tangential.y = center.x * (length(uv) + 2.0 * uv.y * uv.y) + 2.0 * center.y * uv.x * uv.y;

    return ((radial + tangential) / (type * 2.0)) + 0.5;
}

void main() {

    float offset = u_aberration * 0.1 * u_general;
    float distortion = u_distorsion * u_general;
    float radius = u_radius * u_general;

    float red = texSample2D(g_Texture0, computeUV(v_TexCoord.xy, distortion + offset, radius)).r;
    float green = texSample2D(g_Texture0, computeUV(v_TexCoord.xy, distortion, radius)).g;
    float blue = texSample2D(g_Texture0, computeUV(v_TexCoord.xy, distortion - offset, radius)).b;
    float alpha = texSample2D(g_Texture0, computeUV(v_TexCoord.xy, distortion, radius)).a;

    float mask = texSample2D(g_Texture1, v_TexCoord.xy).r;
#if INVERT
    mask = 1.0 - mask;
#endif

	gl_FragColor = lerp(texSample2D(g_Texture0, v_TexCoord.xy), vec4(red, green, blue, alpha), mask);
}