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
uniform 	mediump vec4 unity_SHBr;
uniform 	mediump vec4 unity_SHBg;
uniform 	mediump vec4 unity_SHBb;
uniform 	mediump vec4 unity_SHC;
uniform 	vec4 hlslcc_mtx4x4unity_ObjectToWorld[4];
uniform 	vec4 hlslcc_mtx4x4unity_WorldToObject[4];
uniform 	vec4 hlslcc_mtx4x4unity_MatrixVP[4];
uniform 	vec4 _MainTex_ST;
uniform 	vec4 _DetailAlbedoMap_ST;
uniform 	mediump float _UVSec;
uniform 	float _FogStart;
uniform 	float _FogRcpRange;
uniform 	mediump vec4 _SkyboxTopColor;
uniform 	mediump vec4 _SkyboxHorizonColor;
uniform 	mediump vec4 _SkyboxBottomColor;
uniform 	float _FogEditorMultiplier;
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
in highp vec4 in_POSITION0;
in mediump vec3 in_NORMAL0;
in highp vec2 in_TEXCOORD0;
in highp vec4 in_TEXCOORD1;
out highp vec4 vs_TEXCOORD0;
out highp vec4 vs_TEXCOORD1;
out highp vec3 vs_TEXCOORD2;
out mediump vec4 vs_TEXCOORD3;
out highp vec4 vs_TEXCOORD4;
out mediump vec4 vs_TEXCOORD5;
highp vec4 vs_TEXCOORD7;
out highp vec3 vs_TEXCOORD8;
out highp vec4 vs_TEXCOORD9;
vec4 u_xlat0;
bool u_xlatb0;
vec4 u_xlat1;
mediump vec4 u_xlat16_1;
vec3 u_xlat2;
mediump float u_xlat16_3;
mediump vec3 u_xlat16_4;
vec3 u_xlat5;
mediump vec3 u_xlat16_9;
float u_xlat18;
bool u_xlatb18;
float u_xlat19;
mediump float u_xlat16_19;
bool u_xlatb19;
void main()
{
    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];
    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;
    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;
    u_xlat0 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];
    u_xlat1 = u_xlat0.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat0.xxxx + u_xlat1;
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat0.zzzz + u_xlat1;
    gl_Position = hlslcc_mtx4x4unity_MatrixVP[3] * u_xlat0.wwww + u_xlat1;
    u_xlatb0 = _UVSec==0.0;
    u_xlat0.xy = (bool(u_xlatb0)) ? in_TEXCOORD0.xy : in_TEXCOORD1.xy;
    vs_TEXCOORD0.zw = u_xlat0.xy * _DetailAlbedoMap_ST.xy + _DetailAlbedoMap_ST.zw;
    vs_TEXCOORD0.xy = in_TEXCOORD0.xy * _MainTex_ST.xy + _MainTex_ST.zw;
    vs_TEXCOORD1.w = 0.0;
    u_xlat0.xyz = in_POSITION0.yyy * hlslcc_mtx4x4unity_ObjectToWorld[1].xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[0].xyz * in_POSITION0.xxx + u_xlat0.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[2].xyz * in_POSITION0.zzz + u_xlat0.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.xyz;
    u_xlat1.xyz = u_xlat0.xyz + (-_WorldSpaceCameraPos.xyz);
    vs_TEXCOORD1.xyz = u_xlat1.xyz;
    u_xlat2.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);
    u_xlat2.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);
    u_xlat2.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);
    u_xlat18 = dot(u_xlat2.xyz, u_xlat2.xyz);
    u_xlat18 = inversesqrt(u_xlat18);
    u_xlat2.xyz = vec3(u_xlat18) * u_xlat2.xyz;
    vs_TEXCOORD2.xyz = u_xlat2.xyz;
    u_xlat18 = dot(u_xlat1.xyz, u_xlat1.xyz);
    u_xlat19 = inversesqrt(u_xlat18);
    u_xlat18 = u_xlat18 * u_xlat19 + (-_FogStart);
    u_xlat16_19 = u_xlat19 * u_xlat1.y;
    u_xlat18 = u_xlat18 * _FogRcpRange;
    u_xlat18 = clamp(u_xlat18, 0.0, 1.0);
    u_xlat16_3 = -abs(u_xlat16_19) + 1.0;
    u_xlatb19 = 0.0<u_xlat16_19;
    u_xlat16_9.xyz = (bool(u_xlatb19)) ? _SkyboxTopColor.xyz : _SkyboxBottomColor.xyz;
    u_xlat16_4.x = u_xlat16_3 * u_xlat16_3;
    u_xlat16_3 = (-u_xlat16_4.x) * u_xlat16_3 + 1.0;
    u_xlat16_4.x = (-u_xlat16_3) + 1.0;
    u_xlat16_4.xyz = u_xlat16_4.xxx * _SkyboxHorizonColor.xyz;
    vs_TEXCOORD3.xyz = u_xlat16_9.xyz * vec3(u_xlat16_3) + u_xlat16_4.xyz;
    u_xlat19 = u_xlat18 * u_xlat18;
    u_xlat18 = (-u_xlat18) * 2.0 + 3.0;
    u_xlat18 = u_xlat18 * u_xlat19;
    u_xlat18 = u_xlat18 * _FogEditorMultiplier;
    vs_TEXCOORD3.w = u_xlat18;
    u_xlat5.xyz = u_xlat0.yyy * hlslcc_mtx4x4_StaticShadowMatrix[1].zxy;
    u_xlat5.xyz = hlslcc_mtx4x4_StaticShadowMatrix[0].zxy * u_xlat0.xxx + u_xlat5.xyz;
    u_xlat5.xyz = hlslcc_mtx4x4_StaticShadowMatrix[2].zxy * u_xlat0.zzz + u_xlat5.xyz;
    u_xlat5.xyz = u_xlat5.xyz + hlslcc_mtx4x4_StaticShadowMatrix[3].zxy;
    u_xlat18 = max(abs(u_xlat5.z), abs(u_xlat5.y));
    u_xlat5.xyz = u_xlat5.xyz * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);
    u_xlatb18 = u_xlat18>=1.0;
    u_xlat19 = dot(u_xlat1.xyz, _ShadowFadeLightDir.xyz);
    u_xlat1.xyz = (-_ShadowFadeLightDir.xyz) * vec3(u_xlat19) + u_xlat1.xyz;
    u_xlat1.x = dot(u_xlat1.xyz, u_xlat1.xyz);
    u_xlat1.x = sqrt(u_xlat1.x);
    u_xlat16_3 = (-u_xlat1.x) + _StaticShadowFadeEnd;
    u_xlat16_9.x = (-u_xlat1.x) + _DynamicShadowFadeEnd;
    u_xlat16_9.x = u_xlat16_9.x * _DynamicShadowFadeInvRange;
    u_xlat16_9.x = clamp(u_xlat16_9.x, 0.0, 1.0);
    u_xlat16_9.x = u_xlat16_9.x * _DynamicShadowStrength;
    vs_TEXCOORD9.w = u_xlat16_9.x;
    u_xlat16_3 = u_xlat16_3 * _StaticShadowFadeInvRange;
    u_xlat16_3 = clamp(u_xlat16_3, 0.0, 1.0);
    u_xlat1.x = u_xlat16_3 * _StaticShadowStrength;
    u_xlat16_3 = (u_xlatb18) ? 0.0 : u_xlat1.x;
    vs_TEXCOORD4.w = u_xlat16_3;
    vs_TEXCOORD4.z = u_xlat5.x + (-_StaticShadowBias);
    vs_TEXCOORD4.xy = u_xlat5.yz;
    u_xlat16_3 = u_xlat2.y * u_xlat2.y;
    u_xlat16_3 = u_xlat2.x * u_xlat2.x + (-u_xlat16_3);
    u_xlat16_1 = u_xlat2.yzzx * u_xlat2.xyzz;
    u_xlat16_4.x = dot(unity_SHBr, u_xlat16_1);
    u_xlat16_4.y = dot(unity_SHBg, u_xlat16_1);
    u_xlat16_4.z = dot(unity_SHBb, u_xlat16_1);
    vs_TEXCOORD5.xyz = unity_SHC.xyz * vec3(u_xlat16_3) + u_xlat16_4.xyz;
    vs_TEXCOORD5.w = 0.0;
    vs_TEXCOORD7 = vec4(0.0, 0.0, 0.0, 0.0);
    vs_TEXCOORD8.xyz = u_xlat0.xyz;
    u_xlat2.xyz = u_xlat0.yyy * hlslcc_mtx4x4_DynamicShadowMatrix[1].zxy;
    u_xlat0.xyw = hlslcc_mtx4x4_DynamicShadowMatrix[0].zxy * u_xlat0.xxx + u_xlat2.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4_DynamicShadowMatrix[2].zxy * u_xlat0.zzz + u_xlat0.xyw;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4_DynamicShadowMatrix[3].zxy;
    u_xlat0.xyz = u_xlat0.xyz * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);
    vs_TEXCOORD9.z = u_xlat0.x + (-_DynamicShadowBias);
    vs_TEXCOORD9.xy = u_xlat0.yz;
    return;
}
