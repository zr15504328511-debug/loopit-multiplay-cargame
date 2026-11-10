#version 300 es

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
uniform 	vec3 _WorldSpaceCameraPos;
uniform 	mediump vec4 unity_SHAr;
uniform 	mediump vec4 unity_SHAg;
uniform 	mediump vec4 unity_SHAb;
uniform 	mediump vec4 unity_SHBr;
uniform 	mediump vec4 unity_SHBg;
uniform 	mediump vec4 unity_SHBb;
uniform 	mediump vec4 unity_SHC;
uniform 	vec4 hlslcc_mtx4x4unity_ObjectToWorld[4];
uniform 	vec4 hlslcc_mtx4x4unity_WorldToObject[4];
uniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];
uniform 	vec4 hlslcc_mtx4x4_StaticShadowMatrix[4];
uniform 	float _StaticShadowBias;
uniform 	float _StaticShadowStrength;
uniform 	float _StaticShadowFadeEnd;
uniform 	float _StaticShadowFadeInvRange;
uniform 	vec3 _ShadowFadeLightDir;
uniform 	vec4 hlslcc_mtx4x4_DynamicShadowMatrix[4];
uniform 	float _DynamicShadowBias;
uniform 	float _DynamicShadowStrength;
uniform 	float _DynamicShadowFadeEnd;
uniform 	float _DynamicShadowFadeInvRange;
uniform 	float _FogStart;
uniform 	float _FogRcpRange;
uniform 	mediump vec4 _SkyboxTopColor;
uniform 	mediump vec4 _SkyboxHorizonColor;
uniform 	mediump vec4 _SkyboxBottomColor;
uniform 	float _FogEditorMultiplier;
uniform 	mediump vec4 _GlobalMainColor[4];
uniform 	mediump vec4 _GlobalSideColor[4];
uniform 	float _GlobalTopSpreadsArr[4];
in highp vec4 in_POSITION0;
in highp vec3 in_NORMAL0;
in highp vec4 in_COLOR0;
out highp vec3 vs_TEXCOORD0;
out mediump float vs_TEXCOORD8;
out mediump vec4 vs_TEXCOORD1;
out mediump vec3 vs_TEXCOORD2;
out mediump vec4 vs_TEXCOORD4;
out highp vec4 vs_TEXCOORD5;
out mediump vec4 vs_TEXCOORD6;
out mediump vec4 vs_TEXCOORD7;
out highp vec4 vs_TEXCOORD9;
vec4 u_xlat0;
vec4 u_xlat1;
mediump vec4 u_xlat16_1;
vec4 u_xlat2;
mediump vec3 u_xlat16_3;
mediump vec3 u_xlat16_4;
vec3 u_xlat5;
mediump vec3 u_xlat16_9;
float u_xlat18;
bool u_xlatb18;
float u_xlat20;
mediump float u_xlat16_20;
bool u_xlatb20;
void main()
{
    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];
    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;
    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;
    u_xlat1 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.xyz;
    u_xlat2 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat2 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat2;
    u_xlat2 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat2;
    gl_Position = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat1.wwww + u_xlat2;
    vs_TEXCOORD0.xyz = u_xlat0.xyz;
    u_xlat1.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);
    u_xlat1.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);
    u_xlat1.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);
    u_xlat18 = dot(u_xlat1.xyz, u_xlat1.xyz);
    u_xlat18 = inversesqrt(u_xlat18);
    u_xlat2.w = u_xlat1.y * u_xlat18 + _GlobalTopSpreadsArr[0];
    u_xlat2.xyz = vec3(u_xlat18) * u_xlat1.xyz;
    vs_TEXCOORD1 = u_xlat2;
    u_xlat16_3.x = u_xlat2.y * u_xlat2.y;
    u_xlat16_3.x = u_xlat2.x * u_xlat2.x + (-u_xlat16_3.x);
    u_xlat16_1 = u_xlat2.yzzx * u_xlat2.xyzz;
    u_xlat16_4.x = dot(unity_SHBr, u_xlat16_1);
    u_xlat16_4.y = dot(unity_SHBg, u_xlat16_1);
    u_xlat16_4.z = dot(unity_SHBb, u_xlat16_1);
    u_xlat16_3.xyz = unity_SHC.xyz * u_xlat16_3.xxx + u_xlat16_4.xyz;
    u_xlat2.w = 1.0;
    u_xlat16_4.x = dot(unity_SHAr, u_xlat2);
    u_xlat16_4.y = dot(unity_SHAg, u_xlat2);
    u_xlat16_4.z = dot(unity_SHAb, u_xlat2);
    vs_TEXCOORD2.xyz = u_xlat16_3.xyz + u_xlat16_4.xyz;
    u_xlat2.xyz = u_xlat0.xyz + (-_WorldSpaceCameraPos.xyz);
    u_xlat18 = dot(u_xlat2.xyz, u_xlat2.xyz);
    u_xlat20 = inversesqrt(u_xlat18);
    u_xlat18 = u_xlat18 * u_xlat20 + (-_FogStart);
    u_xlat16_20 = u_xlat20 * u_xlat2.y;
    u_xlat18 = u_xlat18 * _FogRcpRange;
    u_xlat18 = clamp(u_xlat18, 0.0, 1.0);
    u_xlat16_3.x = -abs(u_xlat16_20) + 1.0;
    u_xlatb20 = 0.0<u_xlat16_20;
    u_xlat16_9.xyz = (bool(u_xlatb20)) ? _SkyboxTopColor.xyz : _SkyboxBottomColor.xyz;
    u_xlat16_4.x = u_xlat16_3.x * u_xlat16_3.x;
    u_xlat16_3.x = (-u_xlat16_4.x) * u_xlat16_3.x + 1.0;
    u_xlat16_4.x = (-u_xlat16_3.x) + 1.0;
    u_xlat16_4.xyz = u_xlat16_4.xxx * _SkyboxHorizonColor.xyz;
    vs_TEXCOORD4.xyz = u_xlat16_9.xyz * u_xlat16_3.xxx + u_xlat16_4.xyz;
    u_xlat20 = u_xlat18 * u_xlat18;
    u_xlat18 = (-u_xlat18) * 2.0 + 3.0;
    u_xlat18 = u_xlat18 * u_xlat20;
    u_xlat18 = u_xlat18 * _FogEditorMultiplier;
    vs_TEXCOORD4.w = u_xlat18;
    u_xlat5.xyz = u_xlat0.yyy * hlslcc_mtx4x4_StaticShadowMatrix[1].zxy;
    u_xlat5.xyz = hlslcc_mtx4x4_StaticShadowMatrix[0].zxy * u_xlat0.xxx + u_xlat5.xyz;
    u_xlat5.xyz = hlslcc_mtx4x4_StaticShadowMatrix[2].zxy * u_xlat0.zzz + u_xlat5.xyz;
    u_xlat5.xyz = u_xlat5.xyz + hlslcc_mtx4x4_StaticShadowMatrix[3].zxy;
    u_xlat18 = max(abs(u_xlat5.z), abs(u_xlat5.y));
    u_xlat5.xyz = u_xlat5.xyz * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);
    u_xlatb18 = u_xlat18>=1.0;
    u_xlat20 = dot(u_xlat2.xyz, _ShadowFadeLightDir.xyz);
    u_xlat2.xyz = (-_ShadowFadeLightDir.xyz) * vec3(u_xlat20) + u_xlat2.xyz;
    u_xlat2.x = dot(u_xlat2.xyz, u_xlat2.xyz);
    u_xlat2.x = sqrt(u_xlat2.x);
    u_xlat16_3.x = (-u_xlat2.x) + _StaticShadowFadeEnd;
    u_xlat16_9.x = (-u_xlat2.x) + _DynamicShadowFadeEnd;
    u_xlat16_9.x = u_xlat16_9.x * _DynamicShadowFadeInvRange;
    u_xlat16_9.x = clamp(u_xlat16_9.x, 0.0, 1.0);
    u_xlat16_9.x = u_xlat16_9.x * _DynamicShadowStrength;
    vs_TEXCOORD9.w = u_xlat16_9.x;
    u_xlat16_3.x = u_xlat16_3.x * _StaticShadowFadeInvRange;
    u_xlat16_3.x = clamp(u_xlat16_3.x, 0.0, 1.0);
    u_xlat2.x = u_xlat16_3.x * _StaticShadowStrength;
    u_xlat16_3.x = (u_xlatb18) ? 0.0 : u_xlat2.x;
    vs_TEXCOORD5.w = u_xlat16_3.x;
    vs_TEXCOORD5.z = u_xlat5.x + (-_StaticShadowBias);
    vs_TEXCOORD5.xy = u_xlat5.yz;
    vs_TEXCOORD6 = _GlobalMainColor[0];
    vs_TEXCOORD7 = _GlobalSideColor[0];
    vs_TEXCOORD8 = in_COLOR0.x;
    u_xlat2.xyz = u_xlat0.yyy * hlslcc_mtx4x4_DynamicShadowMatrix[1].zxy;
    u_xlat0.xyw = hlslcc_mtx4x4_DynamicShadowMatrix[0].zxy * u_xlat0.xxx + u_xlat2.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4_DynamicShadowMatrix[2].zxy * u_xlat0.zzz + u_xlat0.xyw;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4_DynamicShadowMatrix[3].zxy;
    u_xlat0.xyz = u_xlat0.xyz * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);
    vs_TEXCOORD9.z = u_xlat0.x + (-_DynamicShadowBias);
    vs_TEXCOORD9.xy = u_xlat0.yz;
    return;
}
