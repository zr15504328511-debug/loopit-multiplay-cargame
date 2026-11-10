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
uniform 	mediump float _FarClipClamp;
in highp vec4 in_POSITION0;
in highp vec3 in_NORMAL0;
out highp vec3 vs_TEXCOORD0;
out mediump vec3 vs_TEXCOORD1;
out mediump vec3 vs_TEXCOORD2;
out mediump vec4 vs_TEXCOORD3;
out highp vec4 vs_TEXCOORD4;
out highp vec4 vs_TEXCOORD5;
vec4 u_xlat0;
vec4 u_xlat1;
vec4 u_xlat2;
mediump vec3 u_xlat16_3;
mediump vec4 u_xlat16_4;
mediump vec3 u_xlat16_5;
vec3 u_xlat6;
bool u_xlatb6;
vec3 u_xlat7;
mediump vec3 u_xlat16_11;
float u_xlat14;
float u_xlat24;
bool u_xlatb24;
float u_xlat26;
bool u_xlatb26;
mediump float u_xlat16_27;
mediump float u_xlat16_30;
void main()
{
    u_xlat0 = in_POSITION0.yyyy * hlslcc_mtx4x4unity_ObjectToWorld[1];
    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[0] * in_POSITION0.xxxx + u_xlat0;
    u_xlat0 = hlslcc_mtx4x4unity_ObjectToWorld[2] * in_POSITION0.zzzz + u_xlat0;
    u_xlat1 = u_xlat0 + hlslcc_mtx4x4unity_ObjectToWorld[3];
    u_xlat2 = u_xlat1.yyyy * hlslcc_mtx4x4unity_MatrixVP[1];
    u_xlat2 = hlslcc_mtx4x4unity_MatrixVP[0] * u_xlat1.xxxx + u_xlat2;
    u_xlat2 = hlslcc_mtx4x4unity_MatrixVP[2] * u_xlat1.zzzz + u_xlat2;
    u_xlat1 = hlslcc_mtx4x4unity_MatrixVP[3].zxyw * u_xlat1.wwww + u_xlat2.zxyw;
    u_xlatb24 = 0.5<_FarClipClamp;
    if(u_xlatb24){
        u_xlat24 = u_xlat1.w * 0.999989986;
        u_xlat1.x = min(u_xlat24, u_xlat1.x);
    }
    u_xlat0.xyz = hlslcc_mtx4x4unity_ObjectToWorld[3].xyz * in_POSITION0.www + u_xlat0.xyz;
    u_xlat2.x = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[0].xyz);
    u_xlat2.y = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[1].xyz);
    u_xlat2.z = dot(in_NORMAL0.xyz, hlslcc_mtx4x4unity_WorldToObject[2].xyz);
    u_xlat24 = dot(u_xlat2.xyz, u_xlat2.xyz);
    u_xlat24 = inversesqrt(u_xlat24);
    u_xlat2.xyz = vec3(u_xlat24) * u_xlat2.xyz;
    u_xlat2.w = 1.0;
    u_xlat16_3.x = dot(unity_SHAr, u_xlat2);
    u_xlat16_3.y = dot(unity_SHAg, u_xlat2);
    u_xlat16_3.z = dot(unity_SHAb, u_xlat2);
    u_xlat16_4 = u_xlat2.yzzx * u_xlat2.xyzz;
    u_xlat16_5.x = dot(unity_SHBr, u_xlat16_4);
    u_xlat16_5.y = dot(unity_SHBg, u_xlat16_4);
    u_xlat16_5.z = dot(unity_SHBb, u_xlat16_4);
    u_xlat16_27 = u_xlat2.y * u_xlat2.y;
    u_xlat16_27 = u_xlat2.x * u_xlat2.x + (-u_xlat16_27);
    u_xlat16_4.xyz = unity_SHC.xyz * vec3(u_xlat16_27) + u_xlat16_5.xyz;
    vs_TEXCOORD2.xyz = u_xlat16_3.xyz + u_xlat16_4.xyz;
    u_xlat6.xyz = u_xlat0.xyz + (-_WorldSpaceCameraPos.xyz);
    u_xlat24 = dot(u_xlat6.xyz, u_xlat6.xyz);
    u_xlat26 = inversesqrt(u_xlat24);
    u_xlat16_30 = u_xlat26 * u_xlat6.y;
    u_xlat24 = u_xlat24 * u_xlat26 + (-_FogStart);
    u_xlat24 = u_xlat24 * _FogRcpRange;
    u_xlat24 = clamp(u_xlat24, 0.0, 1.0);
    u_xlat26 = u_xlat24 * u_xlat24;
    u_xlat24 = (-u_xlat24) * 2.0 + 3.0;
    u_xlat24 = u_xlat24 * u_xlat26;
    u_xlat24 = u_xlat24 * _FogEditorMultiplier;
    u_xlat16_3.x = -abs(u_xlat16_30) + 1.0;
    u_xlat16_11.x = u_xlat16_3.x * u_xlat16_3.x;
    u_xlat16_3.x = (-u_xlat16_11.x) * u_xlat16_3.x + 1.0;
    u_xlat16_11.x = (-u_xlat16_3.x) + 1.0;
    u_xlatb26 = 0.0<u_xlat16_30;
    u_xlat16_4.xyz = (bool(u_xlatb26)) ? _SkyboxTopColor.xyz : _SkyboxBottomColor.xyz;
    u_xlat16_11.xyz = u_xlat16_11.xxx * _SkyboxHorizonColor.xyz;
    vs_TEXCOORD3.xyz = u_xlat16_4.xyz * u_xlat16_3.xxx + u_xlat16_11.xyz;
    u_xlat26 = dot(u_xlat6.xyz, _ShadowFadeLightDir.xyz);
    u_xlat6.xyz = (-_ShadowFadeLightDir.xyz) * vec3(u_xlat26) + u_xlat6.xyz;
    u_xlat26 = dot(u_xlat6.xyz, u_xlat6.xyz);
    u_xlat26 = sqrt(u_xlat26);
    u_xlat6.xyz = u_xlat0.yyy * hlslcc_mtx4x4_StaticShadowMatrix[1].zxy;
    u_xlat6.xyz = hlslcc_mtx4x4_StaticShadowMatrix[0].zxy * u_xlat0.xxx + u_xlat6.xyz;
    u_xlat6.xyz = hlslcc_mtx4x4_StaticShadowMatrix[2].zxy * u_xlat0.zzz + u_xlat6.xyz;
    u_xlat6.xyz = u_xlat6.xyz + hlslcc_mtx4x4_StaticShadowMatrix[3].zxy;
    u_xlat7.xyz = u_xlat6.xyz * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);
    vs_TEXCOORD4.z = u_xlat7.x + (-_StaticShadowBias);
    u_xlat16_3.x = (-u_xlat26) + _StaticShadowFadeEnd;
    u_xlat16_3.x = u_xlat16_3.x * _StaticShadowFadeInvRange;
    u_xlat16_3.x = clamp(u_xlat16_3.x, 0.0, 1.0);
    u_xlat6.x = max(abs(u_xlat6.z), abs(u_xlat6.y));
    u_xlatb6 = u_xlat6.x>=1.0;
    u_xlat14 = u_xlat16_3.x * _StaticShadowStrength;
    u_xlat16_3.x = (u_xlatb6) ? 0.0 : u_xlat14;
    u_xlat6.xyz = u_xlat0.yyy * hlslcc_mtx4x4_DynamicShadowMatrix[1].zxy;
    u_xlat6.xyz = hlslcc_mtx4x4_DynamicShadowMatrix[0].zxy * u_xlat0.xxx + u_xlat6.xyz;
    u_xlat6.xyz = hlslcc_mtx4x4_DynamicShadowMatrix[2].zxy * u_xlat0.zzz + u_xlat6.xyz;
    u_xlat6.xyz = u_xlat6.xyz + hlslcc_mtx4x4_DynamicShadowMatrix[3].zxy;
    u_xlat6.xyz = u_xlat6.xyz * vec3(0.5, 0.5, 0.5) + vec3(0.5, 0.5, 0.5);
    vs_TEXCOORD5.z = u_xlat6.x + (-_DynamicShadowBias);
    u_xlat16_11.x = (-u_xlat26) + _DynamicShadowFadeEnd;
    u_xlat16_11.x = u_xlat16_11.x * _DynamicShadowFadeInvRange;
    u_xlat16_11.x = clamp(u_xlat16_11.x, 0.0, 1.0);
    u_xlat16_11.x = u_xlat16_11.x * _DynamicShadowStrength;
    gl_Position = u_xlat1.yzxw;
    vs_TEXCOORD0.xyz = u_xlat0.xyz;
    vs_TEXCOORD3.w = u_xlat24;
    vs_TEXCOORD1.xyz = u_xlat2.xyz;
    vs_TEXCOORD4.xy = u_xlat7.yz;
    vs_TEXCOORD4.w = u_xlat16_3.x;
    vs_TEXCOORD5.xy = u_xlat6.yz;
    vs_TEXCOORD5.w = u_xlat16_11.x;
    return;
}
