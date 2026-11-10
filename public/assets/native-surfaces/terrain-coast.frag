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
uniform 	vec4 hlslcc_mtx4x4_StaticShadowMatrix2[4];
uniform 	float _StaticShadowDebugMode2;
uniform 	vec2 _SDFCenterXZ;
uniform 	vec2 _SDFSizeXZ;
uniform 	mediump vec4 _GlobalDetailColor[4];
uniform 	mediump vec4 _GlobalRoadColor1;
uniform 	mediump vec4 _GlobalRoadColor2;
uniform 	mediump vec4 _TopColor1;
uniform 	mediump vec4 _TopColor2;
uniform 	mediump vec4 _SideColor1;
uniform 	mediump vec4 _SideColor2;
uniform 	float _TopTiling;
uniform 	float _SideTiling;
UNITY_LOCATION(0) uniform mediump sampler2D _GlobalSideNoiseTex;
UNITY_LOCATION(1) uniform mediump sampler2D _GlobalTopNoiseTex;
UNITY_LOCATION(2) uniform mediump sampler2D _SDFTex;
UNITY_LOCATION(3) uniform highp sampler2D _StaticShadowMap2;
UNITY_LOCATION(4) uniform highp sampler2DShadow hlslcc_zcmp_StaticShadowMap2;
in highp  vec3 vs_TEXCOORD0;
in mediump  vec4 vs_TEXCOORD1;
in mediump  vec3 vs_TEXCOORD2;
in mediump  vec4 vs_TEXCOORD3;
in highp  vec4 vs_TEXCOORD4;
layout(location = 0) out mediump vec4 SV_Target0;
vec3 u_xlat0;
mediump float u_xlat16_0;
bool u_xlatb0;
vec4 u_xlat1;
mediump vec3 u_xlat16_2;
mediump vec3 u_xlat16_3;
mediump vec3 u_xlat16_4;
vec3 u_xlat5;
vec2 u_xlat6;
mediump float u_xlat16_6;
vec2 u_xlat12;
mediump vec2 u_xlat16_12;
float u_xlat13;
float u_xlat18;
mediump float u_xlat16_20;
mediump float u_xlat16_21;
void main()
{
    u_xlatb0 = 0.5<_StaticShadowDebugMode2;
    if(u_xlatb0){
        u_xlat0.xyz = vs_TEXCOORD0.yyy * hlslcc_mtx4x4_StaticShadowMatrix2[1].xyz;
        u_xlat0.xyz = hlslcc_mtx4x4_StaticShadowMatrix2[0].xyz * vs_TEXCOORD0.xxx + u_xlat0.xyz;
        u_xlat0.xyz = hlslcc_mtx4x4_StaticShadowMatrix2[2].xyz * vs_TEXCOORD0.zzz + u_xlat0.xyz;
        u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4_StaticShadowMatrix2[3].xyz;
        u_xlat1.xyw = u_xlat0.xyz * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);
        u_xlat0.x = max(abs(u_xlat0.y), abs(u_xlat0.x));
        u_xlatb0 = 1.0>=u_xlat0.x;
        if(u_xlatb0){
            u_xlatb0 = _StaticShadowDebugMode2>=1.5;
            if(u_xlatb0){
                u_xlatb0 = _StaticShadowDebugMode2>=2.5;
                if(u_xlatb0){
                    vec3 txVec0 = vec3(u_xlat1.xy,u_xlat1.w);
                    u_xlat13 = textureLod(hlslcc_zcmp_StaticShadowMap2, txVec0, 0.0);
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
    u_xlatb0 = abs(vs_TEXCOORD1.z)<abs(vs_TEXCOORD1.x);
    u_xlat1 = vs_TEXCOORD0.zyxy * vec4(vec4(_SideTiling, _SideTiling, _SideTiling, _SideTiling));
    u_xlat0.xy = (bool(u_xlatb0)) ? u_xlat1.xy : u_xlat1.zw;
    u_xlat16_0 = texture(_GlobalSideNoiseTex, u_xlat0.xy).x;
    u_xlat6.xy = vs_TEXCOORD0.xz * vec2(vec2(_TopTiling, _TopTiling));
    u_xlat16_6 = texture(_GlobalTopNoiseTex, u_xlat6.xy).x;
    u_xlat12.xy = vs_TEXCOORD0.xz + (-_SDFCenterXZ.xy);
    u_xlat12.xy = u_xlat12.xy / vec2(_SDFSizeXZ.x, _SDFSizeXZ.y);
    u_xlat12.xy = u_xlat12.xy + vec2(0.5, 0.5);
    u_xlat16_12.xy = texture(_SDFTex, u_xlat12.xy).zw;
    u_xlat16_2.xyz = (-_TopColor1.xyz) + _TopColor2.xyz;
    u_xlat16_2.xyz = vec3(u_xlat16_6) * u_xlat16_2.xyz + _TopColor1.xyz;
    u_xlat16_3.xyz = (-_SideColor1.xyz) + _SideColor2.xyz;
    u_xlat16_3.xyz = vec3(u_xlat16_0) * u_xlat16_3.xyz + _SideColor1.xyz;
    u_xlat16_20 = vs_TEXCOORD1.w;
    u_xlat16_20 = clamp(u_xlat16_20, 0.0, 1.0);
    u_xlat16_20 = u_xlat16_20 * u_xlat16_20;
    u_xlat16_21 = u_xlat16_6 * u_xlat16_6;
    u_xlat16_21 = u_xlat16_21 * u_xlat16_21;
    u_xlat0.x = u_xlat16_21 * 0.300000012;
    u_xlat0.x = u_xlat16_20 * u_xlat16_20 + u_xlat0.x;
    u_xlat0.x = min(u_xlat0.x, 1.0);
    u_xlat16_2.xyz = u_xlat16_2.xyz + (-u_xlat16_3.xyz);
    u_xlat16_2.xyz = u_xlat16_2.xyz * u_xlat0.xxx + u_xlat16_3.xyz;
    u_xlat0.x = u_xlat16_12.y * 1.33333337 + 0.5;
    u_xlat16_20 = u_xlat0.x * u_xlat0.x;
    u_xlat16_20 = u_xlat16_20 * u_xlat16_20;
    u_xlat0.x = (-u_xlat16_20) * u_xlat0.x + 1.0;
    u_xlat0.x = clamp(u_xlat0.x, 0.0, 1.0);
    u_xlat18 = (-u_xlat16_12.y) + 1.0;
    u_xlat18 = u_xlat18 * u_xlat18;
    u_xlat18 = (-u_xlat18) * 0.800000012 + 0.200000003;
    u_xlat16_3.xyz = (-_GlobalRoadColor1.xyz) + _GlobalRoadColor2.xyz;
    u_xlat16_3.xyz = vec3(u_xlat16_6) * u_xlat16_3.xyz + _GlobalRoadColor1.xyz;
    u_xlat16_4.xyz = (-u_xlat16_3.xyz) + vec3(1.0, 1.0, 1.0);
    u_xlat16_3.xyz = vec3(u_xlat18) * u_xlat16_4.xyz + u_xlat16_3.xyz;
    u_xlat16_2.xyz = u_xlat16_2.xyz + (-u_xlat16_3.xyz);
    u_xlat16_2.xyz = u_xlat0.xxx * u_xlat16_2.xyz + u_xlat16_3.xyz;
    u_xlat0.x = u_xlat16_6 * _GlobalDetailColor[2].w + 1.0;
    u_xlat6.x = u_xlat16_12.x * 13.333333 + u_xlat16_6;
    u_xlat6.x = u_xlat6.x + -1.0;
    u_xlat6.x = clamp(u_xlat6.x, 0.0, 1.0);
    u_xlat16_3.xyz = _GlobalDetailColor[2].xyz * u_xlat0.xxx + (-u_xlat16_2.xyz);
    u_xlat16_2.xyz = u_xlat6.xxx * u_xlat16_3.xyz + u_xlat16_2.xyz;
    u_xlat16_20 = dot(vs_TEXCOORD1.xyz, _WorldSpaceLightPos0.xyz);
    u_xlat16_20 = clamp(u_xlat16_20, 0.0, 1.0);
    u_xlatb0 = 9.99999975e-05<vs_TEXCOORD4.w;
    if(u_xlatb0){
        vec3 txVec1 = vec3(vs_TEXCOORD4.xy,vs_TEXCOORD4.z);
        u_xlat0.x = textureLod(hlslcc_zcmp_StaticShadowMap2, txVec1, 0.0);
        u_xlat16_0 = u_xlat0.x;
    } else {
        u_xlat16_0 = 1.0;
    }
    u_xlat5.x = u_xlat16_0 + -1.0;
    u_xlat5.x = vs_TEXCOORD4.w * u_xlat5.x + 1.0;
    u_xlat16_20 = u_xlat16_20 * u_xlat5.x;
    u_xlat16_3.xyz = _LightColor0.xyz * vec3(u_xlat16_20) + vs_TEXCOORD2.xyz;
    u_xlat16_4.xyz = u_xlat16_2.xyz * u_xlat16_3.xyz;
    u_xlat5.xyz = (-u_xlat16_2.xyz) * u_xlat16_3.xyz + vs_TEXCOORD3.xyz;
    u_xlat5.xyz = vs_TEXCOORD3.www * u_xlat5.xyz + u_xlat16_4.xyz;
    SV_Target0.xyz = u_xlat5.xyz;
    SV_Target0.w = 1.0;
    return;
}
