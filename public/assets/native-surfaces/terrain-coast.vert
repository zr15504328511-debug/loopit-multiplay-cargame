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
uniform 	vec4 hlslcc_mtx4x4_StaticShadowMatrix2[4];
uniform 	float _StaticShadowBias2;
uniform 	float _StaticShadowStrength2;
uniform 	float _StaticShadowFadeEnd2;
uniform 	float _StaticShadowFadeInvRange2;
uniform 	vec3 _ShadowFadeLightDir2;
uniform 	float _FogStart;
uniform 	float _FogRcpRange;
uniform 	mediump vec4 _SkyboxTopColor;
uniform 	mediump vec4 _SkyboxHorizonColor;
uniform 	mediump vec4 _SkyboxBottomColor;
uniform 	float _FogEditorMultiplier;
uniform 	float _TopSpread;
in highp vec4 in_POSITION0;
in highp vec3 in_NORMAL0;
out highp vec3 vs_TEXCOORD0;
out mediump vec4 vs_TEXCOORD1;
out mediump vec3 vs_TEXCOORD2;
out mediump vec4 vs_TEXCOORD3;
out highp vec4 vs_TEXCOORD4;
vec4 u_xlat0;
vec4 u_xlat1;
vec4 u_xlat2;
mediump vec4 u_xlat16_2;
mediump vec3 u_xlat16_3;
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
    vs_TEXCOORD1.w = u_xlat1.y * u_xlat18 + _TopSpread;
    u_xlat1.xyz = vec3(u_xlat18) * u_xlat1.xyz;
    vs_TEXCOORD1.xyz = u_xlat1.xyz;
    u_xlat16_3.x = u_xlat1.y * u_xlat1.y;
    u_xlat16_3.x = u_xlat1.x * u_xlat1.x + (-u_xlat16_3.x);
    u_xlat16_2 = u_xlat1.yzzx * u_xlat1.xyzz;
    u_xlat16_4.x = dot(unity_SHBr, u_xlat16_2);
    u_xlat16_4.y = dot(unity_SHBg, u_xlat16_2);
    u_xlat16_4.z = dot(unity_SHBb, u_xlat16_2);
    u_xlat16_3.xyz = unity_SHC.xyz * u_xlat16_3.xxx + u_xlat16_4.xyz;
    u_xlat1.w = 1.0;
    u_xlat16_4.x = dot(unity_SHAr, u_xlat1);
    u_xlat16_4.y = dot(unity_SHAg, u_xlat1);
    u_xlat16_4.z = dot(unity_SHAb, u_xlat1);
    vs_TEXCOORD2.xyz = u_xlat16_3.xyz + u_xlat16_4.xyz;
    u_xlat1.xyz = u_xlat0.xyz + (-_WorldSpaceCameraPos.xyz);
    u_xlat18 = dot(u_xlat1.xyz, u_xlat1.xyz);
    u_xlat19 = inversesqrt(u_xlat18);
    u_xlat18 = u_xlat18 * u_xlat19 + (-_FogStart);
    u_xlat16_19 = u_xlat19 * u_xlat1.y;
    u_xlat18 = u_xlat18 * _FogRcpRange;
    u_xlat18 = clamp(u_xlat18, 0.0, 1.0);
    u_xlat16_3.x = -abs(u_xlat16_19) + 1.0;
    u_xlatb19 = 0.0<u_xlat16_19;
    u_xlat16_9.xyz = (bool(u_xlatb19)) ? _SkyboxTopColor.xyz : _SkyboxBottomColor.xyz;
    u_xlat16_4.x = u_xlat16_3.x * u_xlat16_3.x;
    u_xlat16_3.x = (-u_xlat16_4.x) * u_xlat16_3.x + 1.0;
    u_xlat16_4.x = (-u_xlat16_3.x) + 1.0;
    u_xlat16_4.xyz = u_xlat16_4.xxx * _SkyboxHorizonColor.xyz;
    vs_TEXCOORD3.xyz = u_xlat16_9.xyz * u_xlat16_3.xxx + u_xlat16_4.xyz;
    u_xlat19 = u_xlat18 * u_xlat18;
    u_xlat18 = (-u_xlat18) * 2.0 + 3.0;
    u_xlat18 = u_xlat18 * u_xlat19;
    u_xlat18 = u_xlat18 * _FogEditorMultiplier;
    vs_TEXCOORD3.w = u_xlat18;
    u_xlat5.xyz = u_xlat0.yyy * hlslcc_mtx4x4_StaticShadowMatrix2[1].zxy;
    u_xlat0.xyw = hlslcc_mtx4x4_StaticShadowMatrix2[0].zxy * u_xlat0.xxx + u_xlat5.xyz;
    u_xlat0.xyz = hlslcc_mtx4x4_StaticShadowMatrix2[2].zxy * u_xlat0.zzz + u_xlat0.xyw;
    u_xlat0.xyz = u_xlat0.xyz + hlslcc_mtx4x4_StaticShadowMatrix2[3].zxy;
    u_xlat18 = max(abs(u_xlat0.z), abs(u_xlat0.y));
    u_xlat0.xyz = u_xlat0.xyz * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);
    u_xlatb18 = u_xlat18>=1.0;
    u_xlat19 = dot(u_xlat1.xyz, vec3(_ShadowFadeLightDir2.x, _ShadowFadeLightDir2.y, _ShadowFadeLightDir2.z));
    u_xlat1.xyz = (-vec3(_ShadowFadeLightDir2.x, _ShadowFadeLightDir2.y, _ShadowFadeLightDir2.z)) * vec3(u_xlat19) + u_xlat1.xyz;
    u_xlat1.x = dot(u_xlat1.xyz, u_xlat1.xyz);
    u_xlat1.x = sqrt(u_xlat1.x);
    u_xlat16_3.x = (-u_xlat1.x) + _StaticShadowFadeEnd2;
    u_xlat16_3.x = u_xlat16_3.x * _StaticShadowFadeInvRange2;
    u_xlat16_3.x = clamp(u_xlat16_3.x, 0.0, 1.0);
    u_xlat1.x = u_xlat16_3.x * _StaticShadowStrength2;
    u_xlat16_3.x = (u_xlatb18) ? 0.0 : u_xlat1.x;
    vs_TEXCOORD4.w = u_xlat16_3.x;
    vs_TEXCOORD4.z = u_xlat0.x + (-_StaticShadowBias2);
    vs_TEXCOORD4.xy = u_xlat0.yz;
    return;
}
