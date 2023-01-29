#include "common.h"

varying vec4 v_TexCoord;

uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"default":"util/white","label":"ui_editor_properties_opacity_mask","material":"mask","mode":"opacitymask","paintdefaultcolor":"0 0 0 1"}

uniform float g_Time;
uniform float u_userSpeed; // {"material":"Speed","default":1,"range":[0,01]}


void main() {
	vec4 albedo = texSample2D(g_Texture0, v_TexCoord.xy);
    float mask = texSample2D(g_Texture1, v_TexCoord.zw).r;
	
	vec3 newAlbedo = rgb2hsv(albedo.rgb);
	newAlbedo.x = frac(newAlbedo.x + g_Time * u_userSpeed);
	newAlbedo = hsv2rgb(newAlbedo);
	albedo.rgb = mix(albedo, newAlbedo, mask);

	gl_FragColor = albedo;


}