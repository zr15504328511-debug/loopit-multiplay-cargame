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
uniform 	vec2 _DynamicShadowEdgeFadeInvWidth;
uniform 	float _GlobalTopTiling;
uniform 	float _GlobalSideTiling;
uniform 	vec2 _SDFCenterXZ;
uniform 	vec2 _SDFSizeXZ;
uniform 	mediump vec4 _GlobalDetailColor[4];
uniform 	float _FinishDistance;
UNITY_LOCATION(0) uniform mediump sampler2D _GlobalSideNoiseTex;
UNITY_LOCATION(1) uniform mediump sampler2D _GlobalTopNoiseTex;
UNITY_LOCATION(2) uniform mediump sampler2D _SDFTex;
UNITY_LOCATION(3) uniform mediump sampler2D _GlobalRoadTex;
UNITY_LOCATION(4) uniform highp sampler2D _StaticShadowMap;
UNITY_LOCATION(5) uniform highp sampler2DShadow hlslcc_zcmp_StaticShadowMap;
UNITY_LOCATION(6) uniform highp sampler2D _DynamicShadowMap;
UNITY_LOCATION(7) uniform highp sampler2DShadow hlslcc_zcmp_DynamicShadowMap;
in highp  vec3 vs_TEXCOORD0;
in mediump  vec4 vs_TEXCOORD1;
in mediump  vec3 vs_TEXCOORD2;
in mediump  vec4 vs_TEXCOORD3;
in highp  vec4 vs_TEXCOORD4;
in mediump  vec4 vs_TEXCOORD5;
in mediump  vec4 vs_TEXCOORD6;
in highp  vec4 vs_TEXCOORD7;
layout(location = 0) out mediump vec4 SV_Target0;
vec4 u_xlat0;
mediump vec4 u_xlat16_0;
bool u_xlatb0;
vec4 u_xlat1;
mediump vec4 u_xlat16_1;
mediump vec3 u_xlat16_2;
vec3 u_xlat3;
mediump vec3 u_xlat16_4;
mediump vec3 u_xlat16_5;
vec2 u_xlat6;
mediump float u_xlat16_6;
vec2 u_xlat7;
vec2 u_xlat12;
bool u_xlatb12;
float u_xlat13;
mediump float u_xlat16_13;
bool u_xlatb13;
mediump float u_xlat16_20;
void main()
{
    u_xlat0.y = vs_TEXCOORD0.z + (-_FinishDistance);
    u_xlatb12 = abs(u_xlat0.y)<2.0;
    if(u_xlatb12){
        u_xlat0.x = vs_TEXCOORD0.x;
        u_xlat0.xy = u_xlat0.xy * vec2(0.25, 0.200000003) + vec2(0.0, 0.5);
        u_xlat12.xy = dFdx(u_xlat0.xy);
        u_xlat1.xy = dFdy(u_xlat0.xy);
        u_xlat12.xy = abs(u_xlat12.xy) + abs(u_xlat1.xy);
        u_xlat0.xy = fract(u_xlat0.xy);
        u_xlat0.xy = u_xlat0.xy + vec2(-0.5, -0.5);
        u_xlat12.xy = vec2(0.5, 0.5) / u_xlat12.xy;
        u_xlat0.xy = u_xlat0.xy * u_xlat12.xy + vec2(0.5, 0.5);
        u_xlat0.xy = clamp(u_xlat0.xy, 0.0, 1.0);
        u_xlat16_2.x = (-u_xlat0.y) + u_xlat0.x;
        u_xlat16_2.xyz = abs(u_xlat16_2.xxx);
    } else {
        u_xlatb0 = abs(vs_TEXCOORD1.z)<abs(vs_TEXCOORD1.x);
        u_xlat1 = vs_TEXCOORD0.zyxy * vec4(vec4(_GlobalSideTiling, _GlobalSideTiling, _GlobalSideTiling, _GlobalSideTiling));
        u_xlat0.xy = (bool(u_xlatb0)) ? u_xlat1.xy : u_xlat1.zw;
        u_xlat16_0.x = texture(_GlobalSideNoiseTex, u_xlat0.xy).x;
        u_xlat6.xy = vs_TEXCOORD0.xz * vec2(vec2(_GlobalTopTiling, _GlobalTopTiling));
        u_xlat16_6 = texture(_GlobalTopNoiseTex, u_xlat6.xy).x;
        u_xlat12.xy = vs_TEXCOORD0.xz + (-_SDFCenterXZ.xy);
        u_xlat12.xy = u_xlat12.xy / vec2(_SDFSizeXZ.x, _SDFSizeXZ.y);
        u_xlat12.xy = u_xlat12.xy + vec2(0.5, 0.5);
        u_xlat16_1 = texture(_SDFTex, u_xlat12.xy).wxyz;
        u_xlat12.x = u_xlat16_6 * vs_TEXCOORD5.w + 1.0;
        u_xlat0.x = u_xlat16_0.x * vs_TEXCOORD6.w + 1.0;
        u_xlat3.xyz = u_xlat0.xxx * vs_TEXCOORD6.xyz;
        u_xlat16_20 = vs_TEXCOORD1.w;
        u_xlat16_20 = clamp(u_xlat16_20, 0.0, 1.0);
        u_xlat16_20 = u_xlat16_20 * u_xlat16_20;
        u_xlat16_4.x = u_xlat16_6 * u_xlat16_6;
        u_xlat16_4.x = u_xlat16_4.x * u_xlat16_4.x;
        u_xlat0.x = u_xlat16_4.x * 0.300000012;
        u_xlat0.x = u_xlat16_20 * u_xlat16_20 + u_xlat0.x;
        u_xlat0.x = min(u_xlat0.x, 1.0);
        u_xlat16_4.xyz = vs_TEXCOORD5.xyz * u_xlat12.xxx + (-u_xlat3.xyz);
        u_xlat16_4.xyz = u_xlat16_4.xyz * u_xlat0.xxx + u_xlat3.xyz;
        u_xlat0.x = u_xlat16_6 * _GlobalDetailColor[0].w + 1.0;
        u_xlat12.xy = u_xlat16_1.yz * vec2(13.333333, 13.333333) + vec2(u_xlat16_6);
        u_xlat12.xy = u_xlat12.xy + vec2(-1.0, -1.0);
        u_xlat12.xy = clamp(u_xlat12.xy, 0.0, 1.0);
        u_xlat16_5.xyz = _GlobalDetailColor[0].xyz * u_xlat0.xxx + (-u_xlat16_4.xyz);
        u_xlat16_4.xyz = u_xlat12.xxx * u_xlat16_5.xyz + u_xlat16_4.xyz;
        u_xlat0.x = u_xlat16_6 * _GlobalDetailColor[1].w + 1.0;
        u_xlat16_5.xyz = _GlobalDetailColor[1].xyz * u_xlat0.xxx + (-u_xlat16_4.xyz);
        u_xlat16_4.xyz = u_xlat12.yyy * u_xlat16_5.xyz + u_xlat16_4.xyz;
        u_xlat0.x = u_xlat16_6 * _GlobalDetailColor[2].w + 1.0;
        u_xlat16_20 = max(u_xlat16_1.w, u_xlat16_1.x);
        u_xlat12.x = u_xlat16_20 * 13.333333 + u_xlat16_6;
        u_xlat12.x = u_xlat12.x + -1.0;
        u_xlat12.x = clamp(u_xlat12.x, 0.0, 1.0);
        u_xlat16_5.xyz = _GlobalDetailColor[2].xyz * u_xlat0.xxx + (-u_xlat16_4.xyz);
        u_xlat16_4.xyz = u_xlat12.xxx * u_xlat16_5.xyz + u_xlat16_4.xyz;
        u_xlat16_1.y = 0.0;
        u_xlat16_0.xzw = texture(_GlobalRoadTex, u_xlat16_1.xy).xyz;
        u_xlat0.xzw = vec3(u_xlat16_6) * vec3(0.100000001, 0.100000001, 0.100000001) + u_xlat16_0.xzw;
        u_xlat1.x = u_xlat16_1.x + -0.25;
        u_xlat6.x = u_xlat1.x * 13.333333 + u_xlat16_6;
        u_xlat6.x = u_xlat6.x + -1.0;
        u_xlat6.x = clamp(u_xlat6.x, 0.0, 1.0);
        u_xlat16_5.xyz = (-u_xlat16_4.xyz) + u_xlat0.xzw;
        u_xlat16_2.xyz = u_xlat6.xxx * u_xlat16_5.xyz + u_xlat16_4.xyz;
    }
    u_xlat16_20 = dot(vs_TEXCOORD1.xyz, _WorldSpaceLightPos0.xyz);
    u_xlat16_20 = clamp(u_xlat16_20, 0.0, 1.0);
    u_xlatb0 = 9.99999975e-05<vs_TEXCOORD4.w;
    if(u_xlatb0){
        vec3 txVec0 = vec3(vs_TEXCOORD4.xy,vs_TEXCOORD4.z);
        u_xlat0.x = textureLod(hlslcc_zcmp_StaticShadowMap, txVec0, 0.0);
        u_xlat16_0.x = u_xlat0.x;
    } else {
        u_xlat16_0.x = 1.0;
    }
    u_xlat1.x = u_xlat16_0.x + -1.0;
    u_xlat1.x = vs_TEXCOORD4.w * u_xlat1.x + 1.0;
    u_xlat7.xy = vs_TEXCOORD7.xy + vec2(-0.5, -0.5);
    u_xlat7.xy = -abs(u_xlat7.xy) + vec2(0.5, 0.5);
    u_xlat16_4.xy = u_xlat7.xy * _DynamicShadowEdgeFadeInvWidth.xy;
    u_xlat16_4.xy = clamp(u_xlat16_4.xy, 0.0, 1.0);
    u_xlat7.x = u_xlat16_4.x * vs_TEXCOORD7.w;
    u_xlat7.x = u_xlat16_4.y * u_xlat7.x;
    u_xlatb13 = 9.99999975e-05<u_xlat7.x;
    if(u_xlatb13){
        vec3 txVec1 = vec3(vs_TEXCOORD7.xy,vs_TEXCOORD7.z);
        u_xlat13 = textureLod(hlslcc_zcmp_DynamicShadowMap, txVec1, 0.0);
        u_xlat16_13 = u_xlat13;
    } else {
        u_xlat16_13 = 1.0;
    }
    u_xlat3.x = u_xlat16_13 + -1.0;
    u_xlat3.x = u_xlat7.x * u_xlat3.x + 1.0;
    u_xlat16_20 = u_xlat1.x * u_xlat16_20;
    u_xlat16_20 = u_xlat3.x * u_xlat16_20;
    u_xlat16_4.xyz = _LightColor0.xyz * vec3(u_xlat16_20) + vs_TEXCOORD2.xyz;
    u_xlat16_5.xyz = u_xlat16_2.xyz * u_xlat16_4.xyz;
    u_xlat3.xyz = (-u_xlat16_2.xyz) * u_xlat16_4.xyz + vs_TEXCOORD3.xyz;
    u_xlat3.xyz = vs_TEXCOORD3.www * u_xlat3.xyz + u_xlat16_5.xyz;
    SV_Target0.xyz = u_xlat3.xyz;
    SV_Target0.w = 1.0;
    return;
}
