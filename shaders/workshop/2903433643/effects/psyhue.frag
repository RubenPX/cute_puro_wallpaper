// [COMBO] {"material":"Cursor Shift","combo":"USECURSOR","type":"options","default":0}
// [COMBO] {"material":"Disable Flow map","combo":"DISABLEFLOWMAP","type":"options","default":0}

#include "common.h"


uniform sampler2D g_Texture0; // {"material":"framebuffer","label":"ui_editor_properties_framebuffer","hidden":true}
uniform sampler2D g_Texture1; // {"default":"util/noflow","label":"ui_editor_properties_flow_map","material":"flow","mode":"flowmask"}
uniform sampler2D g_Texture2; // {"material":"phase","label":"ui_editor_properties_time_offset"}
// uniform sampler2D g_Texture3; // {"material":"mask","label":"ui_editor_properties_opacity_mask","mode":"opacitymask","default":"util/white","combo":"MASK","paintdefaultcolor":"0 0 0 1"}
uniform sampler2D g_Texture3; // {"combo":"MASK","default":"util/white","label":"ui_editor_properties_opacity","material":"mask","mode":"opacitymask","paintdefaultcolor":"1 1 1 1"}
uniform float g_Time;
uniform vec2 g_PointerPosition;
varying vec4 v_PointerUV;


uniform float u_ShiftValue; // {"material":"1","label":"Shift Speed","default":0.2,"range":[0,2]}
uniform float u_ShiftStrength; // {"material":"2","label":"Shift Strength","default":0.01,"range":[0.01,0.2]}

uniform float g_FlowSpeed; // {"material":"speed","label":"Flow Speed","default":1,"range":[0.01, 2]}
uniform float g_FlowAmp; // {"material":"strength","label":"Flow Strength","default":1,"range":[0.01, 1]}
uniform float g_FlowPhaseScale; // {"material":"phasescale","label":"Flow Phase","default":2,"range":[0.01, 10]}


varying vec4 v_TexCoord;
varying vec2 v_Scroll;

#if AUDIOPROCESSING
varying float u_AudioShift;
#endif

#if MASK == 1
varying vec4 v_TexCoordMask;
#endif

void main() {
float flowPhase = texSample2D(g_Texture2, v_TexCoord.xy * g_FlowPhaseScale).r;
	vec2 flowColors = texSample2D(g_Texture1, v_TexCoord.zw).rg;
	vec2 flowMask = (flowColors.rg - vec2(0.498, 0.498)) * 2.0;
	float flowAmount = length(flowMask);
	
	vec4 cycles = vec4(frac(g_Time * g_FlowSpeed),
						frac(g_Time * g_FlowSpeed + 0.5),
						frac(0.25 + g_Time * g_FlowSpeed),
						frac(0.25 + g_Time * g_FlowSpeed + 0.5));
	
	float blend = 2 * abs(cycles.x - 0.5);
	float blend2 = 2 * abs(cycles.z - 0.5);
	
	cycles = cycles - CAST4(0.5);
	
	vec4 flowUVOffset = CAST4(flowMask.xyxy * g_FlowAmp * 0.1) * cycles.xxyy;
	vec4 flowUVOffset2 = CAST4(flowMask.xyxy * g_FlowAmp * 0.1) * cycles.zzww;

#if USECURSOR ==1
	float g_Time = g_PointerPosition * 10;
#endif

#if AUDIOPROCESSING
	float warp = g_Time * u_AudioShift;
#else
	float warp = g_Time * u_ShiftValue;
#endif



#if DISABLEFLOWMAP ==1
	vec4 albedo = texSample2D(g_Texture0, v_TexCoord.xy);
	float mask0 = texSample2D(g_Texture3, v_TexCoord.zw).r;
	vec3 newAlbedo = rgb2hsv(albedo.rgb);
	newAlbedo.x = frac(newAlbedo.x / u_ShiftStrength + warp);
	newAlbedo = hsv2rgb(newAlbedo);
	
	albedo.rgb = mix(albedo, newAlbedo, mask0);

	gl_FragColor = albedo;
#else
	vec4 albedo = mix(texSample2D(g_Texture0, v_TexCoord.xy + flowUVOffset.xy),
					texSample2D(g_Texture0, v_TexCoord.xy + flowUVOffset.zw),
					blend);

	vec4 flowAlbedo = mix(texSample2D(g_Texture0, v_TexCoord.xy + flowUVOffset.xy),
					texSample2D(g_Texture0, v_TexCoord.xy + flowUVOffset.zw),
					blend);
	vec4 flowAlbedo2 = mix(texSample2D(g_Texture0, v_TexCoord.xy + flowUVOffset2.xy),
					texSample2D(g_Texture0, v_TexCoord.xy + flowUVOffset2.zw),
					blend2);

	flowAlbedo.rgb = rgb2hsv(albedo.rgb);
	flowAlbedo.x = frac(flowAlbedo.x / u_ShiftStrength + warp);
	flowAlbedo.rgb = hsv2rgb(flowAlbedo.rgb);
	
	flowAlbedo2.rgb = rgb2hsv(albedo.rgb);
	flowAlbedo2.x = frac(flowAlbedo2.x / u_ShiftStrength + warp);
	flowAlbedo2.rgb = hsv2rgb(flowAlbedo2.rgb);

	flowAlbedo = mix(flowAlbedo, flowAlbedo2, smoothstep(0.2, 0.8, flowPhase));

	gl_FragColor = mix(albedo, flowAlbedo, flowAmount);
#endif

#if MASK == 1
	// Only allow sampling from mask
	float mask = texSample2D(g_Texture3, flowUVOffset * v_TexCoordMask.zw + v_TexCoordMask.xy).r;
	gl_FragColor = mix(texSample2D(g_Texture0, v_TexCoord.xy), gl_FragColor, mask);
#endif
}