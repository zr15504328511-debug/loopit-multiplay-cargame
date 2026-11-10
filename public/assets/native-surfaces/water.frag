#version 300 es
#ifdef GL_EXT_shader_texture_lod
#extension GL_EXT_shader_texture_lod : enable
#endif

precision highp float;
precision highp int;
#define HLSLCC_ENABLE_UNIFORM_BUFFERS 1
#if HLSLCC_ENABLE_UNIFORM_BUFFERS
#define UNITY_UNIFORM
#else
#define UNITY_UNIFORM uniform
#endif
#define UNITY_SUPPORTS_UNIFORM_LOCATION 0
#if UNITY_SUPPORTS_UNIFORM_LOCATION
#define UNITY_LOCATION(x) layout(location = x)
#define UNITY_BINDING(x) layout(binding = x, std140)
#else
#define UNITY_LOCATION(x)
#define UNITY_BINDING(x) layout(std140)
#endif
uniform 	vec4 _ZBufferParams;
uniform 	mediump vec4 _WorldSpaceLightPos0;
uniform 	mediump vec4 unity_SpecCube0_HDR;
uniform 	mediump vec4 _LightColor0;
uniform 	mediump vec4 _WaterColor;
uniform 	mediump vec4 _DeepColor;
uniform 	mediump vec4 _EdgeColor;
uniform 	mediump vec4 _FlowColor;
uniform 	float _DepthFactor;
uniform 	float _EdgeThickness;
uniform 	float _WaterfallDensity;
uniform 	mediump float _Glossiness;
UNITY_LOCATION(0) uniform highp sampler2D _CameraDepthTexture;
UNITY_LOCATION(1) uniform mediump samplerCube unity_SpecCube0;
in mediump  vec3 vs_TEXCOORD1;
in highp  vec4 vs_TEXCOORD2;
in mediump  vec3 vs_TEXCOORD3;
in mediump  vec2 vs_TEXCOORD4;
in mediump  vec4 vs_TEXCOORD5;
in mediump  vec3 vs_TEXCOORD6;
layout(location = 0) out mediump vec4 SV_Target0;
vec3 u_xlat0;
mediump vec3 u_xlat16_1;
mediump vec4 u_xlat16_2;
vec4 u_xlat3;
mediump vec3 u_xlat16_4;
vec4 u_xlat5;
vec3 u_xlat6;
mediump vec3 u_xlat16_7;
vec3 u_xlat8;
mediump vec3 u_xlat16_9;
float u_xlat16;
mediump float u_xlat16_17;
float u_xlat24;
mediump float u_xlat16_26;
void main()
{
    u_xlat0.x = (-_Glossiness) + 0.5;
    u_xlat0.x = vs_TEXCOORD4.x * u_xlat0.x + _Glossiness;
    u_xlat8.x = u_xlat0.x * 11.0 + -1.0;
    u_xlat0.x = (-u_xlat0.x) + 1.0;
    u_xlat16_1.x = u_xlat0.x * 6.0;
    u_xlat0.x = exp2(u_xlat8.x);
    u_xlat8.x = u_xlat0.x + 8.0;
    u_xlat0.y = u_xlat8.x * 0.0397887006;
    u_xlat16_9.xyz = vs_TEXCOORD6.xyz + _WorldSpaceLightPos0.xyz;
    u_xlat16_2.x = dot(u_xlat16_9.xyz, u_xlat16_9.xyz);
    u_xlat16_2.x = inversesqrt(u_xlat16_2.x);
    u_xlat16_9.xyz = u_xlat16_9.xyz * u_xlat16_2.xxx;
    u_xlat16_2.x = dot(vs_TEXCOORD1.xyz, vs_TEXCOORD1.xyz);
    u_xlat16_2.x = inversesqrt(u_xlat16_2.x);
    u_xlat16_2.xyz = u_xlat16_2.xxx * vs_TEXCOORD1.xyz;
    u_xlat16_9.x = dot(u_xlat16_2.xyz, u_xlat16_9.xyz);
    u_xlat16_9.x = clamp(u_xlat16_9.x, 0.0, 1.0);
    u_xlat16_9.x = log2(u_xlat16_9.x);
    u_xlat16_9.x = u_xlat0.x * u_xlat16_9.x;
    u_xlat16_9.x = exp2(u_xlat16_9.x);
    u_xlat16_17 = dot(u_xlat16_2.xyz, vs_TEXCOORD6.xyz);
    u_xlat16_17 = clamp(u_xlat16_17, 0.0, 1.0);
    u_xlat0.x = (-u_xlat16_17) + 1.0;
    u_xlat16_17 = u_xlat0.x * u_xlat0.x;
    u_xlat16_9.y = u_xlat16_17 * u_xlat16_17;
    u_xlat16_9.xy = u_xlat0.yx * u_xlat16_9.xy;
    u_xlat0.x = u_xlat16_9.y * 0.980000019 + 0.0199999996;
    u_xlat16_9.x = u_xlat0.x * u_xlat16_9.x;
    u_xlat16_9.xyz = u_xlat16_9.xxx * _LightColor0.xyz;
    u_xlat8.xy = vs_TEXCOORD2.xy / vs_TEXCOORD2.ww;
    u_xlat8.x = texture(_CameraDepthTexture, u_xlat8.xy).x;
    u_xlat8.x = _ZBufferParams.z * u_xlat8.x + _ZBufferParams.w;
    u_xlat8.x = float(1.0) / u_xlat8.x;
    u_xlat8.x = u_xlat8.x + (-vs_TEXCOORD2.w);
    u_xlat8.x = max(u_xlat8.x, 0.0);
    u_xlat16 = float(1.0) / _EdgeThickness;
    u_xlat16 = u_xlat16 * u_xlat8.x;
    u_xlat16 = clamp(u_xlat16, 0.0, 1.0);
    u_xlat8.x = u_xlat8.x * _DepthFactor;
    u_xlat8.x = clamp(u_xlat8.x, 0.0, 1.0);
    u_xlat24 = u_xlat16 * -2.0 + 3.0;
    u_xlat16 = u_xlat16 * u_xlat16;
    u_xlat16 = (-u_xlat24) * u_xlat16 + 1.0;
    u_xlat3 = (-_WaterColor) + _DeepColor;
    u_xlat3 = u_xlat8.xxxx * u_xlat3 + _WaterColor;
    u_xlat16_4.xyz = _EdgeColor.xyz + (-_FlowColor.xyz);
    u_xlat16_4.xyz = vs_TEXCOORD4.yyy * u_xlat16_4.xyz + _FlowColor.xyz;
    u_xlat5.xyz = (-u_xlat3.xyz) + u_xlat16_4.xyz;
    u_xlat8.x = vs_TEXCOORD4.x * _WaterfallDensity;
    u_xlat3.xyz = u_xlat8.xxx * u_xlat5.xyz + u_xlat3.xyz;
    u_xlat24 = max(u_xlat16, u_xlat3.w);
    u_xlat5.w = max(u_xlat8.x, u_xlat24);
    u_xlat6.xyz = (-u_xlat3.xyz) + _EdgeColor.xyz;
    u_xlat8.xyz = vec3(u_xlat16) * u_xlat6.xyz + u_xlat3.xyz;
    u_xlat16_26 = dot(u_xlat16_2.xyz, _WorldSpaceLightPos0.xyz);
    u_xlat16_26 = clamp(u_xlat16_26, 0.0, 1.0);
    u_xlat16_7.xyz = _LightColor0.xyz * vec3(u_xlat16_26) + vs_TEXCOORD3.xyz;
    u_xlat16_9.xyz = u_xlat8.xyz * u_xlat16_7.xyz + u_xlat16_9.xyz;
    u_xlat16_26 = dot((-vs_TEXCOORD6.xyz), u_xlat16_2.xyz);
    u_xlat16_26 = u_xlat16_26 + u_xlat16_26;
    u_xlat16_2.xyz = u_xlat16_2.xyz * (-vec3(u_xlat16_26)) + (-vs_TEXCOORD6.xyz);
    u_xlat16_2 = textureLod(unity_SpecCube0, u_xlat16_2.xyz, u_xlat16_1.x);
    u_xlat16_1.x = u_xlat16_2.w + -1.0;
    u_xlat16_1.x = unity_SpecCube0_HDR.w * u_xlat16_1.x + 1.0;
    u_xlat16_1.x = log2(u_xlat16_1.x);
    u_xlat16_1.x = u_xlat16_1.x * unity_SpecCube0_HDR.y;
    u_xlat16_1.x = exp2(u_xlat16_1.x);
    u_xlat16_1.x = u_xlat16_1.x * unity_SpecCube0_HDR.x;
    u_xlat16_7.xyz = u_xlat16_2.xyz * u_xlat16_1.xxx;
    u_xlat16_1.xyz = u_xlat16_7.xyz * u_xlat0.xxx + u_xlat16_9.xyz;
    u_xlat0.x = vs_TEXCOORD4.x * 0.200000003;
    u_xlat16_1.xyz = u_xlat16_4.xyz * u_xlat0.xxx + u_xlat16_1.xyz;
    u_xlat0.xyz = (-u_xlat16_1.xyz) + vs_TEXCOORD5.xyz;
    u_xlat5.xyz = vs_TEXCOORD5.www * u_xlat0.xyz + u_xlat16_1.xyz;
    SV_Target0 = u_xlat5;
    return;
}
