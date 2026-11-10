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
uniform 	mediump vec4 _WorldSpaceLightPos0;
uniform 	mediump vec4 _LightColor0;
uniform 	vec4 hlslcc_mtx4x4_StaticShadowMatrix[4];
uniform 	float _StaticShadowDebugMode;
uniform 	vec2 _DynamicShadowEdgeFadeInvWidth;
uniform 	float _GlobalTopTiling;
uniform 	mediump vec4 _GlobalRoadColor1;
uniform 	mediump vec4 _GlobalRoadColor2;
uniform 	mediump vec4 _GlobalCurbColor1;
uniform 	mediump vec4 _GlobalCurbColor2;
uniform 	float _FinishDistance;
uniform 	float _GlobalCurbTiling;
UNITY_LOCATION(0) uniform mediump sampler2D _GlobalTopNoiseTex;
UNITY_LOCATION(1) uniform highp sampler2D _StaticShadowMap;
UNITY_LOCATION(2) uniform highp sampler2DShadow hlslcc_zcmp_StaticShadowMap;
UNITY_LOCATION(3) uniform highp sampler2D _DynamicShadowMap;
UNITY_LOCATION(4) uniform highp sampler2DShadow hlslcc_zcmp_DynamicShadowMap;
in highp  vec3 vs_TEXCOORD0;
in mediump  float vs_TEXCOORD6;
in mediump  vec3 vs_TEXCOORD1;
in mediump  vec3 vs_TEXCOORD2;
in mediump  vec4 vs_TEXCOORD3;
in highp  vec4 vs_TEXCOORD4;
in highp  vec4 vs_TEXCOORD5;
layout(location = 0) out mediump vec4 SV_Target0;
vec3 u_xlat0;
mediump float u_xlat16_0;
bool u_xlatb0;
vec4 u_xlat1;
mediump float u_xlat16_1;
bool u_xlatb1;
mediump vec3 u_xlat16_2;
mediump vec3 u_xlat16_3;
vec2 u_xlat4;
mediump vec3 u_xlat16_5;
vec3 u_xlat6;
float u_xlat8;
mediump vec2 u_xlat16_10;
vec2 u_xlat11;
vec2 u_xlat14;
bool u_xlatb14;
float u_xlat15;
float u_xlat18;
mediump float u_xlat16_18;
bool u_xlatb18;
float u_xlat22;
mediump float u_xlat16_23;
mediump float u_xlat16_24;
void main()
{
    u_xlatb0 = 0.5<_StaticShadowDebugMode;
    if(u_xlatb0){
        u_xlat0.xyz = vs_TEXCOORD0.yyy * hlslcc_mtx4x4_StaticShadowMatrix[1].xyz;
        u_xlat0.xyz = hlslcc_mtx4x4_StaticShadowMatrix[0].xyz * vs_TEXCOORD0.xxx + u_xlat0.xyz;
        u_xlat0.xyz = hlslcc_mtx4x4_StaticShadowMatrix[2].xyz * vs_TEXCOORD0.zzz + u_xlat0.xyz;
        u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4_StaticShadowMatrix[3].xyz;
        u_xlat1.xyw = u_xlat0.xyz * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);
        u_xlat0.x = max(abs(u_xlat0.y), abs(u_xlat0.x));
        u_xlatb0 = 1.0>=u_xlat0.x;
        if(u_xlatb0){
            u_xlatb0 = _StaticShadowDebugMode>=1.5;
            if(u_xlatb0){
                u_xlatb0 = _StaticShadowDebugMode>=2.5;
                if(u_xlatb0){
                    vec3 txVec0 = vec3(u_xlat1.xy,u_xlat1.w);
                    u_xlat15 = textureLod(hlslcc_zcmp_StaticShadowMap, txVec0, 0.0);
                    u_xlat1.xyz = vec3(u_xlat15);
                } else {
                    u_xlat1.xyz = u_xlat1.www;
                }
            } else {
                u_xlat1.z = 0.0;
            }
        } else {
            u_xlat1.x = float(1.0);
            u_xlat1.y = float(0.0);
            u_xlat1.z = float(1.0);
        }
        SV_Target0.xyz = u_xlat1.xyz;
        SV_Target0.w = 1.0;
        return;
    }
    u_xlat0.y = vs_TEXCOORD0.z + (-_FinishDistance);
    u_xlatb14 = abs(u_xlat0.y)<2.0;
    if(u_xlatb14){
        u_xlat0.x = vs_TEXCOORD0.x;
        u_xlat0.xy = u_xlat0.xy * vec2(0.25, 0.200000003) + vec2(0.0, 0.5);
        u_xlat14.xy = dFdx(u_xlat0.xy);
        u_xlat1.xy = dFdy(u_xlat0.xy);
        u_xlat14.xy = abs(u_xlat14.xy) + abs(u_xlat1.xy);
        u_xlat0.xy = fract(u_xlat0.xy);
        u_xlat0.xy = u_xlat0.xy + vec2(-0.5, -0.5);
        u_xlat14.xy = vec2(0.5, 0.5) / u_xlat14.xy;
        u_xlat0.xy = u_xlat0.xy * u_xlat14.xy + vec2(0.5, 0.5);
        u_xlat0.xy = clamp(u_xlat0.xy, 0.0, 1.0);
        u_xlat16_2.x = (-u_xlat0.y) + u_xlat0.x;
        u_xlat16_2.xyz = abs(u_xlat16_2.xxx);
    } else {
        u_xlat0.xy = vs_TEXCOORD0.xz * vec2(vec2(_GlobalTopTiling, _GlobalTopTiling));
        u_xlat16_0 = texture(_GlobalTopNoiseTex, u_xlat0.xy).x;
        u_xlat16_23 = abs(vs_TEXCOORD6);
        u_xlat1.x = (-vs_TEXCOORD6) + 1.0;
        u_xlat16_3.xyz = (-_GlobalRoadColor1.xyz) + _GlobalRoadColor2.xyz;
        u_xlat16_3.xyz = vec3(u_xlat16_0) * u_xlat16_3.xyz + _GlobalRoadColor1.xyz;
        u_xlat16_24 = u_xlat1.x * u_xlat1.x;
        u_xlat16_24 = u_xlat16_24 * u_xlat16_24;
        u_xlat1.xyz = (-vec3(u_xlat16_24)) * vec3(0.200000003, 0.200000003, 0.200000003) + u_xlat16_3.xyz;
        u_xlat16_3.x = dFdx(u_xlat16_23);
        u_xlat16_10.x = dFdy(u_xlat16_23);
        u_xlat16_3.x = abs(u_xlat16_10.x) + abs(u_xlat16_3.x);
        u_xlat22 = max(u_xlat16_3.x, 0.00100000005);
        u_xlat4.xy = (-vec2(u_xlat16_23)) + vec2(0.462500006, 0.449999988);
        u_xlat4.xy = u_xlat4.xy / vec2(u_xlat22);
        u_xlat4.xy = u_xlat4.xy + vec2(0.5, 0.5);
        u_xlat4.xy = clamp(u_xlat4.xy, 0.0, 1.0);
        u_xlat16_3.xyz = (-u_xlat1.xyz) + vec3(1.0, 1.0, 1.0);
        u_xlat16_3.xyz = u_xlat4.xxx * u_xlat16_3.xyz + u_xlat1.xyz;
        u_xlat1.x = vs_TEXCOORD0.z * _GlobalCurbTiling;
        u_xlat16_24 = dFdx(u_xlat1.x);
        u_xlat16_5.x = dFdy(u_xlat1.x);
        u_xlat16_24 = abs(u_xlat16_24) + abs(u_xlat16_5.x);
        u_xlat8 = max(u_xlat16_24, 0.00100000005);
        u_xlat16_24 = fract(u_xlat1.x);
        u_xlat1.x = u_xlat16_24 + -0.5;
        u_xlat1.x = abs(u_xlat1.x) + -0.25;
        u_xlat1.x = u_xlat1.x / u_xlat8;
        u_xlat1.x = u_xlat1.x + 0.5;
        u_xlat1.x = clamp(u_xlat1.x, 0.0, 1.0);
        u_xlat8 = u_xlat8 + -0.25;
        u_xlat8 = u_xlat8 + u_xlat8;
        u_xlat8 = clamp(u_xlat8, 0.0, 1.0);
        u_xlat15 = (-u_xlat1.x) + 0.5;
        u_xlat1.x = u_xlat8 * u_xlat15 + u_xlat1.x;
        u_xlat16_5.xyz = (-_GlobalCurbColor1.xyz) + _GlobalCurbColor2.xyz;
        u_xlat16_5.xyz = u_xlat1.xxx * u_xlat16_5.xyz + _GlobalCurbColor1.xyz;
        u_xlat16_5.xyz = (-u_xlat16_3.xyz) + u_xlat16_5.xyz;
        u_xlat16_2.xyz = u_xlat4.yyy * u_xlat16_5.xyz + u_xlat16_3.xyz;
    }
    u_xlat16_3.x = dot(vs_TEXCOORD1.xyz, _WorldSpaceLightPos0.xyz);
    u_xlat16_3.x = clamp(u_xlat16_3.x, 0.0, 1.0);
    u_xlatb1 = 9.99999975e-05<vs_TEXCOORD4.w;
    if(u_xlatb1){
        vec3 txVec1 = vec3(vs_TEXCOORD4.xy,vs_TEXCOORD4.z);
        u_xlat1.x = textureLod(hlslcc_zcmp_StaticShadowMap, txVec1, 0.0);
        u_xlat16_1 = u_xlat1.x;
    } else {
        u_xlat16_1 = 1.0;
    }
    u_xlat4.x = u_xlat16_1 + -1.0;
    u_xlat4.x = vs_TEXCOORD4.w * u_xlat4.x + 1.0;
    u_xlat11.xy = vs_TEXCOORD5.xy + vec2(-0.5, -0.5);
    u_xlat11.xy = -abs(u_xlat11.xy) + vec2(0.5, 0.5);
    u_xlat16_10.xy = u_xlat11.xy * _DynamicShadowEdgeFadeInvWidth.xy;
    u_xlat16_10.xy = clamp(u_xlat16_10.xy, 0.0, 1.0);
    u_xlat11.x = u_xlat16_10.x * vs_TEXCOORD5.w;
    u_xlat11.x = u_xlat16_10.y * u_xlat11.x;
    u_xlatb18 = 9.99999975e-05<u_xlat11.x;
    if(u_xlatb18){
        vec3 txVec2 = vec3(vs_TEXCOORD5.xy,vs_TEXCOORD5.z);
        u_xlat18 = textureLod(hlslcc_zcmp_DynamicShadowMap, txVec2, 0.0);
        u_xlat16_18 = u_xlat18;
    } else {
        u_xlat16_18 = 1.0;
    }
    u_xlat6.x = u_xlat16_18 + -1.0;
    u_xlat6.x = u_xlat11.x * u_xlat6.x + 1.0;
    u_xlat16_10.x = u_xlat4.x * u_xlat6.x;
    u_xlat16_3.x = u_xlat16_10.x * u_xlat16_3.x;
    u_xlat16_3.xyz = _LightColor0.xyz * u_xlat16_3.xxx + vs_TEXCOORD2.xyz;
    u_xlat16_5.xyz = u_xlat16_2.xyz * u_xlat16_3.xyz;
    u_xlat6.xyz = (-u_xlat16_2.xyz) * u_xlat16_3.xyz + vs_TEXCOORD3.xyz;
    u_xlat6.xyz = vs_TEXCOORD3.www * u_xlat6.xyz + u_xlat16_5.xyz;
    SV_Target0.xyz = u_xlat6.xyz;
    SV_Target0.w = 1.0;
    return;
}
