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
uniform 	mediump vec4 _GlobalDetailColor[4];
UNITY_LOCATION(0) uniform mediump sampler2D _GlobalTopNoiseTex;
UNITY_LOCATION(1) uniform mediump sampler2D _GlobalRoadTex;
UNITY_LOCATION(2) uniform highp sampler2D _StaticShadowMap;
UNITY_LOCATION(3) uniform highp sampler2DShadow hlslcc_zcmp_StaticShadowMap;
UNITY_LOCATION(4) uniform highp sampler2D _DynamicShadowMap;
UNITY_LOCATION(5) uniform highp sampler2DShadow hlslcc_zcmp_DynamicShadowMap;
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
mediump vec3 u_xlat16_2;
vec3 u_xlat3;
mediump vec3 u_xlat16_3;
mediump vec3 u_xlat16_4;
mediump vec3 u_xlat16_5;
float u_xlat6;
vec2 u_xlat7;
float u_xlat12;
float u_xlat13;
mediump float u_xlat16_13;
bool u_xlatb13;
mediump float u_xlat16_20;
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
                    u_xlat13 = textureLod(hlslcc_zcmp_StaticShadowMap, txVec0, 0.0);
                    u_xlat1.xyz = vec3(u_xlat13);
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
    u_xlat0.xy = vs_TEXCOORD0.xz * vec2(vec2(_GlobalTopTiling, _GlobalTopTiling));
    u_xlat16_0 = texture(_GlobalTopNoiseTex, u_xlat0.xy).x;
    u_xlat6 = u_xlat16_0 * _GlobalDetailColor[2].w + 1.0;
    u_xlat1.xyz = vec3(u_xlat6) * _GlobalDetailColor[2].xyz;
    u_xlat16_2.x = vs_TEXCOORD6;
    u_xlat16_2.y = 0.0;
    u_xlat16_3.xyz = texture(_GlobalRoadTex, u_xlat16_2.xy).xyz;
    u_xlat3.xyz = vec3(u_xlat16_0) * vec3(0.100000001, 0.100000001, 0.100000001) + u_xlat16_3.xyz;
    u_xlat12 = vs_TEXCOORD6 + -0.25;
    u_xlat0.x = u_xlat12 * 13.333333 + u_xlat16_0;
    u_xlat0.x = u_xlat0.x + -1.0;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat16_2.xyz = (-_GlobalDetailColor[2].xyz) * vec3(u_xlat6) + u_xlat3.xyz;
    u_xlat16_2.xyz = u_xlat0.xxx * u_xlat16_2.xyz + u_xlat1.xyz;
    u_xlat16_20 = dot(vs_TEXCOORD1.xyz, _WorldSpaceLightPos0.xyz);
    u_xlat16_20 = clamp(u_xlat16_20, 0.0, 1.0);
    u_xlatb0 = 9.99999975e-05<vs_TEXCOORD4.w;
    if(u_xlatb0){
        vec3 txVec1 = vec3(vs_TEXCOORD4.xy,vs_TEXCOORD4.z);
        u_xlat0.x = textureLod(hlslcc_zcmp_StaticShadowMap, txVec1, 0.0);
        u_xlat16_0 = u_xlat0.x;
    } else {
        u_xlat16_0 = 1.0;
    }
    u_xlat1.x = u_xlat16_0 + -1.0;
    u_xlat1.x = vs_TEXCOORD4.w * u_xlat1.x + 1.0;
    u_xlat7.xy = vs_TEXCOORD5.xy + vec2(-0.5, -0.5);
    u_xlat7.xy = -abs(u_xlat7.xy) + vec2(0.5, 0.5);
    u_xlat16_4.xy = u_xlat7.xy * _DynamicShadowEdgeFadeInvWidth.xy;
    u_xlat16_4.xy = clamp(u_xlat16_4.xy, 0.0, 1.0);
    u_xlat7.x = u_xlat16_4.x * vs_TEXCOORD5.w;
    u_xlat7.x = u_xlat16_4.y * u_xlat7.x;
    u_xlatb13 = 9.99999975e-05<u_xlat7.x;
    if(u_xlatb13){
        vec3 txVec2 = vec3(vs_TEXCOORD5.xy,vs_TEXCOORD5.z);
        u_xlat13 = textureLod(hlslcc_zcmp_DynamicShadowMap, txVec2, 0.0);
        u_xlat16_13 = u_xlat13;
    } else {
        u_xlat16_13 = 1.0;
    }
    u_xlat3.x = u_xlat16_13 + -1.0;
    u_xlat3.x = u_xlat7.x * u_xlat3.x + 1.0;
    u_xlat16_4.x = u_xlat1.x * u_xlat3.x;
    u_xlat16_20 = u_xlat16_20 * u_xlat16_4.x;
    u_xlat16_4.xyz = _LightColor0.xyz * vec3(u_xlat16_20) + vs_TEXCOORD2.xyz;
    u_xlat16_5.xyz = u_xlat16_2.xyz * u_xlat16_4.xyz;
    u_xlat3.xyz = (-u_xlat16_2.xyz) * u_xlat16_4.xyz + vs_TEXCOORD3.xyz;
    u_xlat3.xyz = vs_TEXCOORD3.www * u_xlat3.xyz + u_xlat16_5.xyz;
    SV_Target0.xyz = u_xlat3.xyz;
    SV_Target0.w = 1.0;
    return;
}
