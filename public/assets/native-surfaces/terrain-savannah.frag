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
uniform 	float _GlobalSideTiling;
uniform 	vec2 _SDFCenterXZ;
uniform 	vec2 _SDFSizeXZ;
uniform 	mediump vec4 _GlobalDetailColor[4];
uniform 	mediump vec4 _GlobalRoadColor1;
uniform 	mediump vec4 _GlobalRoadColor2;
uniform 	float _FinishDistance;
UNITY_LOCATION(0) uniform mediump sampler2D _GlobalSideNoiseTex;
UNITY_LOCATION(1) uniform mediump sampler2D _GlobalTopNoiseTex;
UNITY_LOCATION(2) uniform mediump sampler2D _SDFTex;
UNITY_LOCATION(3) uniform highp sampler2D _StaticShadowMap;
UNITY_LOCATION(4) uniform highp sampler2DShadow hlslcc_zcmp_StaticShadowMap;
UNITY_LOCATION(5) uniform highp sampler2D _DynamicShadowMap;
UNITY_LOCATION(6) uniform highp sampler2DShadow hlslcc_zcmp_DynamicShadowMap;
in highp  vec3 vs_TEXCOORD0;
in mediump  vec4 vs_TEXCOORD1;
in mediump  vec3 vs_TEXCOORD2;
in mediump  vec4 vs_TEXCOORD3;
in highp  vec4 vs_TEXCOORD4;
in mediump  vec4 vs_TEXCOORD5;
in mediump  vec4 vs_TEXCOORD6;
in highp  vec4 vs_TEXCOORD7;
layout(location = 0) out mediump vec4 SV_Target0;
vec3 u_xlat0;
mediump float u_xlat16_0;
bool u_xlatb0;
vec4 u_xlat1;
mediump vec4 u_xlat16_1;
mediump vec3 u_xlat16_2;
vec3 u_xlat3;
mediump vec3 u_xlat16_4;
mediump vec3 u_xlat16_5;
mediump vec3 u_xlat16_6;
vec2 u_xlat7;
mediump float u_xlat16_7;
vec2 u_xlat8;
vec2 u_xlat14;
bool u_xlatb14;
float u_xlat15;
mediump float u_xlat16_15;
bool u_xlatb15;
mediump float u_xlat16_23;
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
        u_xlatb0 = abs(vs_TEXCOORD1.z)<abs(vs_TEXCOORD1.x);
        u_xlat1 = vs_TEXCOORD0.zyxy * vec4(vec4(_GlobalSideTiling, _GlobalSideTiling, _GlobalSideTiling, _GlobalSideTiling));
        u_xlat0.xy = (bool(u_xlatb0)) ? u_xlat1.xy : u_xlat1.zw;
        u_xlat16_0 = texture(_GlobalSideNoiseTex, u_xlat0.xy).x;
        u_xlat7.xy = vs_TEXCOORD0.xz * vec2(vec2(_GlobalTopTiling, _GlobalTopTiling));
        u_xlat16_7 = texture(_GlobalTopNoiseTex, u_xlat7.xy).x;
        u_xlat14.xy = vs_TEXCOORD0.xz + (-_SDFCenterXZ.xy);
        u_xlat14.xy = u_xlat14.xy / vec2(_SDFSizeXZ.x, _SDFSizeXZ.y);
        u_xlat14.xy = u_xlat14.xy + vec2(0.5, 0.5);
        u_xlat16_1 = texture(_SDFTex, u_xlat14.xy);
        u_xlat14.x = u_xlat16_7 * vs_TEXCOORD5.w + 1.0;
        u_xlat0.x = u_xlat16_0 * vs_TEXCOORD6.w + 1.0;
        u_xlat3.xyz = u_xlat0.xxx * vs_TEXCOORD6.xyz;
        u_xlat16_23 = vs_TEXCOORD1.w;
        u_xlat16_23 = clamp(u_xlat16_23, 0.0, 1.0);
        u_xlat16_23 = u_xlat16_23 * u_xlat16_23;
        u_xlat16_4.x = u_xlat16_7 * u_xlat16_7;
        u_xlat16_4.x = u_xlat16_4.x * u_xlat16_4.x;
        u_xlat0.x = u_xlat16_4.x * 0.300000012;
        u_xlat0.x = u_xlat16_23 * u_xlat16_23 + u_xlat0.x;
        u_xlat0.x = min(u_xlat0.x, 1.0);
        u_xlat16_4.xyz = vs_TEXCOORD5.xyz * u_xlat14.xxx + (-u_xlat3.xyz);
        u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat0.xxx + u_xlat3.xyz;
        u_xlat0.x = u_xlat16_7 * _GlobalDetailColor[1].w + 1.0;
        u_xlat1.xyz = u_xlat16_1.yzx * vec3(13.333333, 13.333333, 13.333333) + vec3(u_xlat16_7);
        u_xlat1.xyz = u_xlat1.xyz + vec3(-1.0, -1.0, -1.0);
        u_xlat1.xyz = clamp(u_xlat1.xyz, 0.0, 1.0);
        u_xlat16_5.xyz = _GlobalDetailColor[1].xyz * u_xlat0.xxx + (-u_xlat16_4.xyz);
        u_xlat16_4.xyz = u_xlat1.xxx * u_xlat16_5.xyz + u_xlat16_4.xyz;
        u_xlat0.x = u_xlat16_7 * _GlobalDetailColor[2].w + 1.0;
        u_xlat16_5.xyz = _GlobalDetailColor[2].xyz * u_xlat0.xxx + (-u_xlat16_4.xyz);
        u_xlat16_4.xyz = u_xlat1.yyy * u_xlat16_5.xyz + u_xlat16_4.xyz;
        u_xlat0.x = u_xlat16_1.w * 1.33333337 + 0.5;
        u_xlat16_23 = u_xlat0.x * u_xlat0.x;
        u_xlat16_23 = u_xlat16_23 * u_xlat16_23;
        u_xlat0.x = (-u_xlat16_23) * u_xlat0.x + 1.0;
        u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
        u_xlat14.x = (-u_xlat16_1.w) + 1.0;
        u_xlat14.x = u_xlat14.x * u_xlat14.x;
        u_xlat14.x = (-u_xlat14.x) * 0.800000012 + 0.200000003;
        u_xlat16_5.xyz = (-_GlobalRoadColor1.xyz) + _GlobalRoadColor2.xyz;
        u_xlat16_5.xyz = vec3(u_xlat16_7) * u_xlat16_5.xyz + _GlobalRoadColor1.xyz;
        u_xlat16_6.xyz = (-u_xlat16_5.xyz) + vec3(1.0, 1.0, 1.0);
        u_xlat16_5.xyz = u_xlat14.xxx * u_xlat16_6.xyz + u_xlat16_5.xyz;
        u_xlat16_4.xyz = u_xlat16_4.xyz + (-u_xlat16_5.xyz);
        u_xlat16_4.xyz = u_xlat0.xxx * u_xlat16_4.xyz + u_xlat16_5.xyz;
        u_xlat0.x = u_xlat16_7 * _GlobalDetailColor[0].w + 1.0;
        u_xlat16_5.xyz = _GlobalDetailColor[0].xyz * u_xlat0.xxx + (-u_xlat16_4.xyz);
        u_xlat16_2.xyz = u_xlat1.zzz * u_xlat16_5.xyz + u_xlat16_4.xyz;
    }
    u_xlat16_23 = dot(vs_TEXCOORD1.xyz, _WorldSpaceLightPos0.xyz);
    u_xlat16_23 = clamp(u_xlat16_23, 0.0, 1.0);
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
    u_xlat8.xy = vs_TEXCOORD7.xy + vec2(-0.5, -0.5);
    u_xlat8.xy = -abs(u_xlat8.xy) + vec2(0.5, 0.5);
    u_xlat16_4.xy = u_xlat8.xy * _DynamicShadowEdgeFadeInvWidth.xy;
    u_xlat16_4.xy = clamp(u_xlat16_4.xy, 0.0, 1.0);
    u_xlat8.x = u_xlat16_4.x * vs_TEXCOORD7.w;
    u_xlat8.x = u_xlat16_4.y * u_xlat8.x;
    u_xlatb15 = 9.99999975e-05<u_xlat8.x;
    if(u_xlatb15){
        vec3 txVec2 = vec3(vs_TEXCOORD7.xy,vs_TEXCOORD7.z);
        u_xlat15 = textureLod(hlslcc_zcmp_DynamicShadowMap, txVec2, 0.0);
        u_xlat16_15 = u_xlat15;
    } else {
        u_xlat16_15 = 1.0;
    }
    u_xlat3.x = u_xlat16_15 + -1.0;
    u_xlat3.x = u_xlat8.x * u_xlat3.x + 1.0;
    u_xlat16_23 = u_xlat1.x * u_xlat16_23;
    u_xlat16_23 = u_xlat3.x * u_xlat16_23;
    u_xlat16_4.xyz = _LightColor0.xyz * vec3(u_xlat16_23) + vs_TEXCOORD2.xyz;
    u_xlat16_5.xyz = u_xlat16_2.xyz * u_xlat16_4.xyz;
    u_xlat3.xyz = (-u_xlat16_2.xyz) * u_xlat16_4.xyz + vs_TEXCOORD3.xyz;
    u_xlat3.xyz = vs_TEXCOORD3.www * u_xlat3.xyz + u_xlat16_5.xyz;
    SV_Target0.xyz = u_xlat3.xyz;
    SV_Target0.w = 1.0;
    return;
}
